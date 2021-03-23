import mongoose from 'mongoose';
import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import NotFoundException from '../exceptions/NotFoundException';
import Controller from '../interfaces/controller.interface';
import validationMiddleware from '../middleware/validation.middleware';
import CreateCalificacionDto from './calificacion.dto';
import calificacionModel from './calificacion.model';
import escapeStringRegexp from 'escape-string-regexp';
import ICalificacion from './calificacion.interface';
import calificacionOriginalModel from './calificacionOriginal.model';
import planillaTallerModel from '../planillaTaller/planillaTaller.model';
import alumnoModel from '../alumnos/alumno.model';
import profesorModel from '../profesores/profesor.model';
import moment from 'moment';
const ObjectId = mongoose.Types.ObjectId;

class CalificacionController implements Controller {
  public path = '/calificacion';
  public router = Router();
  private calificacion = calificacionModel;
  private planillaTaller = planillaTallerModel;
  private alumno = alumnoModel;
  private profesor = profesorModel;
  private calificacionOriginal = calificacionOriginalModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    console.log('CalificacionController/initializeRoutes');
    this.router.get(`${this.path}/migrar`, this.migrar);
    this.router.post(`${this.path}/por-alumno/:id`, this.obtenerCalificacionesPorAlumnoId);
    this.router.put(`${this.path}`, this.guardarCalificacion);
    this.router.delete(`${this.path}/:id`, this.eliminar);
    this.router.patch(`${this.path}/:id`, this.actualizarCalificacion);
    this.router.post(`${this.path}/informe-por-planilla`, this.informeCalificacionesPorPlanilla);
  }
  private async obtenerAlumnosPorCCD(ciclo: number, curso: Number, comision: string, division: Number) {
    let match: any = {
      'estadoCursadas.curso.curso': Number(curso),
      'estadoCursadas.curso.division': Number(division),
      'estadoCursadas.curso.comision': comision.toString(),
      'estadoCursadas.cicloLectivo.anio': Number(ciclo),
    };
    const opciones: any = [
      {
        $lookup: {
          from: 'estadocursadas',
          localField: 'estadoCursadas',
          foreignField: '_id',
          as: 'estadoCursadas',
        },
      },
      {
        $unwind: {
          path: '$estadoCursadas',
        },
      },
      {
        $lookup: {
          from: 'ciclolectivos',
          localField: 'estadoCursadas.cicloLectivo',
          foreignField: '_id',
          as: 'estadoCursadas.cicloLectivo',
        },
      },
      {
        $unwind: {
          path: '$estadoCursadas.cicloLectivo',
        },
      },
      {
        $lookup: {
          from: 'cursos',
          localField: 'estadoCursadas.curso',
          foreignField: '_id',
          as: 'estadoCursadas.curso',
        },
      },
      {
        $unwind: {
          path: '$estadoCursadas.curso',
        },
      },
      {
        $match: match,
      },
      {
        $sort: {
          _id: -1,
        },
      },
    ];
    return await this.alumno.aggregate(opciones);
  }
  private informeCalificacionesPorPlanilla = async (request: Request, response: Response, next: NextFunction) => {
    const planilla = request.body.planillaTaller;
    const { curso, comision, division } = planilla.curso;
    const alumnos = await this.obtenerAlumnosPorCCD(planilla.cicloLectivo.anio, curso, comision, division);
    let totalCalifaciones = 0;
    const asistenciasPorAlumno = await Promise.all(
      alumnos.map(async (alumno: any) => {
        // Por cada alumno y planilla buscamos el
        const opciones: any[] = [
          {
            $match: {
              planillaTaller: ObjectId(planilla._id),
              alumno: ObjectId(alumno._id),
            },
          },
        ];
        const calificaciones = await this.calificacion.aggregate(opciones);
        return {
          alumnoId: alumno._id,
          alumnoNombre: alumno.nombreCompleto,
          legajo: alumno.legajo,
          calificaciones,
        };
      })
    );
    return response.send({ asistenciasPorAlumno });
  };
  private eliminar = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const successResponse = await this.calificacion.findByIdAndDelete(id);
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
  private guardarCalificacion = async (request: Request, response: Response, next: NextFunction) => {
    const calificacionData: CreateCalificacionDto = request.body;
    console.log('¿calificacionData', calificacionData);
    const created = new this.calificacion({
      ...calificacionData,
    });
    try {
      const saved = await created.save();
      response.send(saved);
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Error Interno'));
    }
  };
  private actualizarCalificacion = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    const calificacion = request.body.calificacion;
    try {
      const updated = await this.calificacion.findByIdAndUpdate(id, calificacion, { new: true });
      console.log('updated', updated);
      if (updated) {
        response.send({ calificacion: updated });
      } else {
        response.send({ calificacion: null });
      }
    } catch (e4) {
      console.log('[ERROR], ', e4);
      next(new HttpException(500, 'Ocurrió un error interno'));
    }
  };
  private migrar = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const calificacionsOriginales: any = await this.calificacionOriginal.find();
      console.log('calificacionsOriginales>', calificacionsOriginales);

      const calificacionsOriginalesRefactorizados: ICalificacion[] = await Promise.all(
        calificacionsOriginales.map(async (x: any, index: number) => {
          let planillataller: any = null;
          let alumno: any = null;
          let profesor: any = null;
          try {
            planillataller = await this.planillaTaller.findOne({
              planillaTallerId: x.id_planilla_de_taller,
            });
            if (!planillataller) {
              console.log(' x.id_planilla_de_taller', x.id_planilla_de_taller);
              return null;
            }
          } catch (ero) {
            console.log('ero', ero);
          }
          try {
            profesor = await this.profesor.findOne({
              id_profesores: x.id_profesor,
            });
          } catch (ero) {
            console.log('ero', ero);
          }
          try {
            if (x.Id_alumno && x.Id_alumno !== 0) {
              alumno = await this.alumno.findOne({
                alumnoId: x.Id_alumno,
              });
            } else {
              console.log('&& x.Id_alumno', x.Id_alumno);
              return null;
            }
          } catch (ero) {
            console.log('ero', ero);
          }
          let tipoExamen = null;
          switch (x.tipo_de_examen) {
            case '1er Trab Grupal':
              tipoExamen = '1ER TRABAJO GRUPAL';
              break;
            case '1er Trab Practi':
              tipoExamen = '1ER TRABAJO PRACTICO';
              break;
            case '1ra Evaluacion':
              tipoExamen = '1RA EVALUACION';
              break;
            case '2da Evaluacion':
              tipoExamen = '2DA EVALUACION';
              break;
            case '2do Trab Grupal':
              tipoExamen = '2DO TRABAJO GRUPAL';
              break;
            case '2do Trab Practi':
              tipoExamen = '2DO TRABAJO PRACTICO';
              break;
            case '3er  Trab Pract':
              tipoExamen = '3ER TRABAJO PRACTICO';
              break;
            case '3ra Evaluacion':
              tipoExamen = '3RA EVALUACION';
              break;
            case '3ro Trab Grupal':
              tipoExamen = '3ER TRABAJO GRUPAL';
              break;
            case '4to  Trab Pract':
              tipoExamen = '4TO TRABAJO PRACTICO';
              break;
            case 'Concepto':
              tipoExamen = 'CONCEPTO';
              break;
            case 'Evaluacion':
              tipoExamen = 'EVALUACION';
              break;
            case 'Participacion':
              tipoExamen = 'PARTICIPACION';
              break;
            case 'Trabajo Grupal':
              tipoExamen = 'TRABAJO GRUPAL';
              break;
            case 'Trabajo Practico':
              tipoExamen = 'TRABAJO PRACTICO';
              break;
            default:
              break;
          }
          let formaExamen = null;
          switch (x.forma_del_examen) {
            case 'Escrito':
              formaExamen = 'ESCRITO';
              break;

            case 'Oral':
              formaExamen = 'ORAL';
              break;
            case 'Prac.Laboratori':
              formaExamen = 'PRACT. LABORATORIO';
              break;
            default:
              break;
          }
          const now = new Date();
          const hoy = new Date(moment(now).format('YYYY-MM-DD'));
          const unaCalificacion: ICalificacion & any = {
            calificacionNro: index,
            id_calificaciones: x.id_calificaciones, // solo para migrar
            planillaTaller: planillataller,
            profesor: profesor,
            alumno: alumno,
            formaExamen,
            tipoExamen,
            promedioGeneral: x.PromedioGeneral,
            observaciones: x.Observaciones,
            promedia: x.promedia === 'SI' ? true : false,

            fechaCreacion: hoy,
            activo: true,
          };

          return unaCalificacion;
        })
      );

      try {
        console.log('======================>', calificacionsOriginalesRefactorizados.length);
        // console.log(
        //   "calificacionsOriginalesRefactorizados",
        //   calificacionsOriginalesRefactorizados
        // );
        const filtrados = calificacionsOriginalesRefactorizados.filter((x) => {
          return x !== null && typeof x !== 'undefined';
        });
        const savedCalificacions = await this.calificacion.insertMany(filtrados);
        response.send({
          savedCalificacions,
        });
      } catch (e) {
        console.log('ERROR', e);
        // response.send({
        //   error: calificacionsOriginales,
        // });
        next(new HttpException(500, 'Ocurrió un error al guardar las calificacionsOriginales'));
      }
    } catch (e2) {
      console.log('ERROR', e2);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
  private obtenerCalificacionesPorAlumnoId = async (request: Request, response: Response, next: NextFunction) => {
    console.log('obtenerCalificacionesPorAlumnoId');
    const id = escapeStringRegexp(request.params.id);
    const planillaId = escapeStringRegexp(request.body.planillaId);
    console.log('id', id);
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
          },
        },
        {
          $match: {
            'alumno._id': ObjectId(id),
            planillaTaller: ObjectId(planillaId),
          },
        },
      ];
      const calificacionesAggregate = await this.calificacion.aggregate(opciones);
      console.log('calificacionesAggregate', calificacionesAggregate);
      if (calificacionesAggregate) {
        response.send(calificacionesAggregate);
      } else {
        next(new NotFoundException());
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Ocurrió un error interno'));
    }
  };
}

export default CalificacionController;
