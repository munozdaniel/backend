import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import NotFoundException from '../exceptions/NotFoundException';
import Controller from '../interfaces/controller.interface';
import escapeStringRegexp from 'escape-string-regexp';
import ICalendario from './calendario.interface';
import calendarioModel from './calendario.model';
import calendarioOriginalModel from './calendarioOriginal.model';
import ciclolectivoModel from '../ciclolectivos/ciclolectivo.model';
const ObjectId = require('mongoose').Types.ObjectId;

class CalendarioController implements Controller {
  public path = '/calendario';
  public router = Router();
  private calendario = calendarioModel;
  private cicloLectivo = ciclolectivoModel;
  private calendarioOriginal = calendarioOriginalModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    console.log('CalendarioController/initializeRoutes');
    this.router.get(`${this.path}/migrar`, this.migrar);
  }

  private migrar = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const calendariosOriginales: any = await this.calendarioOriginal.find();
      console.log('calendariosOriginales>', calendariosOriginales);

      const calendariosOriginalesRefactorizados: ICalendario[] = await Promise.all(
        calendariosOriginales.map(async (x: any, index: number) => {
          let cicloLectivo: any = null;
          try {
            cicloLectivo = await this.cicloLectivo.findOne({
              anio: Number(x.ciclo_lectivo),
            });
            if (!cicloLectivo) {
              console.log(' x.cicloLectivo', x);
              return null;
            }
          } catch (ero) {
            console.log('ero', ero);
          }

          const unaCalendario: ICalendario & any = {
            calendarioNro: index,
            id_calendario: x.id_calendario,
            fecha: x.fechas,
            cicloLectivo: cicloLectivo,
            a: x.A,
            b: x.B,
            c: x.C,
            d: x.D,
            e: x.E,
            f: x.F,
            g: x.G,
            h: x.H,

            fechaCreacion: new Date(),
            activo: true,
          };

          return unaCalendario;
        })
      );

      try {
        console.log('======================>', calendariosOriginalesRefactorizados.length);
        // console.log(
        //   "calendariosOriginalesRefactorizados",
        //   calendariosOriginalesRefactorizados
        // );
        const filtrados = calendariosOriginalesRefactorizados.filter((x) => {
          return x !== null && typeof x !== 'undefined';
        });
        const savedCalendarios = await this.calendario.insertMany(filtrados);
        response.send({
          savedCalendarios,
        });
      } catch (e) {
        console.log('ERROR', e);
        // response.send({
        //   error: calendariosOriginales,
        // });
        next(new HttpException(500, 'Ocurrió un error al guardar las calendariosOriginales'));
      }
    } catch (e2) {
      console.log('ERROR', e2);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
}

export default CalendarioController;
