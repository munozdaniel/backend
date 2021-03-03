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
import CrearCursoDto from '../cursos/curso.dto';
class PlanillaTallerController implements Controller {
  public path = '/planilla-taller';
  public router = Router();
  private planillaTaller = planillaTallerModel;
  private asignatura = asignaturaModel;
  private profesor = profesorModel;
  private planillaTallerOriginal = planillaTallerOriginalModel;
  private curso = cursoModel;
  private alumno = alumnoModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    console.log('PlanillaTallerController/initializeRoutes');
    this.router.get(`${this.path}/migrar`, this.migrarPlanillaTalleres);
    this.router.get(`${this.path}/test`, this.test);
    this.router.get(`${this.path}/paginar`, this.paginar);
    this.router.get(`${this.path}/ciclo/:ciclo`, this.obtenerPlanillaTalleresPorCiclo);
    this.router.put(`${this.path}`, this.agregar);
  }
  private test = async (request: Request, response: Response, next: NextFunction) => {
    response.send({
      test: 'savedPlanillaTallers',
    });
  };
  private agregar = async (request: Request, response: Response, next: NextFunction) => {
    // Agregar datos
    console.log('request.body', request.body);
    const planillaData: CrearPlanillaTallerDto = request.body;
    const createdPlanilla = new this.planillaTaller({
      ...planillaData,
      // author: request.user ? request.user._id : null,
    });
    try {
      const savedComision = await createdPlanilla.save();
      console.log('guardado', savedComision, savedComision.planillaTallerNro);
      // await savedComision.populate('author', '-password').execPopulate();
      response.send(savedComision);
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
  private obtenerPlanillaTalleresPorCiclo = async (request: Request, response: Response, next: NextFunction) => {
    const ciclo = request.params.ciclo;
    const opciones: any = [
      {
        $lookup: {
          from: 'cursos',
          localField: 'curso',
          foreignField: '_id',
          as: 'curso',
        },
      },
      { $unwind: '$curso' },
      {
        $lookup: {
          from: 'ciclolectivos',
          localField: 'curso.cicloLectivo',
          foreignField: '_id',
          as: 'curso.cicloLectivo',
        },
      },
      { $unwind: '$curso.cicloLectivo' },
      // {
      //   $group: {
      //     _id: "$_id",
      //     root: { $mergeObjects: "$$ROOT" },
      //     productosCarrito: { $push: "$productosCarrito" },
      //   },
      // },
      // {
      //   $replaceRoot: {
      //     newRoot: {
      //       $mergeObjects: ["$root", "$$ROOT"],
      //     },
      //   },
      // },

      {
        $project: {
          root: 0,
        },
      },
      {
        $match: { 'curso.cicloLectivo': 2019 },
      },
      // {
      //   $project: {
      //     _id: 1,
      //     precioTotal: { $sum: "$productosCarrito.subtotal" },
      //     productosCarrito: 1,
      //     usuarioId: 1,
      //   },
      // },
      { $sort: { _id: -1 } },
    ];
    const planillaTallerAggregate = await this.planillaTaller.aggregate(opciones);
    console.log('planillaTallerAggregate', planillaTallerAggregate);
    const planillaTaller = planillaTallerAggregate && planillaTallerAggregate.length > 0 ? planillaTallerAggregate[0] : null;
    console.log('planillaTaller', planillaTaller);
    if (!planillaTaller) {
      response.send(planillaTaller);
    } else {
      response.send(planillaTaller);
    }
  };
  private paginar = async (request: Request, response: Response, next: NextFunction) => {
    const parametros: IQueryPaginator = request.query;
    console.log('parametros, ', parametros);
    let campo = null;
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
          // let: { curso: "$curso", com: "$comision", div: "$division" },
          // pipeline: [
          //   {
          //     $addFields: {
          //       comisionCompleta: {
          //         $concat: ["0", "$$curso", "/", "$$com", "/", "0", "$$div"],
          //       },
          //     },
          //   },
          // ],
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
      match.push({ planillaTallerNroString: { $regex: parametros.filter, $options: 'i' } });
      //  match.push({
      //     "comision.cicloLectivo": {
      //       $eq: Number(parametros.filter),
      //     },
      //   });
      // match.push({
      //   // $regexFindAll: {
      //   //   input: { $toString: "$comision.cicloLectivo" },
      //   //   regex: parametros.filter,
      //   // },
      //   // {
      //   "comision.cicloLectivo": {
      //     // input: { $toString: "$comision.cicloLectivo" },
      //     $regex: Number(parametros.filter),
      //     // $options: "m",
      //   },
      // });
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
      console.log('match', match);
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
    console.log('opciones', opciones);
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
        console.log('result', result);
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
      const planillasTalleres: any = await this.planillaTallerOriginal.find();
      // console.log('planillasTalleres>', planillasTalleres);

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
          const opciones: any = [
            {
              $lookup: {
                from: 'ciclolectivos',
                localField: 'cicloLectivo',
                foreignField: '_id',
                as: 'cicloLectivo',
              },
            },
            { $unwind: '$cicloLectivo' },
            {
              $match: { division: x.division, comision: x.comision, curso: x.Tcurso, cicloLectivo: x.ciclo_lectivo },
            },
          ];
          const cursoAggregate = await this.curso.aggregate(opciones);
          // console.log('cursoAggregate', cursoAggregate);
          let unCurso = cursoAggregate && cursoAggregate.length > 0 ? cursoAggregate[0] : null;
          // unCurso = await this.curso.findOne({
          //   division: x.division,
          //   comision: x.comision,
          //   curso: x.Tcurso,
          //   cicloLectivo: x.ciclo_lectivo,
          // });
          if (!unCurso) {
            if (x.comision && x.comision.length > 0 && x.ciclo_lectivo !== 0 && x.ciclo_lectivo !== 20) {
              try {
                const cursoData: CrearCursoDto = {
                  division: x.division,
                  comision: x.comision,
                  curso: x.Tcurso,
                  cicloLectivo: x.ciclo_lectivo,
                  activo: true,
                  fechaCreacion: new Date().toString(),
                };
                const created = new this.curso({
                  ...cursoData,
                  // author: request.user ? request.user._id : null,
                });
                unCurso = await created.save();
              } catch (ero) {
                console.log('ero4', ero);
              }
            } else {
              // registros que no van a ser guardados porque no tienen todos lso registros cargados correctamente
              console.log('Estas son las comisiones que no estan bien cargadas y que no puedo encontrar', x);

              return null;
            }
          } else {
            // console.log("unaComision findone", unaComision);
          }

          // console.log('unCurso', unCurso);
          const unaPlanillaTaller: IPlanillaTaller & any = {
            planillaTallerNro: 100 + index,
            planillaTallerId: x.id_planilla_de_taller,
            asignatura: asig,
            profesor: prof,
            curso: unCurso,

            // curso: x.Tcurso,
            // division: x.division,
            // comision: x.comision,
            // cicloLectivo: x.ciclo_lectivo,
            fechaInicio: x.FechaInicio,
            observacion: x.Observacion,
            fechaFinalizacion: x.FechaFinalizacion,
            bimestre: x.Bimestre ? x.Bimestre : 'SIN REGISTRAR',

            fechaCreacion: new Date(),
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
