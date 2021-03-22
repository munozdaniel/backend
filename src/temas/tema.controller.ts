import mongoose from 'mongoose';
import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import NotFoundException from '../exceptions/NotFoundException';
import Controller from '../interfaces/controller.interface';
import validationMiddleware from '../middleware/validation.middleware';
import CreateTemaDto from './tema.dto';
import temaModel from './tema.model';
import escapeStringRegexp from 'escape-string-regexp';
import ITema from './tema.interface';
import temaOriginalModel from './temaOriginal.model';
import planillaTallerModel from '../planillaTaller/planillaTaller.model';
import moment from 'moment';
import calendarioModel from '../calendario/calendario.model';
const ObjectId = mongoose.Types.ObjectId;

class TemaController implements Controller {
  public path = '/tema';
  public router = Router();
  private tema = temaModel;
  private calendario = calendarioModel;
  private planillaTaller = planillaTallerModel;
  private temaOriginal = temaOriginalModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    console.log('TemaController/initializeRoutes');
    this.router.get(`${this.path}/migrar`, this.migrar);
    this.router.get(`${this.path}/por-planilla/:id`, this.obtenerTemaPorPlanillaTaller);
    this.router.post(`${this.path}/temas-calendario`, this.obtenerTemasCalendario);
    this.router.put(`${this.path}`, this.guardarTema);
    this.router.patch(`${this.path}/:id`, this.actualizarTema);
    this.router.delete(`${this.path}/:id`, this.eliminar);
  }

  private obtenerTemasCalendario = async (request: Request, response: Response, next: NextFunction) => {
    const now = new Date();
    const hoy = new Date(moment(now).format('YYYY-MM-DD'));
    const tipo = escapeStringRegexp(request.body.tipo);
    try {
      const planillaId = request.body.planillaId;
      console.log('planillaId', planillaId);

      const opcionesP: any = [
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
            _id: ObjectId(planillaId),
          },
        },
      ];
      const planillaAggregate = await this.planillaTaller.aggregate(opcionesP);
      try {
        if (!planillaAggregate || planillaAggregate.length < 1) {
          return next(new HttpException(400, 'Parametros Incorrectos'));
        }
        const planilla = planillaAggregate[0];

        // Obtener calendario de taller
        if (tipo.toString() === 'TALLER') {
          let matchComision: any = null;
          switch (planilla.curso.comision) {
            case 'A':
              matchComision = {
                comisionA: 1,
              };
              break;
            case 'B':
              matchComision = {
                comisionB: 1,
              };
              break;
            case 'C':
              matchComision = {
                comisionC: 1,
              };
              break;
            case 'D':
              matchComision = {
                comisionD: 1,
              };
              break;
            case 'E':
              matchComision = {
                comisionE: 1,
              };
              break;
            case 'F':
              matchComision = {
                comisionF: 1,
              };
              break;
            case 'G':
              matchComision = {
                comisionG: 1,
              };
              break;
            case 'H':
              matchComision = {
                comisionH: 1,
              };
              break;

            default:
              console.log('BNONE');

              break;
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
            {
              $unwind: {
                path: '$cicloLectivo',
              },
            },
            {
              $match: {
                'cicloLectivo._id': ObjectId(planilla.cicloLectivo._id),
                fecha: {
                  $gte: planilla.fechaInicio, // funciona sin isodate
                  $lt: planilla.fechaFinalizacion, // funciona sin isodate
                },
                ...matchComision,
              },
            },
          ];

          const calendario = await this.calendario.aggregate(opciones);
          const temasInsertar: ITema[] & any = await Promise.all(
            calendario.map((x) => {
              return {
                planillaTaller: planilla,
                fecha: x.fecha,
                activo: true,
                fechaCreacion: hoy,
              };
            })
          );
          try {
            // const temasSaved = await this.tema.insertMany(temasInsertar);
            response.send({ status: 200, message: 'Calendario Academico (Taller)', temasDelCalendario: temasInsertar });
          } catch (error) {
            console.log('[ERROR]', error);
            next(new HttpException(500, 'Error Interno al insertar los temas'));
          }
        }
        // Cargar todos los dias
        if (tipo.toString() === 'MATERIAS') {
          let fechaInicio = moment(planilla.fechaInicio, 'YYYY-MM-DD').utc();
          let fechaFinal = moment(planilla.fechaFinalizacion, 'YYYY-MM-DD').utc();
          const calendarioMaterias = [];
          while (fechaFinal.isSameOrAfter(fechaInicio)) {
            calendarioMaterias.push({
              planillaTaller: planilla,
              fecha: fechaInicio,
              activo: true,
              fechaCreacion: hoy,
            });
            fechaInicio = moment(fechaInicio).utc().add(1, 'day');
          }
          // const temasSaved = await this.tema.insertMany(calendarioMaterias);
          response.send({ status: 200, message: 'Calendario Academico (Taller)', temasDelCalendario: calendarioMaterias });
        }
      } catch (error) {
        console.log('[ERROR]', error);
        next(new HttpException(500, 'Error Interno al recuperar los temas'));
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Error Interno al recuperar la planilla'));
    }
  };
  private eliminar = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const successResponse = await this.tema.findByIdAndDelete(id);
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
  private guardarTema = async (request: Request, response: Response, next: NextFunction) => {
    const temaData: CreateTemaDto = request.body;

    const ini = new Date(moment.utc(temaData.fecha).format('YYYY-MM-DD')); // Se hace esto para que no pase al siguient dia
    temaData.fecha = ini;
    // const fechadate = new Date(temaData.fecha);
    // const fecha = new Date(moment(fechadate).format('YYYY-MM-DD'));
    // temaData.fecha = fecha;
    const match = {
      planillaTaller: ObjectId(temaData.planillaTaller._id),
      fecha: {
        $eq: ini.toISOString(),
      },
      // fecha: {
      //   $gte: moment(temaData.fecha, 'YYYY-MM-DD').hours(0).minutes(0).seconds(0).toDate().toISOString(),
      //   $lt: moment(temaData.fecha, 'YYYY-MM-DD').utcOffset(0).hours(23).minutes(59).seconds(59).toDate().toISOString(),
      // },
    };
    try {
      const updated = await this.tema.findOne(match);
      if (updated) {
        response.send({
          tema: updated,
          success: false,
          message: 'Ya existe cargado un tema en la fecha: ' + moment.utc(temaData.fecha).format('DD/MM/YYYY'),
        });
      } else {
        const created = new this.tema({
          ...temaData,
        });
        const saved = await created.save();
        response.send({ tema: saved, success: true, message: 'Tema agregado correctamente' });
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Error Interno'));
    }
  };
  private actualizarTema = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    const tema = request.body.tema;
    // const ini = new Date(moment(tema.fecha).format('YYYY-MM-DD'));
    // tema.fecha = ini;

    try {
      let updated;
      if (id && id !== 'undefined') {
        const fechadate = new Date(tema.fecha);
        const fecha = new Date(moment(fechadate).format('YYYY-MM-DD'));
        tema.fecha = fecha;
        updated = await this.tema.findByIdAndUpdate(id, tema, { new: true });
      } else {
        const created = new this.tema({ ...tema });
        updated = await created.save();
      }
      if (updated) {
        response.send({ tema: updated });
      } else {
        response.send({ tema: null });
      }
    } catch (e4) {
      console.log('[ERROR], ', e4);
      next(new HttpException(500, 'Ocurrió un error interno'));
    }
  };
  private obtenerTemaPorPlanillaTaller = async (request: Request, response: Response, next: NextFunction) => {
    const id = escapeStringRegexp(request.params.id);
    try {
      const temas = await this.tema.find({ planillaTaller: ObjectId(id) });
      if (temas) {
        response.send(temas);
      } else {
        next(new NotFoundException());
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Problemas en el servidor'));
    }
  };
  private migrar = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const now = new Date();
      const hoy = new Date(moment(now).format('YYYY-MM-DD'));
      const temasOriginales: any = await this.temaOriginal.find();
      // console.log('temasOriginales>', temasOriginales);

      const temasOriginalesRefactorizados: ITema[] = await Promise.all(
        temasOriginales.map(async (x: any, index: number) => {
          let unaPlanillaTaller: any = null;
          unaPlanillaTaller = await this.planillaTaller.findOne({
            planillaTallerId: x.id_planilla_taller,
          });
          if (!unaPlanillaTaller) {
            console.log('unaPlanillaTaller NO existe', x.id_planilla_taller);
            return null;
          } else {
            let caracterClase = null;
            switch (x.CaracterClase) {
              case 'Por Dictar':
                caracterClase = 'SIN DICTAR';
                break;
              case 'Practica':
                caracterClase = 'PRACTICA';
                break;
              case 'Sin Dictar':
                caracterClase = 'SIN DICTAR';
                break;
              case 'Teorico':
                caracterClase = 'TEORICO';
                break;
              case 'Teorico-Practic':
                caracterClase = 'TEORICO-PRACTICO';
                break;

              default:
                break;
            }
            const fechadate = new Date(x.Fecha);
            const fecha = new Date(moment(fechadate).format('YYYY-MM-DD'));
            // console.log('unaPlanillaTaller', unaPlanillaTaller);
            const unaTema: ITema & any = {
              temaNro: 100 + index,
              id_planilla_temas: x.id_planilla_temas, // solo para migrar
              planillaTaller: unaPlanillaTaller,
              fecha,
              temaDelDia: x.Temas_del_dia,
              tipoDesarrollo: x.Tipo_de_desarrollo,
              temasProximaClase: x.Temas_Proxima_Clase,
              nroClase: x.NroClase,
              unidad: x.Unidad,
              caracterClase,
              observacionJefe: x.ObservacionJefe,

              fechaCreacion: hoy,
              activo: true,
            };

            return unaTema;
          }
        })
      );

      try {
        const filtrados = temasOriginalesRefactorizados.filter((x) => {
          return x !== null && typeof x !== 'undefined';
        });
        console.log('temasOriginalesRefactorizados', filtrados.length, temasOriginalesRefactorizados.length);
        const savedTemas = await this.tema.insertMany(filtrados);
        response.send({
          savedTemas,
        });
      } catch (e) {
        console.log('ERROR', e);
        // response.send({
        //   error: temasOriginalesRefactorizados,
        // });
        next(new HttpException(500, 'Ocurrió un error al guardar las temasOriginales'));
      }
    } catch (e2) {
      console.log('ERROR', e2);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
}

export default TemaController;
