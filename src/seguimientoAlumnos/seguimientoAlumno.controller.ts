import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import NotFoundException from '../exceptions/NotFoundException';
import Controller from '../interfaces/controller.interface';
import validationMiddleware from '../middleware/validation.middleware';
import CreateSeguimientoAlumnoDto from './seguimientoAlumno.dto';
import SeguimientoAlumno from './seguimientoAlumno.interface';
import seguimientoAlumnoModel from './seguimientoAlumno.model';
import escapeStringRegexp from 'escape-string-regexp';
import ISeguimientoAlumno from './seguimientoAlumno.interface';
import seguimientoAlumnoOriginalModel from './seguimientoAlumnoOriginal.model';
class SeguimientoAlumnoController implements Controller {
  public path = '/seguimientoAlumnoes';
  public router = Router();
  private seguimientoAlumno = seguimientoAlumnoModel;
  private seguimientoAlumnoOriginal = seguimientoAlumnoOriginalModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    console.log('SeguimientoAlumnoController/initializeRoutes');
    this.router.get(`${this.path}/migrar`, this.migrar);
    this.router.get(
      `${this.path}/habilitados`,
      this.getAllSeguimientoAlumnoesHabilitadas
    );
    this.router.get(`${this.path}/:id`, this.getSeguimientoAlumnoById);
    // this.router.get(`${this.path}/paginado`, this.getAllSeguimientoAlumnosPag);

