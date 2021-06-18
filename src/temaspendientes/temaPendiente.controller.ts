import mongoose from 'mongoose';
import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import Controller from '../interfaces/controller.interface';
import passport from 'passport';
import temaPendienteModel from './temaPendiente.model';
import moment from 'moment';
import NotFoundException from '../exceptions/NotFoundException';
import usuarioModel from '../usuario/usuario.model';

const ObjectId = mongoose.Types.ObjectId;
class TemaPendienteController implements Controller {
  public path = '/tema-pendiente';
  public router = Router();
  private temaPendiente = temaPendienteModel;
  private usuario = usuarioModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    console.log('TemaPendienteController/initializeRoutes');
    this.router
      .all(`${this.path}/*`, passport.authenticate('jwt', { session: false }))
      .get(`${this.path}/:id`, this.obtenerTemasPorPlanilla)
      .get(`${this.path}/por-usuario/:email`, this.obtenerTemasPorUsuario)
      .get(`${this.path}/fecha/:fecha`, this.obtenerTemaPorFecha)
      .post(`${this.path}`, this.guardarTemasPendientes)
      .post(`${this.path}/eliminar`, this.eliminarTemaPendiente)
      .delete(`${this.path}/:id`, this.eliminarTemasPendientes);
  }
  private eliminarTemaPendiente = async (request: Request, response: Response, next: NextFunction) => {
    const tema = request.body.tema;
    try {
      const fecha = new Date(moment.utc(tema.fecha).format('YYYY-MM-DD'));
      const successResponse = await this.temaPendiente.findOneAndDelete({
        planillaTaller: ObjectId(tema.planillaTaller._id),
        fecha,
      });
      if (successResponse) {
        response.send({
          status: 200,
          success: true,
          message: 'Operación Exitosa',
        });
      } else {
        response.status(404).send({
          message: 'No se encontró el tema',
        });
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private eliminarTemasPendientes = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const successResponse = await this.temaPendiente.findByIdAndDelete(id);
      if (successResponse) {
        response.send({
          status: 200,
          success: true,
          message: 'Operación Exitosa',
        });
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
  private guardarTemasPendientes = async (request: Request, response: Response, next: NextFunction) => {
    const temasPendientes = request.body.temasPendientes;
    try {
      // let usuario: any = null;
      const agregados = await Promise.all(
        temasPendientes.map(async (x: any) => {
          // if (!usuario) {
          //   usuario = await this.usuario.findOne({ email });
          // }
          // x.usuario = usuario;
          const fecha = new Date(moment.utc(x.fecha).format('YYYY-MM-DD'));
          x.fecha = fecha;
          return this.temaPendiente.findOneAndUpdate({ fecha, planillaTaller: ObjectId(x.planillaTaller._id) }, x, {
            upsert: true,
            new: true,
          });
        })
      );
      return response.status(200).send(agregados);
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Problemas interno'));
    }
  };
  private obtenerTemasPorPlanilla = async (request: Request, response: Response, next: NextFunction) => {
    const planillaId = request.params.id;
    try {
      const temas = await this.temaPendiente.find({ planillaTaller: ObjectId(planillaId) });
      return response.status(200).send(temas);
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Problemas interno'));
    }
  };
  private obtenerTemasPorUsuario = async (request: Request, response: Response, next: NextFunction) => {
    const email = request.params.email;
    try {
      const usuario: any = await this.usuario.findOne({ email });
      if (usuario) {
        const temas = await this.temaPendiente.find({ profesor: ObjectId(usuario.profesor) });
        return response.status(200).send(temas);
      } else {
        return response.status(200).send([]);
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Problemas interno'));
    }
  };
  private obtenerTemaPorFecha = async (request: Request, response: Response, next: NextFunction) => {
    const fecha = new Date(moment.utc(request.params.fecha).format('YYYY-MM-DD'));

    try {
      const temas = await this.temaPendiente.find({ fecha: fecha });
      return response.status(200).send(temas);
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Problemas interno'));
    }
  };
}

export default TemaPendienteController;
