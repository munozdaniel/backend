import HttpException from "../exceptions/HttpException";
import { Request, Response, NextFunction, Router } from "express";
import NotFoundException from "../exceptions/NotFoundException";
import Controller from "../interfaces/controller.interface";
import validationMiddleware from "../middleware/validation.middleware";
import CreateSeguimientoAlumnoDto from "./seguimientoAlumno.dto";
import SeguimientoAlumno from "./seguimientoAlumno.interface";
import seguimientoAlumnoModel from "./seguimientoAlumno.model";
import escapeStringRegexp from "escape-string-regexp";
import ISeguimientoAlumno from "./seguimientoAlumno.interface";
import seguimientoAlumnoOriginalModel from "./seguimientoAlumnoOriginal.model";
import planillaTallerModel from "../planillaTaller/planillaTaller.model";
import alumnoModel from "../alumnos/alumno.model";
class SeguimientoAlumnoController implements Controller {
  public path = "/seguimiento-alumnos";
  public router = Router();
  private seguimientoAlumno = seguimientoAlumnoModel;
  private planillaTaller = planillaTallerModel;
  private alumno = alumnoModel;
  private seguimientoAlumnoOriginal = seguimientoAlumnoOriginalModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    console.log("SeguimientoAlumnoController/initializeRoutes");
    this.router.get(`${this.path}/migrar`, this.migrar);
  }
  private migrar = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const seguimientosOriginales: any = await this.seguimientoAlumnoOriginal.find();
      console.log("seguimientosOriginales>", seguimientosOriginales);

      const seguimientoRefactorizados: ISeguimientoAlumno[] = await Promise.all(
        seguimientosOriginales.map(async (x: any, index: number) => {
          let planillataller: any = [];
          let alumno: any = [];
          try {
            planillataller = await this.planillaTaller.findOne({
              planillaTallerId: x.IdPlanillaDeTaller,
            });
          } catch (ero) {
            console.log("ero", ero);
          }
          try {
            alumno = await this.alumno.findOne({
              alumnoId: x.id_alumno,
            });
          } catch (ero) {
            console.log("ero", ero);
          }
          const unSeguimientoAlumno: ISeguimientoAlumno & any = {
            seguimientoAlumnoNro: index + 100,
            alumno: alumno,
            planillaTaller: planillataller,
            fecha: x.fecha,
            tipoSeguimiento: x.tipo_seguimiento,
            cicloLectivo: x.ciclo_lectivo,
            resuelto: x.Resuelto === "SI" ? true : false,
            observacion: x.observacion,
            observacion2: x.Observacion,
            observacionJefe: x.ObservacionJefe,

            fechaCreacion: new Date(),
            activo: true,
          };

          return unSeguimientoAlumno;
        })
      );

      try {
        console.log("seguimientoRefactorizados", seguimientoRefactorizados);
        const savedPlanillaTallers = await this.seguimientoAlumno.insertMany(
          seguimientoRefactorizados
        );
        response.send({
          savedPlanillaTallers,
        });
      } catch (e) {
        console.log("ERROR", e);
        next(
          new HttpException(
            500,
            "Ocurrió un error al guardar las planillasTalleres"
          )
        );
      }
    } catch (e2) {
      console.log("ERROR", e2);
      next(new HttpException(400, "Parametros Incorrectos"));
    }
  };
}

export default SeguimientoAlumnoController;
