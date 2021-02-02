import HttpException from "../exceptions/HttpException";
import { Request, Response, NextFunction, Router } from "express";
import NotFoundException from "../exceptions/NotFoundException";
import Controller from "../interfaces/controller.interface";
import validationMiddleware from "../middleware/validation.middleware";
import CreatePlanillaTallerDto from "./planillaTaller.dto";
import PlanillaTaller from "./planillaTaller.interface";
import planillaTallerModel from "./planillaTaller.model";
import escapeStringRegexp from "escape-string-regexp";
import IPlanillaTaller from "./planillaTaller.interface";
import planillaTallerOriginalModel from "./planillaTallerOriginal.model";
import alumnoModel from "../alumnos/alumno.model";
import asignaturaModel from "../asignaturas/asignatura.model";
import profesorModel from "../profesores/profesor.model";
import comisionModel from "../comisiones/comision.model";
import CrearComisionDto from "../comisiones/comision.dto";
class PlanillaTallerController implements Controller {
  public path = "/planilla-taller";
  public router = Router();
  private planillaTaller = planillaTallerModel;
  private asignatura = asignaturaModel;
  private profesor = profesorModel;
  private planillaTallerOriginal = planillaTallerOriginalModel;
  private comision = comisionModel;
  private alumno = alumnoModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    console.log("PlanillaTallerController/initializeRoutes");
    this.router.get(`${this.path}/migrar`, this.migrarPlanillaTalleres);
    this.router.get(`${this.path}/test`, this.test);
  }
  private test = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    response.send({
      test: "savedPlanillaTallers",
    });
  };
  private migrarPlanillaTalleres = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const planillasTalleres: any = await this.planillaTallerOriginal.find();
      // console.log('planillasTalleres>', planillasTalleres);

      const planillasTalleresRefactorizados: IPlanillaTaller[] = await Promise.all(
        planillasTalleres.map(async (x: any, index: number) => {
          let asig: any = [];
          let prof: any = [];
          try {
            asig = await this.asignatura.findOne({
              IdAsignarutas: x.id_asignatura,
            });
          } catch (ero) {
            console.log("ero", ero);
          }
          try {
            prof = await this.profesor.findOne({
              id_profesores: x.Id_Profesor,
            });
          } catch (ero) {
            console.log("ero2", ero);
          }
          let unaComision: any = null;
          unaComision = await this.comision.findOne({
            division: x.division,
            comision: x.comision,
            curso: x.Tcurso,
            cicloLectivo: x.ciclo_lectivo,
          });
          if (!unaComision) {
            if (
              x.comision &&
              x.comision.length > 0 &&
              x.ciclo_lectivo !== 0 &&
              x.ciclo_lectivo !== 20
            ) {
              try {
                const comisionData: CrearComisionDto = {
                  division: x.division,
                  comision: x.comision,
                  curso: x.Tcurso,
                  cicloLectivo: x.ciclo_lectivo,
                  activo: true,
                  fechaCreacion: new Date().toString(),
                };
                const created = new this.comision({
                  ...comisionData,
                  // author: request.user ? request.user._id : null,
                });
                unaComision = await created.save();
                console.log("unaComision save", unaComision);
              } catch (ero) {
                console.log("ero4", ero);
              }
            } else {
              // registros que no van a ser guardados
              console.log("Estas son las comisiones que no estan bien cargadas y que no puedo encontrar", x);

              return null;
            }
          } else {
            // console.log("unaComision findone", unaComision);
          }

          // console.log('unaComision', unaComision);
          const unaPlanillaTaller: IPlanillaTaller & any = {
            planillaTallerId: x.id_planilla_de_taller,
            asignaturaId: asig,
            profesorId: prof,
            comision: unaComision,

            // curso: x.Tcurso,
            // division: x.division,
            // comision: x.comision,
            // cicloLectivo: x.ciclo_lectivo,
            fechaInicio: x.FechaInicio,
            observacion: x.Observacion,
            fechaFinalizacion: x.FechaFinalizacion,
            bimestre: x.Bimestre ? x.Bimestre : "SIN REGISTRAR",

            fechaCreacion: new Date(),
            activo: true,
          };

          return unaPlanillaTaller;
        })
      );

      try {
        const filtrados = planillasTalleresRefactorizados.filter(
          (x) => x !== null && typeof x !== "undefined"
        );
        console.log(
          "FIN=============================",
          planillasTalleresRefactorizados.length,
          filtrados.length
        );
        const savedPlanillaTallers = await this.planillaTaller.insertMany(
          filtrados
        );
        response.send({
          savedPlanillaTallers,
        });
      } catch (e) {
        console.log("ERROR", e);
        // response.send({
        //   error: planillasTalleresRefactorizados,
        // });
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

export default PlanillaTallerController;
