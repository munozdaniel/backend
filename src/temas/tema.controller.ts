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
  }

  private migrar = async (request: Request, response: Response, next: NextFunction) => {
    try {
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
              caracterClase: x.CaracterClase,
              observacionJefe: x.ObservacionJefe,

              fechaCreacion: new Date(),
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
