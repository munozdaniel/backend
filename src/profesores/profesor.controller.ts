import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import NotFoundException from '../exceptions/NotFoundException';
import Controller from '../interfaces/controller.interface';
import validationMiddleware from '../middleware/validation.middleware';
import CreateProfesorDto from './profesor.dto';
import Profesor from './profesor.interface';
import profesorModel from './profesor.model';
import escapeStringRegexp from 'escape-string-regexp';
import IProfesor from './profesor.interface';
import profesorOriginalModel from './profesorOriginal.model';
class ProfesorController implements Controller {
  public path = '/profesores';
  public router = Router();
  private profesor = profesorModel;
  private profesorOriginal = profesorOriginalModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    console.log('ProfesorController/initializeRoutes');
    this.router.get(`${this.path}/migrar`, this.migrar);
    this.router.get(
      `${this.path}/habilitados`,
      this.getAllProfesoresHabilitadas
    );
    this.router.get(`${this.path}/:id`, this.getProfesorById);
    // this.router.get(`${this.path}/paginado`, this.getAllProfesorsPag);

    // Using the  route.all in such a way applies the middleware only to the route
    // handlers in the chain that match the  `${this.path}/*` route, including  POST /profesores.
    this.router
      .all(`${this.path}/*`)
      .patch(
        `${this.path}/:id`,
        validationMiddleware(CreateProfesorDto, true),
        this.modifyProfesor
      )
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
  private getAllProfesors = async (request: Request, response: Response) => {
    const profesores = await this.profesor.find().sort('_id'); //.populate('author', '-password') populate con imagen

    response.send(profesores);
  };
  private getAllProfesoresHabilitadas = async (
    request: Request,
    response: Response
  ) => {
    const profesores = await this.profesor.find({ activo: true }).sort('_id'); //.populate('author', '-password') populate con imagen

    response.send(profesores);
  };
  private obtenerProfesorPorId = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const id = request.params.id;
    console.log('id', id);
    try {
      const profesor = await this.profesor.findById(id);
      console.log(profesor);
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
 

  private migrar = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const profesores: any = await this.profesorOriginal.find();
      console.log('profesores', profesores);
      // {},
      // 'dni ApellidoyNombre fecha_nacimiento sexo nacionalidad telefonos mail fecha_ingreso procedencia_colegio_primario procedencia_colegio_secundario fecha_de_baja motivo_de_baja domicilio nombre_y_apellido_padre telefono_padre mail_padre nombre_y_apellido_madre telefono_madre mail_madre nombre_y_apellido_tutor1 telefono_tutor1 mail_tutor1 nombre_y_apellido_tutor2 telefono_tutor2 mail_tutor2 nombre_y_apellido_tutor3 telefono_tutor3 mail_tutor3 cantidad_integrantes_grupo_familiar SeguimientoETAP NombreyApellidoTae MailTae ArchivoDiagnostico'

      // .select('dni ApellidoyNombre fecha_nacimiento sexo nacionalidad telefonos mail fecha_ingreso procedencia_colegio_primario procedencia_colegio_secundario fecha_de_baja motivo_de_baja domicilio nombre_y_apellido_padre telefono_padre mail_padre nombre_y_apellido_madre telefono_madre mail_madre nombre_y_apellido_tutor1 telefono_tutor1 mail_tutor1 nombre_y_apellido_tutor2 telefono_tutor2 mail_tutor2 nombre_y_apellido_tutor3 telefono_tutor3 mail_tutor3 cantidad_integrantes_grupo_familiar SeguimientoETAP NombreyApellidoTae MailTae ArchivoDiagnostico'); //.populate('author', '-password') populate con imagen
      // console.log(
      //   'profesores',
      //   profesores[100].dni,
      //   profesores[100].telefonos,
      //   profesores[100].procedencia_colegio_primario
      // );

      // console.log(
      //   'profesores2',profesores,

      // );
      const profesoresRefactorizados: IProfesor[] = profesores.map(
        (x: any, index: number) => {
          const unaProfesor: IProfesor & any = {
            // _id: x._id,
            profesorNro: 100 + index,
            nombreCompleto: x.nombre_y_apellido,
            telefono: x.telefono,
            celular: null,
            email: x.mail,
            formacion: x.formacion,
            titulo: x.tipo_de_titulacion,

            fechaCreacion: new Date(),
            activo: true,
          };

          return unaProfesor;
        }
      );

      try {
        const savedProfesors = await this.profesor.insertMany(
          profesoresRefactorizados
        );
        response.send({
          savedProfesors,
        });
      } catch (e) {
        console.log('ERROR', e);
        next(
          new HttpException(500, 'Ocurrió un error al guardar las profesores')
        );
      }
    } catch (e2) {
      console.log('ERROR', e2);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private getProfesorById = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
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

  private modifyProfesor = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
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

  private createProfesor = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
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
  private createProfesorComplete = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    // Agregar foto
    console.log('datos archio', request.file.filename);
    console.log('datos body', request.body);
    // Agregar datos
    const profesorData: CreateProfesorDto = request.body;
    const createdProfesor = new this.profesor({
      ...profesorData,
      // author: request.user ? request.user._id : null,
    });
    const savedProfesor = await createdProfesor.save();
    //     const imagen: ImagenDto = {
    //       descripcion:''
    // posicion:.posicion,
    // src:''
    //     }
    // await savedProfesor.populate('author', '-password').execPopulate();
    response.send(savedProfesor);
  };
  private deleteProfesor = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    console.log('deleteProfesor');
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
  private deshabilitarProfesor = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    console.log('deshabilitar asigntaru');
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
  private habilitarProfesor = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    console.log('deshabilitar asigntaru');
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
