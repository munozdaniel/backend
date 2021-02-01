import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import NotFoundException from '../exceptions/NotFoundException';
import Controller from '../interfaces/controller.interface';
import validationMiddleware from '../middleware/validation.middleware';
import CreateComisionDto from './comision.dto';
import Comision from './comision.interface';
import comisionModel from './comision.model';
import escapeStringRegexp from 'escape-string-regexp';
import IComision from './comision.interface';
import comisionOriginalModel from './comisionOriginal.model';
import alumnoModel from '../alumnos/alumno.model';
import comisionesUnicaModel from './comisionUnica.model';
class ComisionController implements Controller {
  public path = '/comisiones';
  public router = Router();
  private comision = comisionModel;
  private comisionOriginal = comisionOriginalModel;
  private comisionSql = comisionesUnicaModel;
  private alumno = alumnoModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    console.log('ComisionController/initializeRoutes');
    this.router.get(`${this.path}/migrar-unicas`, this.migrarComisionesUnicas);
    this.router.get(`${this.path}/migrar`, this.migrarComisiones);
    this.router.get(`${this.path}/migraralumnos`, this.migrarAlumnos);
    this.router.post(
      `${this.path}/ficha-alumnos`,
      this.buscarComisionesPorCicloLectivo
    );
    this.router.get(`${this.path}/originales`, this.verComisionesOriginales);
    this.router.get(`${this.path}`, this.getAllComisions);
    this.router.get(
      `${this.path}/habilitados`,
      this.getAllComisionesHabilitadas
    );
    this.router.get(`${this.path}/:id`, this.getComisionByAlumnoId);
    // this.router.get(`${this.path}/paginado`, this.getAllComisionsPag);

