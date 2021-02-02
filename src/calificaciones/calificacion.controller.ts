import HttpException from "../exceptions/HttpException";
import { Request, Response, NextFunction, Router } from "express";
import NotFoundException from "../exceptions/NotFoundException";
import Controller from "../interfaces/controller.interface";
import validationMiddleware from "../middleware/validation.middleware";
import CreateCalificacionDto from "./calificacion.dto";
import Calificacion from "./calificacion.interface";
import calificacionModel from "./calificacion.model";
import escapeStringRegexp from "escape-string-regexp";
import ICalificacion from "./calificacion.interface";
import calificacionOriginalModel from "./calificacionOriginal.model";
import CrearComisionDto from "../comisiones/comision.dto";
import planillaTallerModel from "../planillaTaller/planillaTaller.model";
import alumnoModel from "../alumnos/alumno.model";
import profesorModel from "../profesores/profesor.model";
class CalificacionController implements Controller {
  public path = "/calificacion";
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
    console.log("CalificacionController/initializeRoutes");
    this.router.get(`${this.path}/migrar`, this.migrar);
  }

  private migrar = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const calificacionsOriginales: any = await this.calificacionOriginal.find();
      console.log("calificacionsOriginales>", calificacionsOriginales);

      const calificacionsOriginalesRefactorizados: ICalificacion[] = await Promise.all(
        calificacionsOriginales.map(async (x: any, index: number) => {
          let planillataller: any = null;
          let alumno: any = null;
          let profesor: any = null;
          try {
            planillataller = await this.planillaTaller.findOne({
              planillaTallerId: x.id_planilla_de_taller,
            });
          } catch (ero) {
            console.log("ero", ero);
          }
          try {
            profesor = await this.profesor.findOne({
              id_profesores: x.id_profesor,
            });
          } catch (ero) {
            console.log("ero", ero);
          }
          try {
            alumno = await this.alumno.findOne({
              alumnoId: x.Id_alumno,
            });
          } catch (ero) {
            console.log("ero", ero);
          }
          const unaCalificacion: ICalificacion & any = {
            calificacionNro: 100 + index,
            id_calificaciones: x.id_calificaciones, // solo para migrar
            planillaTaller: planillataller,
            profesor: profesor,
            alumno: alumno,
            formaExamen: x.forma_del_examen,
            tipoExamen: x.tipo_de_examen,
            promedioGeneral: x.PromedioGeneral,
            observaciones: x.Observaciones,
            promedia: x.promedia === "SI" ? true : false,

            fechaCreacion: new Date(),
            activo: true,
          };

          return unaCalificacion;
        })
      );

      try {
        console.log(
          "======================>",
          calificacionsOriginalesRefactorizados.length
        );
        // console.log(
        //   "calificacionsOriginalesRefactorizados",
        //   calificacionsOriginalesRefactorizados
        // );
        const savedCalificacions = await this.calificacion.insertMany(
          calificacionsOriginalesRefactorizados
        );
        response.send({
          savedCalificacions,
        });
      } catch (e) {
        console.log("ERROR", e);
        // response.send({
        //   error: calificacionsOriginales,
        // });
        next(
          new HttpException(
            500,
            "Ocurrió un error al guardar las calificacionsOriginales"
          )
        );
      }
    } catch (e2) {
      console.log("ERROR", e2);
      next(new HttpException(400, "Parametros Incorrectos"));
    }
  };
}

export default CalificacionController;
