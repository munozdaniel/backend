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
const ObjectId = mongoose.Types.ObjectId;

class TemaController implements Controller {
  public path = '/tema';
  public router = Router();
  private tema = temaModel;
  private planillaTaller = planillaTallerModel;
  private temaOriginal = temaOriginalModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    console.log('TemaController/initializeRoutes');
    this.router.get(`${this.path}/migrar`, this.migrar);
    this.router.get(`${this.path}/por-planilla/:id`, this.obtenerTemaPorPlanillaTaller);
    this.router.put(`${this.path}`, this.guardarTema);
    this.router.patch(`${this.path}/:id`, this.actualizarTema);
    this.router.delete(`${this.path}/:id`, this.eliminar);
  }

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
    console.log('id', id);
    const tema = request.body.tema;
    // const ini = new Date(moment(tema.fecha).format('YYYY-MM-DD'));
    // tema.fecha = ini;
    const fechadate = new Date(tema.fecha);
    const fecha = new Date(moment(fechadate).format('YYYY-MM-DD'));
    tema.fecha = fecha;
    try {
      const updated = await this.tema.findByIdAndUpdate(id, tema, { new: true });
      console.log('updated', updated);
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
