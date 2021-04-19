import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import NotFoundException from '../exceptions/NotFoundException';
import Controller from '../interfaces/controller.interface';
import validationMiddleware from '../middleware/validation.middleware';
import CreateProfesorDto from './profesor.dto';
import Profesor from './profesor.interface';
import profesorModel, { profesorSchema } from './profesor.model';
import escapeStringRegexp from 'escape-string-regexp';
import IProfesor from './profesor.interface';
import profesorOriginalModel from './profesorOriginal.model';
import moment from 'moment';
class ProfesorController implements Controller {
  public path = '/profesores';
  public router = Router();
  private profesor: any;
  private profesorOriginal = profesorOriginalModel;

  constructor() {
    this.profesor = profesorModel;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    console.log('ProfesorController/initializeRoutes');
    this.router.get(`${this.path}/test2`, this.getAllProfesors);
    this.router.get(`${this.path}/test`, this.test);
    this.router.get(`${this.path}/migrar`, this.migrar);
    this.router.get(`${this.path}/habilitados`, this.getAllProfesoresHabilitadas);
    this.router.get(`${this.path}/:id`, this.getProfesorById);
    // this.router.get(`${this.path}/paginado`, this.getAllProfesorsPag);

    // Using the  route.all in such a way applies the middleware only to the route
    // handlers in the chain that match the  `${this.path}/*` route, including  POST /profesores.
    this.router
      .all(`${this.path}/*`)
      .patch(`${this.path}/:id`, validationMiddleware(CreateProfesorDto, true), this.modifyProfesor)
      .get(`${this.path}/:id`, this.obtenerProfesorPorId)
      .delete(`${this.path}/:id`, this.deleteProfesor)
      .put(`${this.path}/deshabilitar/:id`, this.deshabilitarProfesor)
      .put(`${this.path}/habilitar/:id`, this.habilitarProfesor)
      .put(
        this.path,
        validationMiddleware(CreateProfesorDto),
        // checkPermisos(rolesEnum.ADMIN), // elimintar. test
        this.createProfesor
      );
  }
  private test = async (request: Request, response: Response) => {
    const profesorData: any = {
      activo: true,
      nombreCompleto: 'Orlando Sotelo',
      telefono: '123123',
      celular: null,
      email: '',
      formacion: '',
      titulo: '',
      fechaCreacion: new Date(),
    };

    try {
      const createdProfesor = new this.profesor({
        ...profesorData,
        // author: request.user ? request.user._id : null,
      });
      const savedProfesor = await createdProfesor.save();
      // await savedProfesor.populate('author', '-password').execPopulate();
      response.send(savedProfesor);
    } catch (error) {
      console.log('ERROR', error);
      response.send(error.message);
    }
  };
  private getAllProfesors = async (request: Request, response: Response) => {
    const profesores = await this.profesor.find().sort('_id'); //.populate('author', '-password') populate con imagen

    response.send(profesores);
  };
  private getAllProfesoresHabilitadas = async (request: Request, response: Response) => {
    const profesores = await this.profesor.find({ activo: true }).sort('_id'); //.populate('author', '-password') populate con imagen

    response.send(profesores);
  };
  private obtenerProfesorPorId = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const profesor = await this.profesor.findById(id);
      if (profesor) {
        response.send(profesor);
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
      const now = new Date();
      const hoy = new Date(moment(now).format('YYYY-MM-DD'));
      const profesores: any = await this.profesorOriginal.find();
     
      const profesoresRefactorizados: IProfesor[] = profesores.map((x: any, index: number) => {
        const unaProfesor: IProfesor & any = {
          // _id: x._id,
          id_profesores: x.id_profesores,
          // profesorNro: 100 + index,
          nombreCompleto: x.nombre_y_apellido,
          telefono: x.telefono,
          celular: null,
          email: x.mail,
          formacion: x.formacion,
          titulo: x.tipo_de_titulacion,
          fechaCreacion: hoy,
          activo: true,
        };

        return unaProfesor;
      });

      try {
        const savedProfesors = await this.profesor.insertMany(profesoresRefactorizados);
        response.send({
          savedProfesors,
        });
      } catch (e) {
        console.log('ERROR', e);
        next(new HttpException(500, 'Ocurrió un error al guardar las profesores'));
      }
    } catch (e2) {
      console.log('ERROR', e2);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private getProfesorById = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const profesor = await this.profesor.findById(id).populate('imagenes');
      if (profesor) {
        response.send(profesor);
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private modifyProfesor = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    const profesorData: Profesor = request.body;
    try {
      const profesor = await this.profesor.findByIdAndUpdate(id, profesorData, {
        new: true,
      });

      if (profesor) {
        response.send(profesor);
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private createProfesor = async (request: Request, response: Response, next: NextFunction) => {
    // Agregar datos
    const profesorData: CreateProfesorDto = request.body;
    const createdProfesor = new this.profesor({
      ...profesorData,
      // author: request.user ? request.user._id : null,
    });
    const savedProfesor = await createdProfesor.save();
    // await savedProfesor.populate('author', '-password').execPopulate();
    response.send(savedProfesor);
  };
  
  private deleteProfesor = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const successResponse = await this.profesor.findByIdAndDelete(id);
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
  private deshabilitarProfesor = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const successResponse = await this.profesor.findByIdAndUpdate(id, {
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
  private habilitarProfesor = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const successResponse = await this.profesor.findByIdAndUpdate(id, {
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

export default ProfesorController;
