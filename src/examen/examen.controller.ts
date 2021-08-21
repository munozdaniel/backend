import mongoose from 'mongoose';
import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import Controller from '../interfaces/controller.interface';

import examenModel from './examen.model';
import alumnoModel from '../alumnos/alumno.model';
import passport from 'passport';
const ObjectId = mongoose.Types.ObjectId;
import planillaTallerModel from '../planillaTaller/planillaTaller.model';
class ExamenController implements Controller {
  public path = '/examen';
  public router = Router();
  private examen = examenModel;
  private alumno = alumnoModel;
  private planillaTaller = planillaTallerModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/por-planilla-alumno`, passport.authenticate('jwt', { session: false }), this.obtenerPorPlanillaYAlumnno);

    this.router.put(`${this.path}`, passport.authenticate('jwt', { session: false }), this.agregarExamen);
    this.router.delete(`${this.path}/eliminar/:id`, passport.authenticate('jwt', { session: false }), this.eliminar);
  }
  private eliminar = async (request: Request, response: Response, next: NextFunction) => {
    const _id = request.params.id;
    try {
      const examen = await this.examen.findByIdAndDelete(_id);
      if (examen) {
        response.send({ examen, status: 200 });
      } else {
        response.send(examen);
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Error Interno'));
    }
  };

  private obtenerPorPlanillaYAlumnno = async (request: Request, response: Response, next: NextFunction) => {
    const { alumnoId, planillaId } = request.body;
    try {
      // console.log({ alumno: ObjectId(alumnoId), planilla: ObjectId(planillaId) });
      const examen = await this.examen.find({ alumno: ObjectId(alumnoId), planillaTaller: ObjectId(planillaId) }).sort('_id');
      response.send(examen);
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Error Interno'));
    }
  };

  private agregarExamen = async (request: Request, response: Response, next: NextFunction) => {
    const { alumnoId, planillaId, mes, nota, ausente } = request.body;
    try {
      const alumno = await this.alumno.findById(alumnoId);
      if (!alumno) {
        return response.status(400).send('No se encontró el alumno');
      }
      const planillaTaller = await this.planillaTaller.findById(planillaId);
      if (!planillaTaller) {
        return response.status(400).send('No se encontró la planilla');
      }
      const unExamen = {
        mes,
        nota,
        alumno,
        planillaTaller,
        ausente,
      };
      const createdExamen = new this.examen({
        ...unExamen,
      });
      const saved = await createdExamen.save();

      response.send(saved);
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Error Interno'));
    }
  };
}

export default ExamenController;