    // Using the  route.all in such a way applies the middleware only to the route
    // handlers in the chain that match the  `${this.path}/*` route, including  POST /seguimientoAlumnoes.
    this.router
      .all(`${this.path}/*`)
      .patch(
        `${this.path}/:id`,
        validationMiddleware(CreateSeguimientoAlumnoDto, true),
        this.modifySeguimientoAlumno
      )
      .get(`${this.path}/:id`, this.obtenerSeguimientoAlumnoPorId)
      .delete(`${this.path}/:id`, this.deleteSeguimientoAlumno)
      .put(`${this.path}/deshabilitar/:id`, this.deshabilitarSeguimientoAlumno)
      .put(`${this.path}/habilitar/:id`, this.habilitarSeguimientoAlumno)
      .put(
        this.path,
        validationMiddleware(CreateSeguimientoAlumnoDto),
        // checkPermisos(rolesEnum.ADMIN), // elimintar. test
        this.createSeguimientoAlumno
      );
  }
  private getAllSeguimientoAlumnos = async (request: Request, response: Response) => {
    const seguimientoAlumnoes = await this.seguimientoAlumno.find().sort('_id'); //.populate('author', '-password') populate con imagen

    response.send(seguimientoAlumnoes);
  };
  private getAllSeguimientoAlumnoesHabilitadas = async (
    request: Request,
    response: Response
  ) => {
    const seguimientoAlumnoes = await this.seguimientoAlumno.find({ activo: true }).sort('_id'); //.populate('author', '-password') populate con imagen

    response.send(seguimientoAlumnoes);
  };
  private obtenerSeguimientoAlumnoPorId = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const id = request.params.id;
    console.log('id', id);
    try {
      const seguimientoAlumno = await this.seguimientoAlumno.findById(id);
      console.log(seguimientoAlumno);
      if (seguimientoAlumno) {
        response.send(seguimientoAlumno);
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
      const seguimientoAlumnoes: any = await this.seguimientoAlumnoOriginal.find();
      console.log('seguimientoAlumnoes', seguimientoAlumnoes);
      // {},
      // 'dni ApellidoyNombre fecha_nacimiento sexo nacionalidad telefonos mail fecha_ingreso procedencia_colegio_primario procedencia_colegio_secundario fecha_de_baja motivo_de_baja domicilio nombre_y_apellido_padre telefono_padre mail_padre nombre_y_apellido_madre telefono_madre mail_madre nombre_y_apellido_tutor1 telefono_tutor1 mail_tutor1 nombre_y_apellido_tutor2 telefono_tutor2 mail_tutor2 nombre_y_apellido_tutor3 telefono_tutor3 mail_tutor3 cantidad_integrantes_grupo_familiar SeguimientoETAP NombreyApellidoTae MailTae ArchivoDiagnostico'

      // .select('dni ApellidoyNombre fecha_nacimiento sexo nacionalidad telefonos mail fecha_ingreso procedencia_colegio_primario procedencia_colegio_secundario fecha_de_baja motivo_de_baja domicilio nombre_y_apellido_padre telefono_padre mail_padre nombre_y_apellido_madre telefono_madre mail_madre nombre_y_apellido_tutor1 telefono_tutor1 mail_tutor1 nombre_y_apellido_tutor2 telefono_tutor2 mail_tutor2 nombre_y_apellido_tutor3 telefono_tutor3 mail_tutor3 cantidad_integrantes_grupo_familiar SeguimientoETAP NombreyApellidoTae MailTae ArchivoDiagnostico'); //.populate('author', '-password') populate con imagen
      // console.log(
      //   'seguimientoAlumnoes',
      //   seguimientoAlumnoes[100].dni,
      //   seguimientoAlumnoes[100].telefonos,
      //   seguimientoAlumnoes[100].procedencia_colegio_primario
      // );

      // console.log(
      //   'seguimientoAlumnoes2',seguimientoAlumnoes,

      // );
      const seguimientoAlumnoesRefactorizados: ISeguimientoAlumno[] = seguimientoAlumnoes.map(
        (x: any, index: number) => {
          const unaSeguimientoAlumno: ISeguimientoAlumno & any = {
            // _id: x._id,
            seguimientoAlumnoNro: 100 + index,
            nombreCompleto: x.nombre_y_apellido,
            telefono: x.telefono,
            celular: null,
            email: x.mail,
            formacion: x.formacion,
            titulo: x.tipo_de_titulacion,

            fechaCreacion: new Date(),
            activo: true,
          };

          return unaSeguimientoAlumno;
        }
      );

      try {
        const savedSeguimientoAlumnos = await this.seguimientoAlumno.insertMany(
          seguimientoAlumnoesRefactorizados
        );
        response.send({
          savedSeguimientoAlumnos,
        });
      } catch (e) {
        console.log('ERROR', e);
        next(
          new HttpException(500, 'Ocurrió un error al guardar las seguimientoAlumnoes')
        );
      }
    } catch (e2) {
      console.log('ERROR', e2);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private getSeguimientoAlumnoById = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const id = request.params.id;
    try {
      const seguimientoAlumno = await this.seguimientoAlumno.findById(id).populate('imagenes');
      if (seguimientoAlumno) {
        response.send(seguimientoAlumno);
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private modifySeguimientoAlumno = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const id = request.params.id;
    const seguimientoAlumnoData: SeguimientoAlumno = request.body;
    try {
      const seguimientoAlumno = await this.seguimientoAlumno.findByIdAndUpdate(id, seguimientoAlumnoData, {
        new: true,
      });

      if (seguimientoAlumno) {
        response.send(seguimientoAlumno);
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private createSeguimientoAlumno = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    // Agregar datos
    const seguimientoAlumnoData: CreateSeguimientoAlumnoDto = request.body;
    const createdSeguimientoAlumno = new this.seguimientoAlumno({
      ...seguimientoAlumnoData,
      // author: request.user ? request.user._id : null,
    });
    const savedSeguimientoAlumno = await createdSeguimientoAlumno.save();
    // await savedSeguimientoAlumno.populate('author', '-password').execPopulate();
    response.send(savedSeguimientoAlumno);
  };
  private createSeguimientoAlumnoComplete = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    // Agregar foto
    console.log('datos archio', request.file.filename);
    console.log('datos body', request.body);
    // Agregar datos
    const seguimientoAlumnoData: CreateSeguimientoAlumnoDto = request.body;
    const createdSeguimientoAlumno = new this.seguimientoAlumno({
      ...seguimientoAlumnoData,
      // author: request.user ? request.user._id : null,
    });
    const savedSeguimientoAlumno = await createdSeguimientoAlumno.save();
    //     const imagen: ImagenDto = {
    //       descripcion:''
    // posicion:.posicion,
    // src:''
    //     }
    // await savedSeguimientoAlumno.populate('author', '-password').execPopulate();
    response.send(savedSeguimientoAlumno);
  };
  private deleteSeguimientoAlumno = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    console.log('deleteSeguimientoAlumno');
    const id = request.params.id;
    try {
      const successResponse = await this.seguimientoAlumno.findByIdAndDelete(id);
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
  private deshabilitarSeguimientoAlumno = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    console.log('deshabilitar asigntaru');
    const id = request.params.id;
    try {
      const successResponse = await this.seguimientoAlumno.findByIdAndUpdate(id, {
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
  private habilitarSeguimientoAlumno = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    console.log('deshabilitar asigntaru');
    const id = request.params.id;
    try {
      const successResponse = await this.seguimientoAlumno.findByIdAndUpdate(id, {
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

export default SeguimientoAlumnoController;