    // Using the  route.all in such a way applies the middleware only to the route
    // handlers in the chain that match the  `${this.path}/*` route, including  POST /comisiones.
    this.router
      .all(`${this.path}/*`)
      .patch(
        `${this.path}/:id`,
        validationMiddleware(CreateComisionDto, true),
        this.modifyComision
      )
      .get(`${this.path}/:id`, this.obtenerComisionPorId)
      .delete(`${this.path}/:id`, this.deleteComision)
      .put(`${this.path}/deshabilitar/:id`, this.deshabilitarComision)
      .put(`${this.path}/habilitar/:id`, this.habilitarComision)
      .put(
        this.path,
        validationMiddleware(CreateComisionDto),
        // checkPermisos(rolesEnum.ADMIN), // elimintar. test
        this.createComision
      );
  }
  private buscarComisionesPorCicloLectivo = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { cicloLectivo, division, curso } = request.body;
      const comisiones = await this.comision
        .find({ cicloLectivo, division, curso })
        .sort('_id')
        .populate('alumno'); //.populate('author', '-password') populate con imagen

      if (comisiones) {
        response.send(comisiones);
      } else {
        next(new NotFoundException());
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
  private getAllComisions = async (request: Request, response: Response) => {
    const comisiones = await this.comision
      .find()
      .sort('_id')
      .populate('alumno'); //.populate('author', '-password') populate con imagen

    response.send(comisiones);
  };
  private verComisionesOriginales = async (
    request: Request,
    response: Response
  ) => {
    const comisiones = await this.comisionOriginal.find().sort('_id'); //.populate('author', '-password') populate con imagen

    response.send(comisiones);
  };
  private getAllComisionesHabilitadas = async (
    request: Request,
    response: Response
  ) => {
    const comisiones = await this.comision
      .find({ activo: true })
      .sort({ _id: -1 }); //.populate('author', '-password') populate con imagen

    response.send(comisiones);
  };
  private obtenerComisionPorId = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const id = request.params.id;
    console.log('id', id);
    try {
      const comision = await this.comision.findById(id);
      console.log(comision);
      if (comision) {
        response.send(comision);
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
  private getComisionByAlumnoId = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const id = request.params.id;
    console.log('id', id);
    try {
      const comision = await this.comision.findById({ alumnoId: id });
      console.log(comision);
      if (comision) {
        response.send(comision);
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
  private migrarComisionesUnicas = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const comisiones: any = await this.comisionSql.find();
      console.log('comisiones', comisiones);

      const comisionesRefactorizados: IComision[] = await Promise.all(
        comisiones.map(async (x: any, index: number) => {
        
          const unaComision: IComision & any = {
            // _id: x._id,
            // alumnoId: x.id_alumnos,
            comisionNro: 100 + index,
            comision: x.comision ? x.comision.toUpperCase() : 'SIN REGISTRAR',
            cicloLectivo: x.ciclo_lectivo ? Number(x.ciclo_lectivo) : null,
            curso: x.Tcurso ? Number(x.Tcurso) : null,
            division: x.Division ? Number(x.Division) : null,
            // condicion: x.Condicion
            //   ? x.Condicion.toUpperCase()
            //   : 'SIN REGISTRAR',

            fechaCreacion: new Date(),
            activo: true,
          };

          return unaComision;
        })
      );

      try {
        const savedComisions = await this.comision.insertMany(
          comisionesRefactorizados
        );
        response.send({
          savedComisions,
        });
      } catch (e) {
        console.log('ERROR', e);
        next(
          new HttpException(500, 'Ocurrió un error al guardar las comisiones')
        );
      }
    } catch (e2) {
      console.log('ERROR', e2);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
  private migrarComisiones = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const comisiones: any = await this.comisionOriginal.find();
      console.log('comisiones', comisiones);

      const comisionesRefactorizados: IComision[] = await Promise.all(
        comisiones.map(async (x: any, index: number) => {
          if (!x.Tcurso) {
            console.log('x.Division', x);
          }
          let alo = null;
          try {
            alo = await this.alumno.find({ alumnoId: x.id_alumnos });
          } catch (ero) {
            console.log('ero', ero);
          }
          const unaComision: IComision & any = {
            // _id: x._id,
            // alumnoId: x.id_alumnos,
            alumno: alo,
            comisionNro: 100 + index,
            comision: x.comision ? x.comision.toUpperCase() : 'SIN REGISTRAR',
            cicloLectivo: x.ciclo_lectivo ? Number(x.ciclo_lectivo) : null,
            curso: x.Tcurso ? Number(x.Tcurso) : null,
            division: x.Division ? Number(x.Division) : null,
            condicion: x.Condicion
              ? x.Condicion.toUpperCase()
              : 'SIN REGISTRAR',

            fechaCreacion: new Date(),
            activo: true,
          };

          return unaComision;
        })
      );

      try {
        const savedComisions = await this.comision.insertMany(
          comisionesRefactorizados
        );
        response.send({
          savedComisions,
        });
      } catch (e) {
        console.log('ERROR', e);
        next(
          new HttpException(500, 'Ocurrió un error al guardar las comisiones')
        );
      }
    } catch (e2) {
      console.log('ERROR', e2);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private migrarAlumnos = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const comisiones: any = await this.comision.find().populate('alumno');
      console.log('comisiones', comisiones.length);
      // {},
      // 'dni ApellidoyNombre fecha_nacimiento sexo nacionalidad telefonos mail fecha_ingreso procedencia_colegio_primario procedencia_colegio_secundario fecha_de_baja motivo_de_baja domicilio nombre_y_apellido_padre telefono_padre mail_padre nombre_y_apellido_madre telefono_madre mail_madre nombre_y_apellido_tutor1 telefono_tutor1 mail_tutor1 nombre_y_apellido_tutor2 telefono_tutor2 mail_tutor2 nombre_y_apellido_tutor3 telefono_tutor3 mail_tutor3 cantidad_integrantes_grupo_familiar SeguimientoETAP NombreyApellidoTae MailTae ArchivoDiagnostico'

      // .select('dni ApellidoyNombre fecha_nacimiento sexo nacionalidad telefonos mail fecha_ingreso procedencia_colegio_primario procedencia_colegio_secundario fecha_de_baja motivo_de_baja domicilio nombre_y_apellido_padre telefono_padre mail_padre nombre_y_apellido_madre telefono_madre mail_madre nombre_y_apellido_tutor1 telefono_tutor1 mail_tutor1 nombre_y_apellido_tutor2 telefono_tutor2 mail_tutor2 nombre_y_apellido_tutor3 telefono_tutor3 mail_tutor3 cantidad_integrantes_grupo_familiar SeguimientoETAP NombreyApellidoTae MailTae ArchivoDiagnostico'); //.populate('author', '-password') populate con imagen
      // console.log(
      //   'comisiones',
      //   comisiones[100].dni,
      //   comisiones[100].telefonos,
      //   comisiones[100].procedencia_colegio_primario
      // );

      // console.log(
      //   'comisiones2',comisiones,

      // );
      console.log('==================================> 1');
      // const comisionesRefactorizados: IComision[] = comisiones.map(
      //   (x: any, index: number) => {

      //     const unaComision: IComision & any = {
      //       // _id: x._id,
      //       alumnoId: x.id_alumnos,
      //       comisionNro: 100 + index,
      //       comision: x.comision ? x.comision.toUpperCase() : 'SIN REGISTRAR',
      //       cicloLectivo: x.ciclo_lectivo ? Number(x.ciclo_lectivo) : null,
      //       curso: x.Tcurso ? Number(x.Tcurso) : null,
      //       division: x.Division ? Number(x.Division) : null,
      //       condicion: x.Condicion
      //         ? x.Condicion.toUpperCase()
      //         : 'SIN REGISTRAR',

      //       fechaCreacion: new Date(),
      //       activo: true,
      //     };

      //     return unaComision;
      //   }
      // );

      try {
        // const savedComisions = await this.comision.insertMany(
        //   comisionesRefactorizados
        // );
        // console.log(
        //   '==================================> 2',
        //   comisionesRefactorizados.length
        // );
        try {
          const savedComisions = await Promise.all(
            comisiones.map(async (x: IComision & any) => {
              const unaComision:any = {
                _id: x._id,
                comisionNro: x.comisionNro,
                comision: x.comision,
                cicloLectivo: x.cicloLectivo,
                curso: x.curso,
                division: x.division,
                condicion: x.condicion,
                activo:true
               //  alumno: x.alumno,
              };
              // const alu = await this.alumno.findOne({ alumnoId: 1 });
              //  console.log('aluy,', x.alumno);
              // return unaComision;
              return await this.alumno.findOneAndUpdate(
                { _id: x.alumno },
                {
                  $push: {
                    comisiones: unaComision,
                  },
                }
                //,{ upsert: true }
              );
            })
          );
          console.log(
            '==================================> 3',
            savedComisions.length
          );

          response.send({
            savedComisions,
          });
        } catch (error) {
          console.log('Datos', error);
          new HttpException(
            500,
            'Ocurrió un error al guardar las comisiones 1'
          );
        }
      } catch (e) {
        console.log('ERROR', e);
        next(
          new HttpException(500, 'Ocurrió un error al guardar las comisiones')
        );
      }
    } catch (e2) {
      console.log('ERROR', e2);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private getComisionById = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const id = request.params.id;
    try {
      const comision = await this.comision.findById(id).populate('imagenes');
      if (comision) {
        response.send(comision);
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private modifyComision = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const id = request.params.id;
    const comisionData: Comision = request.body;
    try {
      const comision = await this.comision.findByIdAndUpdate(id, comisionData, {
        new: true,
      });

      if (comision) {
        response.send(comision);
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private createComision = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    // Agregar datos
    const comisionData: CreateComisionDto = request.body;
    const createdComision = new this.comision({
      ...comisionData,
      // author: request.user ? request.user._id : null,
    });
    const savedComision = await createdComision.save();
    // await savedComision.populate('author', '-password').execPopulate();
    response.send(savedComision);
  };
  private createComisionComplete = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    // Agregar foto
    console.log('datos archio', request.file.filename);
    console.log('datos body', request.body);
    // Agregar datos
    const comisionData: CreateComisionDto = request.body;
    const createdComision = new this.comision({
      ...comisionData,
      // author: request.user ? request.user._id : null,
    });
    const savedComision = await createdComision.save();
    //     const imagen: ImagenDto = {
    //       descripcion:''
    // posicion:.posicion,
    // src:''
    //     }
    // await savedComision.populate('author', '-password').execPopulate();
    response.send(savedComision);
  };
  private deleteComision = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    console.log('deleteComision');
    const id = request.params.id;
    try {
      const successResponse = await this.comision.findByIdAndDelete(id);
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
  private deshabilitarComision = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    console.log('deshabilitar asigntaru');
    const id = request.params.id;
    try {
      const successResponse = await this.comision.findByIdAndUpdate(id, {
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
  private habilitarComision = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    console.log('deshabilitar asigntaru');
    const id = request.params.id;
    try {
      const successResponse = await this.comision.findByIdAndUpdate(id, {
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

export default ComisionController;
