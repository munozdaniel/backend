import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import NotFoundException from '../exceptions/NotFoundException';
import Controller from '../interfaces/controller.interface';
import validationMiddleware from '../middleware/validation.middleware';
import CreateSeguimientoAlumnoDto from './seguimientoAlumno.dto';
import SeguimientoAlumno from './seguimientoAlumno.interface';
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
    this.router.post(`${this.path}/por-planilla/:id`, this.obtenerSeguimientoAlumnoPorPlanilla);
  }
  private obtenerSeguimientoAlumnoPorPlanilla = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    const { alumnoId, ciclo } = request.body;
    console.log('alumno, cilco', alumnoId, ciclo);
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
            alumno: ObjectId(alumnoId),
            'cicloLectivo.anio': Number(ciclo),
          },
        },
      ];
      console.log({
        planillaTaller: ObjectId(id),
        alumno: ObjectId(alumnoId),
        'cicloLectivo.anio': Number(ciclo),
      });
      const seguimientos = await this.seguimientoAlumno.aggregate(opciones);
      console.log(id, 'seguimientos', seguimientos);
      if (seguimientos && seguimientos.length > 0) {
        response.send(seguimientos[0]);
      } else {
        response.send([]);
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Problemas en el servidor'));
    }
  };
  private resueltos = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { resuelto } = request.body;
      let filtro = null;
      if (typeof resuelto === 'boolean') {
        filtro = { resuelto };
      }
      const seguimientos = await this.seguimientoAlumno.find(filtro).sort('_id').populate('alumno');

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
          const cl = await ciclosLectivos.filter((d) => Number(d.anio) === (x.ciclo_lectivo === 0 ? 2019 : Number(x.ciclo_lectivo)));
          const unSeguimientoAlumno: ISeguimientoAlumno & any = {
            seguimientoAlumnoNro: index,
            alumno: alumno,
            planillaTaller: planillataller,
            fecha: x.fecha,
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
        console.log('seguimientoRefactorizados', seguimientoRefactorizados);
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
