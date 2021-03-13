import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import NotFoundException from '../exceptions/NotFoundException';
import Controller from '../interfaces/controller.interface';
import escapeStringRegexp from 'escape-string-regexp';
import ICalendario from './calendario.interface';
import calendarioModel from './calendario.model';
import calendarioOriginalModel from './calendarioOriginal.model';
import ciclolectivoModel from '../ciclolectivos/ciclolectivo.model';
import moment from 'moment';
import comisionesOriginalModel from 'comisiones/comisionOriginal.model';
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
    this.router.get(`${this.path}`, this.obtenerCalendario);
    this.router.get(`${this.path}/por-ciclo/:ciclo`, this.obtenerCalendarioPorCiclo);
    this.router.post(`${this.path}`, this.crearCalendario);
  }

  private crearCalendario = async (request: Request, response: Response, next: NextFunction) => {
    const now = new Date();
    const hoy = new Date(moment(now).format('YYYY-MM-DD'));
    const cicloLectivoActual = await this.cicloLectivo.findOne({ anio: moment().year() });
    console.log('cicloLectivoActual', cicloLectivoActual);
    const existentes = await this.calendario.aggregate([
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
          'cicloLectivo._id': ObjectId(cicloLectivoActual._id),
        },
      },
    ]);
    console.log('existentes', existentes);
    const calendarioEliminado = await Promise.all(
      existentes.map(async (x: any, index: number) => {
        const eliminados = await this.calendario.findByIdAndDelete(x._id);
      })
    );
    console.log('calendarioEliminado', calendarioEliminado.length);
    console.log('request.body', request.body);
    // Obtengo por parametro la fecha de inicio de clases

    const fechaFinal = request.body.fechaFinal;
    // cicloLectivoActual
    const calendarioNuevo = [];
    let normal = true;
    let fechaInicio = moment(request.body.fechaInicio).add(-1, 'day');
    console.log('fechaInicio', fechaInicio);
    console.log('diff', moment(fechaFinal, 'YYYY-MM-DD').isSameOrAfter(fechaInicio));
    while (moment(fechaFinal, 'YYYY-MM-DD').isSameOrAfter(fechaInicio)) {
      // while (fechaFinal.isSameOrAfter(fechaInicio)) {
      if (normal) {
        for (let i = 0; i < 3; i++) {
          fechaInicio = moment(fechaInicio).add(1, 'day');
          calendarioNuevo.push({
            cicloLectivo: cicloLectivoActual,
            comisionA: 1,
            comisionB: 1,
            comisionC: 1,
            comisionD: 1,
            comisionE: 0,
            comisionF: 0,
            comisionG: 0,
            comisionH: 0,
            fecha: moment(fechaInicio).format('YYYY-MM-DD'),
            fechaCreacion: hoy,
            activo: true,
          });
        }
        for (let i = 0; i < 2; i++) {
          fechaInicio = moment(fechaInicio).add(1, 'day');
          calendarioNuevo.push({
            cicloLectivo: cicloLectivoActual,
            comisionA: 0,
            comisionB: 0,
            comisionC: 0,
            comisionD: 0,
            comisionE: 1,
            comisionF: 1,
            comisionG: 1,
            comisionH: 1,
            fecha: moment(fechaInicio).format('YYYY-MM-DD'),
            fechaCreacion: hoy,
            activo: true,
          });
        }
      } else {
        for (let i = 0; i < 2; i++) {
          fechaInicio = moment(fechaInicio).add(1, 'day');
          calendarioNuevo.push({
            cicloLectivo: cicloLectivoActual,
            comisionA: 1,
            comisionB: 1,
            comisionC: 1,
            comisionD: 1,
            comisionE: 0,
            comisionF: 0,
            comisionG: 0,
            comisionH: 0,
            fecha: moment(fechaInicio).format('YYYY-MM-DD'),
            fechaCreacion: hoy,
            activo: true,
          });
        }
        for (let i = 0; i < 3; i++) {
          fechaInicio = moment(fechaInicio).add(1, 'day');
          calendarioNuevo.push({
            cicloLectivo: cicloLectivoActual,
            comisionA: 0,
            comisionB: 0,
            comisionC: 0,
            comisionD: 0,
            comisionE: 1,
            comisionF: 1,
            comisionG: 1,
            comisionH: 1,
            fecha: moment(fechaInicio).format('YYYY-MM-DD'),
            fechaCreacion: hoy,
            activo: true,
          });
        }
      }
      normal = !normal;
    }
    try {
      const saved = await this.calendario.insertMany(calendarioNuevo);

      response.send({ calendario: saved });
    } catch (e) {
      // [ 'errors', '_message', 'message', 'name' ]
      console.log('[ERROR]', e);
      next(new HttpException(500, 'Problemas al insertar los registros'));
    }
  };
  private obtenerCalendarioPorCiclo = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const ciclo = request.params.ciclo;
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
            'cicloLectivo.anio': Number(ciclo),
          },
        },
      ];
      const calendario = await this.calendario.aggregate(opciones);
      return response.send(calendario);
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Ocurrió un error interno'));
    }
  };
  private obtenerCalendario = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const calendario = await this.calendario.find();
      return response.send(calendario);
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Ocurrió un error interno'));
    }
  };
  private migrar = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const now = new Date();
      const hoy = new Date(moment(now).format('YYYY-MM-DD'));
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
            comisionA: x.A,
            comisionB: x.B,
            comisionC: x.C,
            comisionD: x.D,
            comisionE: x.E,
            comisionF: x.F,
            comisionG: x.G,
            comisionH: x.H,

            fechaCreacion: hoy,
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