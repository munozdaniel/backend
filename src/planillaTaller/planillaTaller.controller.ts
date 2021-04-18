import mongoose from 'mongoose';
import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import Controller from '../interfaces/controller.interface';
import validationMiddleware from '../middleware/validation.middleware';
import planillaTallerModel from './planillaTaller.model';
import escapeStringRegexp from 'escape-string-regexp';
import IPlanillaTaller from './planillaTaller.interface';
import planillaTallerOriginalModel from './planillaTallerOriginal.model';
import alumnoModel from '../alumnos/alumno.model';
import asignaturaModel from '../asignaturas/asignatura.model';
import profesorModel from '../profesores/profesor.model';
import { IQueryPaginator } from '../utils/interfaces/iQueryPaginator';
import CrearPlanillaTallerDto from './planillaTaller.dto';
import cursoModel from '../cursos/curso.model';
import ICicloLectivo from '../ciclolectivos/ciclolectivo.interface';
import ciclolectivoModel from '../ciclolectivos/ciclolectivo.model';
import NotFoundException from '../exceptions/NotFoundException';
import calendarioModel from '../calendario/calendario.model';
import moment from 'moment';

const ObjectId = mongoose.Types.ObjectId;
class PlanillaTallerController implements Controller {
  public path = '/planilla-taller';
  public router = Router();
  private calendario = calendarioModel;
  private planillaTaller = planillaTallerModel;
  private asignatura = asignaturaModel;
  private profesor = profesorModel;
  private planillaTallerOriginal = planillaTallerOriginalModel;
  private curso = cursoModel;
  private alumno = alumnoModel;
  private ciclolectivo = ciclolectivoModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    console.log('PlanillaTallerController/initializeRoutes');
    this.router.get(`${this.path}/migrar`, this.migrarPlanillaTalleres);
    this.router.get(`${this.path}/paginar`, this.paginar);
    this.router.get(`${this.path}/ciclo/:ciclo`, this.obtenerPlanillaTalleresPorCiclo);
    this.router.get(`${this.path}/filtro/:id/:ciclo`, this.obtenerPlanillaTallerPorIdCiclo);
    this.router.get(`${this.path}/:id`, this.obtenerPlanillaTallerPorId);
    this.router.get(`${this.path}/:id/total-asistencias`, this.buscarTotalAsistenciaPorPlanilla);
    this.router.put(`${this.path}`, this.agregar);
    this.router.post(`${this.path}/por-curso-ciclo`, this.obtenerPlanillasPorCursoCiclo);
    this.router.patch(`${this.path}/:id`, this.actualizar);
  }

  private obtenerPlanillasPorCursoCiclo = async (request: Request, response: Response, next: NextFunction) => {
    const { curso, comision, division, cicloLectivo } = request.body;
    const opciones: any = [
      {
        $lookup: {
          from: 'profesores',
          localField: 'profesor',
          foreignField: '_id',
          as: 'profesor',
        },
      },
      {
        $unwind: {
          path: '$profesor',
        },
      },
      {
        $lookup: {
          from: 'asignaturas',
          localField: 'asignatura',
          foreignField: '_id',
          as: 'asignatura',
        },
      },
      {
        $unwind: {
          path: '$asignatura',
        },
      },
      {
        $lookup: {
          from: 'cursos',
          localField: 'curso',
          foreignField: '_id',
          as: 'curso',
        },
      },
      {
        $unwind: {
          path: '$curso',
        },
      },
      {
        $lookup: {
          from: 'ciclolectivos',
          localField: 'cicloLectivo',
          foreignField: '_id',
          as: 'cicloLectivo',
        },
      },
      {
        $unwind: {
          path: '$cicloLectivo',
        },
      },
      {
        $match: {
          'curso.curso': Number(curso),
          'curso.comision': comision,
          'curso.division': Number(division),
          'cicloLectivo._id': ObjectId(cicloLectivo._id),
        },
      },
      { $sort: { _id: -1 } },
    ];

    const planillaTallerAggregate = await this.planillaTaller.aggregate(opciones);
    try {
      response.send({ planillasTaller: planillaTallerAggregate });
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Error Interno'));
    }
  };
  private actualizar = async (request: Request, response: Response, next: NextFunction) => {
    const id = escapeStringRegexp(request.params.id);
    try {
      const planillaTaller = request.body;
      // Si cambia las fechas buscar el ciclo
      const cicloLectivo = await this.ciclolectivo.findOne({ anio: planillaTaller.anio });
      // Buscar el curso por comision, division, curso
      const { cursoNro, division, comision } = planillaTaller;
      const cursoEncontrado = await this.curso.findOne({ curso: Number(cursoNro), division, comision });
      planillaTaller.curso = Number(planillaTaller.curso);
      const planillaUpdate: IPlanillaTaller & any = {
        asignatura: planillaTaller.asignatura,
        profesor: planillaTaller.profesor,
        curso: cursoEncontrado,
        cicloLectivo: cicloLectivo,
        fechaInicio: moment(planillaTaller.fechaInicio).utc().format('YYYY-MM-DD'),
        fechaFinalizacion: moment(planillaTaller.fechaFinalizacion).utc().format('YYYY-MM-DD'),
        observacion: planillaTaller.observacion,
        bimestre: planillaTaller.bimestre,
        turno: planillaTaller.turno,
        fechaCreacion: planillaTaller.fechaCreacion,
        fechaModificacion: new Date(),
        activo: planillaTaller.activo,
      };
      const update = await this.planillaTaller.findByIdAndUpdate(id, planillaUpdate, { new: true });
      if (update) {
        return response.send(update);
      } else {
        return response.send(null);
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Ocurrió un problema interno'));
    }
  };
  private agregar = async (request: Request, response: Response, next: NextFunction) => {
    const now = new Date();
    const hoy = new Date(moment(now).format('YYYY-MM-DD'));
    // Agregar datos
    // La plantilla viene incompleta, hay que buscar el cicloLectivo y el curso
    console.log('request.body', request.body);
    const planillaData: CrearPlanillaTallerDto = request.body;
    const { curso, cicloLectivo, comision, division } = request.body;
    const unCicloLectivo = await this.ciclolectivo.findOne({ anio: Number(cicloLectivo) });
    if (!unCicloLectivo) {
      next(new NotFoundException('ciclo lectivo'));
    } else {
      let unCurso = await this.curso.findOne({ comision, curso, division });
      if (!unCurso) {
        const createdCurso = new this.curso({ comision, curso, division, activo: true, fechaCreacion: hoy });
        unCurso = await createdCurso.save();
      }
      const ini = new Date(moment(planillaData.fechaInicio).format('YYYY-MM-DD'));
      const fin = new Date(moment(planillaData.fechaFinalizacion).format('YYYY-MM-DD'));

      const createdPlanilla = new this.planillaTaller({
        ...planillaData,
        fechaInicio: ini,
        fechaFinalizacion: fin,
        curso: unCurso,
        cicloLectivo: unCicloLectivo,
        // author: request.user ? request.user._id : null,
      });
      console.log('createdPlanilla', createdPlanilla);
      try {
        const savedComision = await createdPlanilla.save();
        console.log('guardado', savedComision, savedComision.planillaTallerNro);
        // await savedComision.populate('author', '-password').execPopulate();
        response.send(savedComision);
      } catch (e) {
        console.log('[ERROR]', e);
        next(new HttpException(400, 'Ocurrió un error al guardar la planilla'));
      }
    }
  };
  /**
   * Calculamos el total de clases de una plamnilla
   * @param request
   * @param response
   * @param next
   */
  private buscarTotalAsistenciaPorPlanilla = async (request: Request, response: Response, next: NextFunction) => {
    console.log('buscarTotalAsistenciaPorPlanilla');
    const planillaId = request.params.id;
    const planilla = await this.planillaTaller.findById(planillaId).populate('curso');
    if (planilla) {
      console.log('planilla.curso.comision', planilla);
      let criterioComision = null;
      switch (planilla.curso.comision) {
        case 'A':
          criterioComision = { comisionA: 1 };
          break;

        default:
          criterioComision = null;
          break;
      }
      let criterio = {
        cicloLectivo: planilla.cicloLectivo,
        fecha: {
          $gte: new Date(planilla.fechaInicio).toISOString(),
          $lt: new Date(planilla.fechaFinalizacion).toISOString(),
        },
      };
      if (criterioComision) {
        criterio = { ...criterio, ...criterioComision };
      }
      console.log(criterio);
      const calendario = await this.calendario.find(criterio);

      if (calendario) {
        response.send({ total: calendario.length });
      } else {
        response.send({ total: 0 });
      }
    } else {
      return next(new NotFoundException());
    }
  };
  private obtenerPlanillaTallerPorId = async (request: Request, response: Response, next: NextFunction) => {
    const id = escapeStringRegexp(request.params.id);
    console.log('id', request.params.id);
    const opciones: any = [
      {
        $lookup: {
          from: 'profesores',
          localField: 'profesor',
          foreignField: '_id',
          as: 'profesor',
        },
      },
      {
        $unwind: {
          path: '$profesor',
        },
      },
      {
        $lookup: {
          from: 'asignaturas',
          localField: 'asignatura',
          foreignField: '_id',
          as: 'asignatura',
        },
      },
      {
        $unwind: {
          path: '$asignatura',
        },
      },
      {
        $lookup: {
          from: 'cursos',
          localField: 'curso',
          foreignField: '_id',
          as: 'curso',
        },
      },
      {
        $unwind: {
          path: '$curso',
        },
      },
      {
        $lookup: {
          from: 'ciclolectivos',
          localField: 'cicloLectivo',
          foreignField: '_id',
          as: 'cicloLectivo',
        },
      },
      {
        $unwind: {
          path: '$cicloLectivo',
        },
      },
      {
        $match: {
          _id: new ObjectId(id),
        },
      },
      { $sort: { _id: -1 } },
    ];
    const planillaTallerAggregate = await this.planillaTaller.aggregate(opciones);
    const planillaTaller = planillaTallerAggregate && planillaTallerAggregate.length > 0 ? planillaTallerAggregate[0] : null;
    if (planillaTaller) {
      response.send(planillaTaller);
    } else {
      next(new HttpException(400, 'No se encontró la planilla'));
    }
  };
  private obtenerPlanillaTallerPorIdCiclo = async (request: Request, response: Response, next: NextFunction) => {
    const id = escapeStringRegexp(request.params.id);
    const ciclo = escapeStringRegexp(request.params.ciclo);
    console.log('obtenerPlanillaTallerPorIdCiclo', request.params.id);
    const opciones: any = [
      {
        $lookup: {
          from: 'profesores',
          localField: 'profesor',
          foreignField: '_id',
          as: 'profesor',
        },
      },
      {
        $unwind: {
          path: '$profesor',
        },
      },
      {
        $lookup: {
          from: 'asignaturas',
          localField: 'asignatura',
          foreignField: '_id',
          as: 'asignatura',
        },
      },
      {
        $unwind: {
          path: '$asignatura',
        },
      },
      {
        $lookup: {
          from: 'ciclolectivos',
          localField: 'cicloLectivo',
          foreignField: '_id',
          as: 'cicloLectivo',
        },
      },
      {
        $unwind: {
          path: '$cicloLectivo',
        },
      },
      {
        $lookup: {
          from: 'cursos',
          localField: 'curso',
          foreignField: '_id',
          as: 'curso',
        },
      },
      {
        $unwind: {
          path: '$curso',
        },
      },
      {
        $match: {
          _id: ObjectId(id),
          'cicloLectivo.anio': Number(ciclo),
        },
      },
      // {
      //   $project: {
      //     _id: 1,
      //     planillaTallerNro: 1,
      //     asignatura: 1,
      //     profesor: {
      //       nombreCompleto: 1,
      //     },
      //     fechaInicio: 1,
      //     fechaFinalizacion: 1,
      //     bimestre: 1,
      //     observacion: 1,
      //     curso: {
      //       comision: 1,
      //       curso: 1,
      //       division: 1,
      //       cicloLectivo: ['$curso.cicloLectivo'],
      //     },
      //   },
      // },
      {
        $sort: {
          _id: -1,
        },
      },
    ];

    const planillaTallerAggregate = await this.planillaTaller.aggregate(opciones);
    const planillaTaller = planillaTallerAggregate && planillaTallerAggregate.length > 0 ? planillaTallerAggregate[0] : null;
    console.log('planillaTaller>', planillaTaller);
    if (planillaTaller) {
      response.send(planillaTaller);
    } else {
      next(new HttpException(400, 'No se encontró la planilla'));
    }
  };
  private obtenerPlanillaTalleresPorCiclo = async (request: Request, response: Response, next: NextFunction) => {
    const ciclo = request.params.ciclo;
    console.log('ciclo', request.params.ciclo);
    const opciones: any = [
      {
        $lookup: {
          from: 'profesores',
          localField: 'profesor',
          foreignField: '_id',
          as: 'profesor',
        },
      },
      {
        $unwind: {
          path: '$profesor',
        },
      },
      {
        $lookup: {
          from: 'asignaturas',
          localField: 'asignatura',
          foreignField: '_id',
          as: 'asignatura',
        },
      },
      {
        $unwind: {
          path: '$asignatura',
        },
      },
      {
        $lookup: {
          from: 'ciclolectivos',
          localField: 'cicloLectivo',
          foreignField: '_id',
          as: 'cicloLectivo',
        },
      },
      {
        $unwind: {
          path: '$cicloLectivo',
        },
      },
      {
        $lookup: {
          from: 'cursos',
          localField: 'curso',
          foreignField: '_id',
          as: 'curso',
        },
      },
      {
        $unwind: {
          path: '$curso',
        },
      },
      {
        $match: {
          'cicloLectivo.anio': Number(ciclo),
        },
      },
      { $sort: { _id: -1 } },
    ];

    const planillaTallerAggregate = await this.planillaTaller.aggregate(opciones);
    response.send(planillaTallerAggregate);
  };
  private paginar = async (request: Request, response: Response, next: NextFunction) => {
    const parametros = request.query;
    let campo: any = null;
    switch (parametros.sortField) {
      case 'cicloLectivo':
        campo = 'comision.cicloLectivo';
        break;
      case 'asignatura':
        campo = 'asignatura.detalle';
        break;
      case 'profesor':
        campo = 'profesor.nombreCompleto';
        break;
      default:
        campo = parametros.sortField;
        break;
    }
    // SORT ---------------
    const sort = parametros.sortField ? { [campo]: parametros.sortOrder } : null;
    // OPCIONES ---------------
    const opciones: any = [
      {
        $lookup: {
          from: 'comisiones', //otherCollection
          localField: 'comision',
          foreignField: '_id',
          as: 'comision',
        },
      },
      { $unwind: '$comision' },
      {
        $lookup: {
          from: 'profesores', //otherCollection
          localField: 'profesor',
          foreignField: '_id',
          as: 'profesor',
        },
      },
      { $unwind: '$profesor' },
      {
        $lookup: {
          from: 'asignaturas', //otherCollection
          localField: 'asignatura',
          foreignField: '_id',
          as: 'asignatura', // nombre resultante de la union (uso el mismo)
        },
      },
      { $unwind: '$asignatura' }, // desestructura cada asignatura en un registro
      {
        $addFields: {
          fechaInicioString: {
            $dateToString: { format: '%d/%m/%Y', date: '$fechaInicio' },
          },
        },
      },
    ];
    // FILTER AGGREGATE ---------------
    let match: any = [];
    let project: any = [];

    if (parametros.filter !== '') {
      match.push({
        'asignatura.detalle': { $regex: parametros.filter, $options: 'i' },
      });
      match.push({
        'profesor.nombreCompleto': { $regex: parametros.filter, $options: 'i' },
      });
      match.push({ bimestre: { $regex: parametros.filter, $options: 'i' } });
      match.push({ turno: { $regex: parametros.filter, $options: 'i' } });
      match.push({ planillaTallerNroString: { $regex: parametros.filter, $options: 'i' } });

      match.push({
        comisionCompleta: {
          $regex: parametros.filter,
          $options: 'i',
        },
      });

      match.push({ observacion: { $regex: parametros.filter, $options: 'i' } });

      match.push({
        fechaInicioString: {
          // input: { $toString: "$comision.cicloLectivo" },
          $regex: parametros.filter,
          $options: 'g',
        },
      });

      // Tiene su propio campo
      match.push({
        cicloLectivo: {
          // input: { $toString: "$comision.cicloLectivo" },
          $regex: parametros.filter,
          $options: 'g',
        },
      });
      opciones.push({
        $addFields: {
          fechaInicioString: {
            $dateToString: { format: '%d/%m/%Y', date: '$fechaInicio' },
          },
          cicloLectivo: { $toString: '$comision.cicloLectivo' }, // Se crea este campo para realizar los filtros por strign
          planillaTallerNroString: { $toString: '$planillaTallerNro' }, // Se crea este campo para realizar los filtros por strign
          comisionCompleta: {
            $concat: [
              '0',
              { $toString: '$comision.curso' },
              ' / ',
              { $toString: '$comision.comision' },
              ' / ',
              '0',
              { $toString: '$comision.division' },
            ],
          },
        },
      });
      opciones.push({ $match: { $or: match } });
    }
    const aggregate = this.planillaTaller.aggregate(opciones);
    this.planillaTaller.aggregatePaginate(
      aggregate,
      {
        // populate: ["asignatura", "profesor", "comision"],
        page: Number(parametros.pageNumber),
        limit: Number(parametros.pageSize),
        sort, // sort: {
        //   planillaTallerId: parametros.sortOrder === "asc" ? 1 : -1,
        // },
      },
      (err: any, result: any) => {
        if (err) {
          console.log('[ERROR]', err);
        }
        // result.docs
        // result.total
        // result.limit - 10
        // result.page - 3
        // result.pages
        response.send(result);
      }
    );
  };
  private migrarPlanillaTalleres = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const now = new Date();
      const hoy = new Date(moment(now).format('YYYY-MM-DD'));
      const planillasTalleres: any = await this.planillaTallerOriginal.find();
      // console.log('planillasTalleres>', planillasTalleres);
      const ciclosLectivos: ICicloLectivo[] = await this.ciclolectivo.find();

      const planillasTalleresRefactorizados: IPlanillaTaller[] = await Promise.all(
        planillasTalleres.map(async (x: any, index: number) => {
          let asig: any = [];
          let prof: any = [];
          try {
            asig = await this.asignatura.findOne({
              IdAsignarutas: x.id_asignatura,
            });
          } catch (ero) {
            console.log('ero', ero);
          }
          try {
            prof = await this.profesor.findOne({
              id_profesores: x.Id_Profesor,
            });
          } catch (ero) {
            console.log('ero2', ero);
          }
          // Cursos
          const nuevo = {
            division: x.division,
            comision: x.comision ? x.comision : null,
            curso: x.Tcurso,
            // cicloLectivo: [nuevoCiclo],
            fechaCreacion: hoy,
            activo: true,
          };
          let savedCurso = null;
          if (x.comision && x.comision.length > 0 && x.ciclo_lectivo !== 0 && x.ciclo_lectivo !== 20) {
            let match: any = {
              division: x.division,
              comision: x.comision,
              curso: x.Tcurso,
              // 'cicloLectivo._id': ObjectId(nuevoCiclo._id),
            };
            // Si no tiene comisione entonces no es taller
            if (!x.comision || x.comision.trim().length < 1) {
              match = {
                division: x.division,
                curso: x.Tcurso,
                // 'cicloLectivo._id': ObjectId(nuevoCiclo._id),
              };
            }
            savedCurso = await this.curso.findOneAndUpdate(match, nuevo, {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true,
            });
          } else {
            return null;
          }

          const cl = await ciclosLectivos.filter((d) => Number(d.anio) === Number(x.ciclo_lectivo));
          const fechadateIni = new Date(x.FechaInicio);
          const ini = new Date(moment(fechadateIni).format('YYYY-MM-DD'));
          const fechadateFin = new Date(x.FechaFinalizacion);
          const fin = new Date(moment(fechadateFin).format('YYYY-MM-DD'));

          // const ini = new Date(moment(x.FechaInicio).format('YYYY-MM-DD'));
          // const fin = new Date(moment(x.FechaFinalizacion).format('YYYY-MM-DD'));
          const unaPlanillaTaller: IPlanillaTaller & any = {
            planillaTallerNro: 100 + index,
            planillaTallerId: x.id_planilla_de_taller,
            asignatura: asig,
            profesor: prof,
            curso: savedCurso,

            // curso: x.Tcurso,
            // division: x.division,
            // comision: x.comision,
            cicloLectivo: cl[0],
            observacion: x.Observacion,
            fechaInicio: ini,
            fechaFinalizacion: fin,
            bimestre: x.Bimestre ? x.Bimestre : 'Sin Registrar',

            fechaCreacion: hoy,
            activo: true,
          };

          return unaPlanillaTaller;
        })
      );

      try {
        const filtrados = planillasTalleresRefactorizados.filter((x) => {
          return x !== null && typeof x !== 'undefined';
        });
        const savedPlanillaTallers = await this.planillaTaller.insertMany(filtrados);
        response.send({
          savedPlanillaTallers,
        });
      } catch (e) {
        console.log('ERROR', e);
        // response.send({
        //   error: planillasTalleresRefactorizados,
        // });
        next(new HttpException(500, 'Ocurrió un error al guardar las planillasTalleres'));
      }
    } catch (e2) {
      console.log('ERROR', e2);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
}

export default PlanillaTallerController;
