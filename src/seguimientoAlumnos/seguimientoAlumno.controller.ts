import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import NotFoundException from '../exceptions/NotFoundException';
import Controller from '../interfaces/controller.interface';
import validationMiddleware from '../middleware/validation.middleware';
import CreateSeguimientoAlumnoDto from './seguimientoAlumno.dto';
import seguimientoAlumnoModel from './seguimientoAlumno.model';
import escapeStringRegexp from 'escape-string-regexp';
import ISeguimientoAlumno from './seguimientoAlumno.interface';
import seguimientoAlumnoOriginalModel from './seguimientoAlumnoOriginal.model';
import planillaTallerModel from '../planillaTaller/planillaTaller.model';
import alumnoModel from '../alumnos/alumno.model';
import ciclolectivoModel from '../ciclolectivos/ciclolectivo.model';
import ICicloLectivo from '../ciclolectivos/ciclolectivo.interface';
import moment from 'moment';
const ObjectId = require('mongoose').Types.ObjectId;
class SeguimientoAlumnoController implements Controller {
  public path = '/seguimiento-alumnos';
  public router = Router();
  private seguimientoAlumno = seguimientoAlumnoModel;
  private planillaTaller = planillaTallerModel;
  private alumno = alumnoModel;
  private seguimientoAlumnoOriginal = seguimientoAlumnoOriginalModel;
  private ciclolectivo = ciclolectivoModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    console.log('SeguimientoAlumnoController/initializeRoutes');
    this.router.get(`${this.path}/migrar`, this.migrar);
    this.router.post(`${this.path}/resueltos`, this.resueltos);
    // this.router.post(`${this.path}/por-planilla/:id`, this.obtenerSeguimientoAlumnoPorPlanilla);
    this.router.get(`${this.path}/por-planilla/:id`, this.obtenerSeguimientoAlumnoPorPlanilla);
    this.router.get(`${this.path}/por-planilla-alumno/:id/:alumnoId`, this.obtenerPorPlanillaYAlumno);
    this.router.get(`${this.path}/por-alumno/:alumnoId`, this.obtenerPorAlumno);
    this.router.put(`${this.path}`, this.agregarSeguimientoAlumno);
    this.router.get(`${this.path}/:id`, this.obtenerSeguimientoPorId);
    this.router.patch(`${this.path}/:id`, this.actualizarSeguimientoAlumno);
    this.router.delete(`${this.path}/:id`, this.eliminar);
  }
  private obtenerSeguimientoPorId = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const opciones: any = [
        {
          $lookup: {
            from: 'alumnos',
            localField: 'alumno',
            foreignField: '_id',
            as: 'alumno',
          },
        },
        {
          $unwind: {
            path: '$alumno',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: 'planillatalleres',
            localField: 'planillaTaller',
            foreignField: '_id',
            as: 'planillaTaller',
          },
        },
        {
          $unwind: {
            path: '$planillaTaller',
            preserveNullAndEmptyArrays: true,
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
            _id: ObjectId(id),
          },
        },
      ];
      const successResponse = await this.seguimientoAlumno.aggregate(opciones);
      if (successResponse) {
        response.send({ seguimiento: successResponse && successResponse.length > 0 ? successResponse[0] : null });
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
  private eliminar = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const successResponse = await this.seguimientoAlumno.findByIdAndDelete(id);
      if (successResponse) {
        response.send({
          status: 200,
          success: true,
          message: 'Operación Exitosa',
        });
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
  private agregarSeguimientoAlumno = async (request: Request, response: Response, next: NextFunction) => {
    const seguimientoData: CreateSeguimientoAlumnoDto = request.body;
    const ini = new Date(moment.utc(seguimientoData.fecha).format('YYYY-MM-DD')); // Se hace esto para que no pase al siguient dia
    seguimientoData.fecha = ini;
    let match: any = {
      alumno: ObjectId(seguimientoData.alumno._id),
      fecha: {
        $eq: ini.toISOString(),
      },
    };
    if (seguimientoData.planillaTaller) {
      match = {
        alumno: ObjectId(seguimientoData.alumno._id),
        planillaTaller: ObjectId(seguimientoData.planillaTaller._id),
        fecha: {
          $eq: ini.toISOString(),
        },
        // fecha: {
        //   $gte: new Date(seguimientoData.fecha).toISOString(),
        //   $lt: moment(seguimientoData.fecha).add('59', 'seconds').add('59', 'minutes').add('23', 'hours').toDate().toISOString(),
        // },
      };
    }
    // const ini = new Date(moment(seguimientoData.fecha).utc().format('YYYY-MM-DD'));
    // seguimientoData.fecha = ini;

    try {
      const updated = await this.seguimientoAlumno.findOne(match);
      if (updated) {
        response.send({
          tema: updated,
          success: false,
          message: 'Ya existe cargado un seguimiento en la fecha: ' + moment.utc(ini).format('DD/MM/YYYY').toString(),
        });
      } else {
        const created = new this.seguimientoAlumno({
          ...seguimientoData,
        });
        const saved = await created.save();
        response.send({ seguimiento: saved, success: true, message: 'Seguimiento agregado correctamente' });
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Error Interno'));
    }
  };
  private actualizarSeguimientoAlumno = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    const seguimiento = request.body;
    const fechadate = new Date(seguimiento.fecha);
    const fecha = new Date(moment(fechadate).format('YYYY-MM-DD'));
    seguimiento.fecha = fecha;
    try {
      const updated = await this.seguimientoAlumno.findByIdAndUpdate(id, seguimiento, { new: true });
      if (updated) {
        response.send({ seguimiento: updated });
      } else {
        response.send({ seguimiento: null });
      }
    } catch (e4) {
      console.log('[ERROR], ', e4);
      next(new HttpException(500, 'Ocurrió un error interno'));
    }
  };
  private obtenerPorAlumno = async (request: Request, response: Response, next: NextFunction) => {
    const alumnoId = request.params.alumnoId;
    const opciones: any = [
      {
        $lookup: {
          from: 'alumnos',
          localField: 'alumno',
          foreignField: '_id',
          as: 'alumno',
        },
      },
      {
        $unwind: {
          path: '$alumno',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: 'planillatalleres',
          localField: 'planillaTaller',
          foreignField: '_id',
          as: 'planillaTaller',
        },
      },
      {
        $unwind: {
          path: '$planillaTaller',
          preserveNullAndEmptyArrays: true,
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
          'alumno._id': ObjectId(alumnoId),
        },
      },
    ];
    try {
      const seguimientos = await this.seguimientoAlumno.aggregate(opciones);
      response.send(seguimientos);
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Problemas en el servidor'));
    }
  };
  private obtenerPorPlanillaYAlumno = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    const alumnoId = request.params.alumnoId;
    const opciones: any = [
      {
        $lookup: {
          from: 'alumnos',
          localField: 'alumno',
          foreignField: '_id',
          as: 'alumno',
        },
      },
      {
        $unwind: {
          path: '$alumno',
        },
      },
      {
        $match: {
          planillaTaller: ObjectId(id),
          'alumno._id': ObjectId(alumnoId),
        },
      },
    ];
    try {
      const seguimientos = await this.seguimientoAlumno.aggregate(opciones);
      response.send(seguimientos);
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Problemas en el servidor'));
    }
  };
  private obtenerSeguimientoAlumnoPorPlanilla = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const opciones: any = [
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
            planillaTaller: ObjectId(id),
          },
        },
      ];

      const seguimientos = await this.seguimientoAlumno.aggregate(opciones);
      response.send(seguimientos);
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Problemas en el servidor'));
    }
  };

  private resueltos = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { resuelto } = request.body;

      const opciones: any = [
        {
          $lookup: {
            from: 'alumnos',
            localField: 'alumno',
            foreignField: '_id',
            as: 'alumno',
          },
        },
        {
          $unwind: {
            path: '$alumno',
          },
        },
        {
          $lookup: {
            from: 'planillatalleres',
            localField: 'planillaTaller',
            foreignField: '_id',
            as: 'planillaTaller',
          },
        },
        {
          $unwind: {
            path: '$planillaTaller',
            preserveNullAndEmptyArrays: true,
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
      ];

      if (typeof resuelto === 'boolean') {
        // planillaTaller: null, Este campo se puede agregar si solo quieren los seguimientos sin planilla
        opciones.push({
          $match: { resuelto: resuelto },
        });
      }
      const seguimientos = await this.seguimientoAlumno.aggregate(opciones);
      // const seguimientos = await this.seguimientoAlumno.find(filtro).sort('_id').populate('alumno');

      if (seguimientos) {
        response.send(seguimientos);
      } else {
        next(new NotFoundException());
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
  private migrar = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const now = new Date();
      const hoy = new Date(moment(now).format('YYYY-MM-DD'));
      const ciclosLectivos: ICicloLectivo[] = await this.ciclolectivo.find();
      const seguimientosOriginales: any = await this.seguimientoAlumnoOriginal.find();

      const seguimientoRefactorizados: ISeguimientoAlumno[] = await Promise.all(
        seguimientosOriginales.map(async (x: any, index: number) => {
          let planillataller: any = [];
          let alumno: any = [];
          try {
            planillataller = await this.planillaTaller.findOne({
              planillaTallerId: x.IdPlanillaDeTaller,
            });
          } catch (ero) {
            console.log('ero', ero);
          }
          try {
            alumno = await this.alumno.findOne({
              alumnoId: x.id_alumno,
            });
          } catch (ero) {
            console.log('ero', ero);
          }
          const fechadate = new Date(x.fecha);
          const fecha = new Date(moment(fechadate).format('YYYY-MM-DD'));
          const cl = await ciclosLectivos.filter((d) => Number(d.anio) === (x.ciclo_lectivo === 0 ? 2019 : Number(x.ciclo_lectivo)));
          const unSeguimientoAlumno: ISeguimientoAlumno & any = {
            seguimientoAlumnoNro: index,
            alumno: alumno,
            planillaTaller: planillataller,
            fecha,
            tipoSeguimiento: x.tipo_seguimiento,
            cicloLectivo: cl[0],
            resuelto: x.Resuelto === 'SI' ? true : false,
            observacion: x.observacion,
            observacion2: x.Observacion,
            observacionJefe: x.ObservacionJefe,

            fechaCreacion: hoy,
            activo: true,
          };

          return unSeguimientoAlumno;
        })
      );

      try {
        const savedPlanillaTallers = await this.seguimientoAlumno.insertMany(seguimientoRefactorizados);
        response.send({
          savedPlanillaTallers,
        });
      } catch (e) {
        console.log('ERROR', e);
        next(new HttpException(500, 'Ocurrió un error al guardar las planillasTalleres'));
      }
    } catch (e2) {
      console.log('ERROR', e2);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
}

export default SeguimientoAlumnoController;
