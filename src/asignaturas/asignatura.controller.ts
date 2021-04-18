import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import NotFoundException from '../exceptions/NotFoundException';
import Controller from '../interfaces/controller.interface';
import validationMiddleware from '../middleware/validation.middleware';
import CreateAsignaturaDto from './asignatura.dto';
import Asignatura from './asignatura.interface';
import asignaturaModel from './asignatura.model';
import escapeStringRegexp from 'escape-string-regexp';
import IAsignatura from './asignatura.interface';
import asignaturaOriginalModel from './asignaturaOriginal.model';
import cursoModel from '../cursos/curso.model';
import moment from 'moment';
class AsignaturaController implements Controller {
  public path = '/asignaturas';
  public router = Router();
  private curso = cursoModel;
  private asignatura = asignaturaModel;
  private asignaturaOriginal = asignaturaOriginalModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/migrar`, this.migrar);
    this.router.get(`${this.path}/test`, this.test);
    this.router.get(`${this.path}`, this.getAllAsignaturas);
    this.router.get(`${this.path}/habilitados`, this.getAllAsignaturasHabilitadas);
    // this.router.get(`${this.path}/paginado`, this.getAllAsignaturasPag);

    // Using the  route.all in such a way applies the middleware only to the route
    // handlers in the chain that match the  `${this.path}/*` route, including  POST /asignaturas.
    this.router
      .all(`${this.path}/*`)
      .patch(`${this.path}/:id`, validationMiddleware(CreateAsignaturaDto, true), this.modifyAsignatura)
      .get(`${this.path}/:id`, this.obtenerAsignaturaPorId)
      .delete(`${this.path}/:id`, this.deleteAsignatura)
      .put(`${this.path}/deshabilitar/:id`, this.deshabilitarAsignatura)
      .put(`${this.path}/habilitar/:id`, this.habilitarAsignatura)
      .put(
        this.path,
        validationMiddleware(CreateAsignaturaDto),
        // checkPermisos(rolesEnum.ADMIN), // elimintar. test
        this.createAsignatura
      );
  }
  private test = async (request: Request, response: Response) => {
    const now = new Date();
    const hoy = new Date(moment(now).format('YYYY-MM-DD'));
    const asignaturaData: any = {
      detalle: 'detalle',
      tipoAsignatura: 'ALGO',
      tipoCiclo: 'ALGO',
      tipoFormacion: 'ALGO',
      curso: 1,
      meses: 4,
      horasCatedraAnuales: 4,
      horasCatedraSemanales: 2,
      activo: true,
      fechaCreacion: hoy,
    };

    try {
      const createdAsignatura = new this.asignatura({
        ...asignaturaData,
        // author: request.user ? request.user._id : null,
      });
      const saved = await createdAsignatura.save();
      // await savedProfesor.populate('author', '-password').execPopulate();
      response.send(saved);
    } catch (error) {
      console.log('ERROR', error);
      response.send(error.message);
    }
  };
  private getAllAsignaturas = async (request: Request, response: Response) => {
    const asignaturas = await this.asignatura.find().sort('_id'); //.populate('author', '-password') populate con imagen

    response.send(asignaturas);
  };
  private getAllAsignaturasHabilitadas = async (request: Request, response: Response) => {
    const asignaturas = await this.asignatura.find({ activo: true }).sort('_id'); //.populate('author', '-password') populate con imagen

    response.send(asignaturas);
  };
  private obtenerAsignaturaPorId = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const asignatura = await this.asignatura.findById(id);
      if (asignatura) {
        response.send(asignatura);
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private migrar = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const asignaturas: any = await this.asignaturaOriginal.find();
      const now = new Date();
      const hoy = new Date(moment(now).format('YYYY-MM-DD'));
      const asignaturasRefactorizados: IAsignatura[] = await Promise.all(
        asignaturas.map(async (x: any, index: number) => {
          // const cursos = await this.curso.find({ curso: Number(x.Tcurso) });
          if (!x.DetalleAsignatura || x.DetalleAsignatura.length < 1) {
            return null;
          }
          const unaAsignatura: IAsignatura & any = {
            // _id: x._id,
            // asignaturaNro: 100 + index,
            detalle: x.DetalleAsignatura,
            tipoAsignatura: x.TipoAsignatura ? (x.TipoAsignatura === 'Materia' ? 'Aula' : x.TipoAsignatura) : null,
            tipoCiclo: x.TipoCiclo.toUpperCase(),
            tipoFormacion: x.Tipodeformacion,
            curso: Number(x.Tcurso),
            meses: Number(x.Meses),
            horasCatedraAnuales: x.HorasCatedraAnuales ? x.HorasCatedraAnuales : 0,
            horasCatedraSemanales: x.HorasCatedraSemanales ? x.HorasCatedraSemanales : 0,

            fechaCreacion: hoy,
            activo: true,
            IdAsignarutas: x.IdAsignarutas,
          };

          return unaAsignatura;
        })
      );

      try {
        const filtrados = asignaturasRefactorizados.filter((x) => {
          return x !== null && typeof x !== 'undefined';
        });
        const savedAsignaturas = await this.asignatura.insertMany(filtrados);
        response.send({
          savedAsignaturas,
        });
      } catch (e) {
        console.log('ERROR', e);
        next(new HttpException(500, 'Ocurrió un error al guardar las asignaturas'));
      }
    } catch (e2) {
      console.log('ERROR', e2);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private getAsignaturaById = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const asignatura = await this.asignatura.findById(id).populate('imagenes');
      if (asignatura) {
        response.send(asignatura);
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private modifyAsignatura = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    const asignaturaData: Asignatura = request.body;
    try {
      const asignatura = await this.asignatura.findByIdAndUpdate(id, asignaturaData, {
        new: true,
      });

      if (asignatura) {
        response.send(asignatura);
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private createAsignatura = async (request: Request, response: Response, next: NextFunction) => {
    // Agregar datos
    const asignaturaData: CreateAsignaturaDto = request.body;
    const createdAsignatura = new this.asignatura({
      ...asignaturaData,
      // author: request.user ? request.user._id : null,
    });
    const savedAsignatura = await createdAsignatura.save();
    // await savedAsignatura.populate('author', '-password').execPopulate();
    response.send(savedAsignatura);
  };
  private createAsignaturaComplete = async (request: Request, response: Response, next: NextFunction) => {
    // Agregar foto
    // Agregar datos
    const asignaturaData: CreateAsignaturaDto = request.body;
    const createdAsignatura = new this.asignatura({
      ...asignaturaData,
      // author: request.user ? request.user._id : null,
    });
    const savedAsignatura = await createdAsignatura.save();
    //     const imagen: ImagenDto = {
    //       descripcion:''
    // posicion:.posicion,
    // src:''
    //     }
    // await savedAsignatura.populate('author', '-password').execPopulate();
    response.send(savedAsignatura);
  };
  private deleteAsignatura = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const successResponse = await this.asignatura.findByIdAndDelete(id);
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
  private deshabilitarAsignatura = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const successResponse = await this.asignatura.findByIdAndUpdate(id, {
        activo: false,
      });
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
  private habilitarAsignatura = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const successResponse = await this.asignatura.findByIdAndUpdate(id, {
        activo: true,
      });
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
}

export default AsignaturaController;
