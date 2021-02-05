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
import { IQueryPaginator } from "../utils/interfaces/iQueryPaginator";
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
    this.router.get(`${this.path}/paginar`, this.paginar);
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
  private paginar = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const parametros: IQueryPaginator = request.query;
    console.log("parametros, ", parametros);
    let campo = null;
    switch (parametros.sortField) {
      case "cicloLectivo":
        campo = "comision.cicloLectivo";
        break;
      case "asignatura":
        campo = "asignatura.detalle";
        break;
      case "profesor":
        campo = "profesor.nombreCompleto";
        break;
      default:
        campo = parametros.sortField;
        break;
    }
    const sort = parametros.sortField
      ? { [campo]: parametros.sortOrder }
      : null;
    console.log("====>m ", sort);
    const aggregate = this.planillaTaller.aggregate([
      {
        $lookup: {
          from: "comisiones", //otherCollection
          localField: "comision",
          foreignField: "_id",
          as: "comision",
        },
      },
      { $unwind: "$comision" },
      {
        $lookup: {
          from: "profesores", //otherCollection
          localField: "profesor",
          foreignField: "_id",
          as: "profesor",
        },
      },
      { $unwind: "$profesor" },
      {
        $lookup: {
          from: "asignaturas", //otherCollection
          localField: "asignatura",
          foreignField: "_id",
          as: "asignatura", // nombre resultante de la union (uso el mismo)
        },
      },
      { $unwind: "$asignatura" }, // desestructura cada asignatura en un registro
    ]);
    this.planillaTaller.aggregatePaginate(
      aggregate,
      {
        // populate: ["asignatura", "profesor", "comision"],
        page: Number(parametros.pageNumber),
        limit: Number(parametros.pageSize),
        sort, // sort: {
        //   planillaTallerId: parametros.sortOrder === "asc" ? 1 : -1,
        // },
      },
      (err: any, result: any) => {
        if (err) {
          console.log("[ERROR]", err);
        }
        console.log("result", result);
        // result.docs
        // result.total
        // result.limit - 10
        // result.page - 3
        // result.pages
        response.send(result);
      }
    );
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
              console.log(
                "Estas son las comisiones que no estan bien cargadas y que no puedo encontrar",
                x
              );

              return null;
            }
          } else {
            // console.log("unaComision findone", unaComision);
          }

          // console.log('unaComision', unaComision);
          const unaPlanillaTaller: IPlanillaTaller & any = {
            planillaTallerNro: 100 + index,
            planillaTallerId: x.id_planilla_de_taller,
            asignatura: asig,
            profesor: prof,
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
