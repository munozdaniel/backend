import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import NotFoundException from '../exceptions/NotFoundException';
import Controller from '../interfaces/controller.interface';
import validationMiddleware from '../middleware/validation.middleware';
import CreateAsistenciaDto from './asistencia.dto';
import Asistencia from './asistencia.interface';
import asistenciaModel from './asistencia.model';
import escapeStringRegexp from 'escape-string-regexp';
import IAsistencia from './asistencia.interface';
import asistenciaOriginalModel from './asistenciaOriginal.model';
import CrearComisionDto from '../comisiones/comision.dto';
import planillaTallerModel from '../planillaTaller/planillaTaller.model';
import alumnoModel from '../alumnos/alumno.model';
class AsistenciaController implements Controller {
  public path = '/asistencia';
  public router = Router();
  private asistencia = asistenciaModel;
  private planillaTaller = planillaTallerModel;
  private alumno = alumnoModel;
  private asistenciaOriginal = asistenciaOriginalModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    console.log('AsistenciaController/initializeRoutes');
    this.router.get(`${this.path}/migrar`, this.migrar);
  }

  private migrar = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const asistenciasOriginales: any = await this.asistenciaOriginal.find();
      // console.log('asistenciasOriginales>', asistenciasOriginales);

      const asistenciasOriginalesRefactorizados: IAsistencia[] = await Promise.all(
        asistenciasOriginales.map(async (x: any, index: number) => {
          let planillataller: any = [];
          let alumno: any = [];
          try {
            planillataller = await this.planillaTaller.findOne({
              planillaTallerId: x.id_planilla_de_taller,
            });
          } catch (ero) {
            console.log('ero', ero);
          }
          try {
            alumno = await this.alumno.findOne({
              alumnoId: x.id_alumnos,
            });
          } catch (ero) {
            console.log('ero', ero);
          }

          // console.log('unaPlanillaTaller', unaPlanillaTaller);
          const unaAsistencia: IAsistencia & any = {
            asistenciaNro: index,
            id_planilla_de_asistencia: x.id_planilla_de_asistencia, // solo para migrar
            planillaTaller: planillataller,
            alumno: alumno,
            fecha: x.Fecha,
            presente: x.Presente === 'SI' ? true : false,
            llegoTarde: x.LlegoTarde === 'SI' ? true : false,

            fechaCreacion: new Date(),
            activo: true,
          };

          return unaAsistencia;
        })
      );

      try {
        console.log('asistenciasOriginalesRefactorizados', asistenciasOriginalesRefactorizados);
        const savedAsistencias = await this.asistencia.insertMany(asistenciasOriginalesRefactorizados);
        response.send({
          savedAsistencias,
        });
      } catch (e) {
        console.log('ERROR', e);
        // response.send({
        //   error: asistenciasOriginalesRefactorizados,
        // });
        next(new HttpException(500, 'Ocurrió un error al guardar las asistenciasOriginales'));
      }
    } catch (e2) {
      console.log('ERROR', e2);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
}

export default AsistenciaController;
