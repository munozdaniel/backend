import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import NotFoundException from '../exceptions/NotFoundException';
import Controller from '../interfaces/controller.interface';
import validationMiddleware from '../middleware/validation.middleware';
import CreateTemaDto from './tema.dto';
import Tema from './tema.interface';
import temaModel from './tema.model';
import escapeStringRegexp from 'escape-string-regexp';
import ITema from './tema.interface';
import temaOriginalModel from './temaOriginal.model';
import planillaTallerModel from '../planillaTaller/planillaTaller.model';
import moment from 'moment';
const ObjectId = require('mongoose').Types.ObjectId;

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
  }

  private guardarTema = async (request: Request, response: Response, next: NextFunction) => {
    const temaData: CreateTemaDto = request.body;
    console.log('¿temaData', temaData);
    const match = {
      planillaTaller: ObjectId(temaData.planillaTaller._id),
      fecha: {
        $gte: new Date(temaData.fecha).toISOString(),
        $lt: moment(temaData.fecha).add('59', 'seconds').add('59', 'minutes').add('23', 'hours').toDate().toISOString(),
      },
    };
    const ini = new Date(moment(temaData.fecha).utc().format('YYYY-MM-DD'));
    temaData.fecha = ini;

    try {
      const updated = await this.tema.findOneAndUpdate(match, temaData, { upsert: true, new: true });
      console.log('updated', updated);
      if (updated) {
        response.send({ asistencia: updated });
      } else {
        response.send({ asistencia: null });
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
    const ini = new Date(moment(tema.fecha).format('YYYY-MM-DD'));
    tema.fecha = ini;
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
            // console.log('unaPlanillaTaller', unaPlanillaTaller);
            const unaTema: ITema & any = {
              temaNro: 100 + index,
              id_planilla_temas: x.id_planilla_temas, // solo para migrar
              planillaTaller: unaPlanillaTaller,
              fecha: x.Fecha,
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
