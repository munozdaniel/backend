import mongoose from 'mongoose';
import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import Controller from '../interfaces/controller.interface';
import alumnoTallerModel from './alumnoTaller.model';
import alumnoModel from '../alumnos/alumno.model';
import IAlumnoTaller from './alumnoTaller.interface';
import planillaTallerModel from '../planillaTaller/planillaTaller.model';
import passport from 'passport';

const ObjectId = mongoose.Types.ObjectId;
class AlumnoTallerController implements Controller {
  public path = '/alumno-taller';
  public router = Router();
  private alumnoTaller = alumnoTallerModel;
  private alumno = alumnoModel;
  private planillaTaller = planillaTallerModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router
      .all(`${this.path}/*`, passport.authenticate('jwt', { session: false }))
      .get(`${this.path}/planilla-personalizada/:id`, this.obtenerAlumnosPorPlanillaPersonalizada)
      .get(`${this.path}/planilla-personalizada-sp`, this.obtenerAlumnosPorPlanillaPersonalizadaSP)
      .post(`${this.path}/por-curso-especifico`, this.obtenerAlumnosTallerPorCursoEspecifico)
      .post(`${this.path}/por-curso-especifico-sp`, this.obtenerAlumnosTallerPorCursoEspecificoSP)
      .put(`${this.path}/:id`, this.agregarAlumnosALaPlanilla);
  }
  private obtenerAlumnosTallerPorCursoEspecificoSP = async (request: Request, response: Response, next: NextFunction) => {
    const { curso, comision, division, cicloLectivo } = request.body;

    let match: any = {
      'estadoCursadas.activo': true,
      'estadoCursadas.cicloLectivo._id': ObjectId(cicloLectivo._id),
      'estadoCursadas.curso.comision': comision,
      'estadoCursadas.curso.curso': Number(curso),
      'estadoCursadas.curso.division': Number(division),
      activo: true,
    };
    // obtenemos los alumnos
    const opciones: any = [
      {
        $lookup: {
          from: 'estadocursadas',
          localField: 'estadoCursadas',
          foreignField: '_id',
          as: 'estadoCursadas',
        },
      },
      {
        $unwind: {
          path: '$estadoCursadas',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'ciclolectivos',
          localField: 'estadoCursadas.cicloLectivo',
          foreignField: '_id',
          as: 'estadoCursadas.cicloLectivo',
        },
      },
      {
        $unwind: {
          path: '$estadoCursadas.cicloLectivo',
        },
      },
      {
        $lookup: {
          from: 'cursos',
          localField: 'estadoCursadas.curso',
          foreignField: '_id',
          as: 'estadoCursadas.curso',
        },
      },
      {
        $unwind: {
          path: '$estadoCursadas.curso',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: match,
      },
      {
        $sort: {
          _id: -1,
        },
      },
    ];
    const alumnosTaller = await this.alumno.aggregate(opciones);
    if (alumnosTaller && alumnosTaller.length > 0) {
      const alumnosRetorno = await Promise.all(
        alumnosTaller.map((x) => {
          return {
            selected: false,
            alumno: x,
            planillaTaller: null,
          };
        })
      );
      return response.status(200).send(alumnosRetorno);
    } else {
      response.send([]);
    }
  };
  private obtenerAlumnosTallerPorCursoEspecifico = async (request: Request, response: Response, next: NextFunction) => {
    const { planillaTaller, curso, comision, division, cicloLectivo } = request.body;

    let match: any = {
      'estadoCursadas.activo': true,
      'estadoCursadas.cicloLectivo._id': ObjectId(cicloLectivo._id),
      // 'estadoCursadas.curso.comision': comision,
      'estadoCursadas.curso.curso': Number(curso),
      'estadoCursadas.curso.division': Number(division),
      activo: true,
    };
    // obtenemos los alumnos
    const opciones: any = [
      {
        $lookup: {
          from: 'estadocursadas',
          localField: 'estadoCursadas',
          foreignField: '_id',
          as: 'estadoCursadas',
        },
      },
      {
        $unwind: {
          path: '$estadoCursadas',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'ciclolectivos',
          localField: 'estadoCursadas.cicloLectivo',
          foreignField: '_id',
          as: 'estadoCursadas.cicloLectivo',
        },
      },
      {
        $unwind: {
          path: '$estadoCursadas.cicloLectivo',
        },
      },
      {
        $lookup: {
          from: 'cursos',
          localField: 'estadoCursadas.curso',
          foreignField: '_id',
          as: 'estadoCursadas.curso',
        },
      },
      {
        $unwind: {
          path: '$estadoCursadas.curso',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: match,
      },
      {
        $sort: {
          _id: -1,
        },
      },
    ];
    const alumnosTaller = await this.alumno.aggregate(opciones);
    if (alumnosTaller && alumnosTaller.length > 0) {
      const alumnosPorPlanilla = await this.alumnoTaller.find({ planillaTaller: ObjectId(planillaTaller._id) });
      if (!alumnosPorPlanilla || alumnosPorPlanilla.length < 1) {
        const alumnosRetorno = await Promise.all(
          alumnosTaller.map((x) => {
            return {
              selected: false,
              alumno: x,
              planillaTaller,
            };
          })
        );
        return response.status(200).send(alumnosRetorno);
      } else {
        const alumnosRetorno = await Promise.all(
          alumnosTaller.map((x: any) => {
            const index = alumnosPorPlanilla.findIndex((i: IAlumnoTaller, ind) => {
              return i.alumno.toString() === x._id.toString();
            });
            if (index === -1) {
              return {
                selected: false,
                alumno: x,
                planillaTaller,
              };
            } else {
              return {
                selected: true,
                alumno: x,
                planillaTaller,
              };
            }
          })
        );
        return response.status(200).send(alumnosRetorno);
      }
    } else {
      response.send([]);
    }
  };
  private agregarAlumnosALaPlanilla = async (request: Request, response: Response, next: NextFunction) => {
    const planillaId = request.params.id;
    const alumnosTaller: IAlumnoTaller[] = request.body;
    try {
      const alumnosPorPlanilla = await this.alumnoTaller.find({ planillaTaller: ObjectId(planillaId) });
      // YA HAY ALUMNOSTALLER
      if (alumnosPorPlanilla && alumnosPorPlanilla.length > 0) {
        // recorremos los alumnos que ya tenemos insertado para ver si los borramos
        const alumnosEliminados = await Promise.all(
          alumnosPorPlanilla.map(async (x) => {
            const index = alumnosTaller.findIndex((i: any) => i.alumno.toString() === x.alumno.toString());
            if (index === -1) {
              // Si el alumnotaller no existe en alumnos entonces lo borramos
              try {
                await this.alumnoTaller.findOneAndDelete({
                  alumno: ObjectId(x.alumno._id.toString()),
                  planillaTaller: ObjectId(planillaId.toString()),
                });
              } catch (errorDelete) {
                console.log('[ERROR DELETE]', errorDelete);
                next(new HttpException(500, 'Problemas  interno'));
              }
            } else {
              // si ya existe no hacemos nada
            }
          })
        );
        // recorremos los alumnosTaller que vienen por parametro para ver si insertamos alguno
        const alumnosAgregados = await Promise.all(
          alumnosTaller.map(async (x: any) => {
            const index = alumnosPorPlanilla.findIndex((i: any) => i.alumno.toString() === x.alumno.toString());
            if (index === -1) {
              // Insertamos
              const createdAlumnoT = new this.alumnoTaller({
                ...x,
                // author: request.user ? request.user._id : null,
              });
              try {
                const savedAlumno = await createdAlumnoT.save();
              } catch (errorAdd) {
                console.log('[ERROR ADD]', errorAdd);
                next(new HttpException(500, 'Problemas  interno'));
              }
            } else {
              // si ya existe no hacemos nada
            }
          })
        );
        if ((alumnosAgregados && alumnosAgregados.length > 0) || (alumnosEliminados && alumnosEliminados.length > 0)) {
          const planillaActualizada = await this.planillaTaller.findByIdAndUpdate(planillaId, { personalizada: true }, { new: true });
          return response.status(200).send({
            planillaTaller: planillaActualizada,
            success: true,
            message: 'La planilla taller ha sido actualizada con los alumnos seleccionados',
          });
        } else {
          return response.status(200).send({ success: true, message: 'No se modificaron los registros' });
        }
      } else {
        // NO HAY ALUMNOSTALLER Y LOS INSERTO A TODOS

        const registrosGuardados = await Promise.all(
          alumnosTaller.map(async (x: any) => {
            // Insertamos
            const createdAlumnoT = new this.alumnoTaller({
              ...x,
              // author: request.user ? request.user._id : null,
            });
            const savedAlumno = await createdAlumnoT.save();
          })
        );
        if (registrosGuardados && registrosGuardados.length > 0) {
          const planillaActualizada = await this.planillaTaller.findByIdAndUpdate(planillaId, { personalizada: true }, { new: true });
          return response.status(200).send({
            planillaTaller: planillaActualizada,
            success: true,
            message: 'La planilla taller ha sido actualizada con los alumnos seleccionados',
          });
        } else {
          return response.status(200).send({ success: true, message: 'No se guardaron datos porque no se seleccionaron alumnos' });
        }
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Problemas  interno'));
    }
  };
  private obtenerAlumnosPorPlanillaPersonalizadaSP = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const alumnosTaller: any[] = await this.alumno.find({ activo: true });
      const alumnosRetorno = await Promise.all(
        alumnosTaller.map((x) => {
          return {
            selected: false,
            alumno: x,
            planillaTaller: null,
          };
        })
      );
      return response.status(200).send(alumnosRetorno);
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Problemas  interno'));
    }
  };
  private obtenerAlumnosPorPlanillaPersonalizada = async (request: Request, response: Response, next: NextFunction) => {
    const planillaId = request.params.id;
    try {
      const planillaTaller = await this.planillaTaller.findById(planillaId);
      const alumnosTaller: any[] = await this.alumno.find({ activo: true });
      const alumnosPorPlanilla = await this.alumnoTaller.find({ planillaTaller: ObjectId(planillaId) });
      if (!alumnosPorPlanilla || alumnosPorPlanilla.length < 1) {
        const alumnosRetorno = await Promise.all(
          alumnosTaller.map((x) => {
            return {
              selected: false,
              alumno: x,
              planillaTaller,
            };
          })
        );
        // console.log('alumnosRetorno', alumnosRetorno);
        return response.status(200).send(alumnosRetorno);
      } else {
        const alumnosRetorno = await Promise.all(
          alumnosTaller.map((x: any) => {
            const index = alumnosPorPlanilla.findIndex((i: IAlumnoTaller, ind) => {
              return i.alumno.toString() === x._id.toString();
            });
            if (index === -1) {
              return {
                selected: false,
                alumno: x,
                planillaTaller,
              };
            } else {
              return {
                selected: true,
                alumno: x,
                planillaTaller,
              };
            }
          })
        );
        // console.log(
        //   'alumnosRetorno2',
        //   alumnosRetorno.filter((x) => x.selected)
        // );
        return response.status(200).send(alumnosRetorno);
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Problemas  interno'));
    }
  };
}

export default AlumnoTallerController;
