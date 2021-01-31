import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import NotFoundException from '../exceptions/NotFoundException';
import Controller from '../interfaces/controller.interface';
import validationMiddleware from '../middleware/validation.middleware';
import CreatePlanillaTallerDto from './planillaTaller.dto';
import PlanillaTaller from './planillaTaller.interface';
import planillaTallerModel from './planillaTaller.model';
import escapeStringRegexp from 'escape-string-regexp';
import IPlanillaTaller from './planillaTaller.interface';
import planillaTallerOriginalModel from './planillaTallerOriginal.model';
import alumnoModel from '../alumnos/alumno.model';
import asignaturaModel from '../asignaturas/asignatura.model';
import profesorModel from '../profesores/profesor.model';
class PlanillaTallerController implements Controller {
  public path = '/planilla-taller';
  public router = Router();
  private planillaTaller = planillaTallerModel;
  private asignatura = asignaturaModel;
  private profesor = profesorModel;
  private planillaTallerOriginal = planillaTallerOriginalModel;
  private alumno = alumnoModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    console.log('PlanillaTallerController/initializeRoutes');
    this.router.get(`${this.path}/migrar`, this.migrarPlanillaTalleres);
  }
  private migrarPlanillaTalleres = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const planillasTalleres: any = await this.planillaTallerOriginal.find();
      console.log('planillasTalleres>', planillasTalleres);

      const planillasTalleresRefactorizados: IPlanillaTaller[] = await Promise.all(
        planillasTalleres.map(async (x: any, index: number) => {
          let asig :any=[];
          let prof :any=[];
          try {
            asig = await this.asignatura.findOne({
              IdAsignarutas: x.id_asignatura,
            });
          } catch (ero) {
            console.log('ero', ero);
          }
          try {
            prof = await this.profesor.findOne({
              id_profesores: x.Id_Profesor,
            });
          } catch (ero) {
            console.log('ero2', ero);
          }
          const unaPlanillaTaller: IPlanillaTaller & any = {
            asignaturaId: asig,
            profesorId: prof,
            curso: x.Tcurso,
            division: x.division,
            comision: x.comision,
            cicloLectivo: x.ciclo_lectivo,
            fechaInicio: x.FechaInicio,
            observacion: x.Observacion,
            fechaFinalizacion: x.FechaFinalizacion,
            bimestre: x.Bimestre,

            fechaCreacion: new Date(),
            activo: true,
          };

          return unaPlanillaTaller;
        })
      );

      try {
        console.log('planillasTalleresRefactorizados', planillasTalleresRefactorizados);
        const savedPlanillaTallers = await this.planillaTaller.insertMany(
          planillasTalleresRefactorizados
        );
        response.send({
          savedPlanillaTallers,
        });
      } catch (e) {
        console.log('ERROR', e);
        next(
          new HttpException(
            500,
            'Ocurrió un error al guardar las planillasTalleres'
          )
        );
      }
    } catch (e2) {
      console.log('ERROR', e2);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
}

export default PlanillaTallerController;
