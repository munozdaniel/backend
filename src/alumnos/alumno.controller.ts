import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import NotFoundException from '../exceptions/NotFoundException';
import Controller from '../interfaces/controller.interface';
import validationMiddleware from '../middleware/validation.middleware';
import CreateAlumnoDto from './alumno.dto';
import Alumno from './alumno.interface';
import alumnoModel from './alumno.model';
import { IQueryAlumnoPag } from '../utils/interfaces/iQueryAlumnoPag';
import escapeStringRegexp from 'escape-string-regexp';
import IAlumno from './alumno.interface';
import alumnoOriginalModel from './alumnoOriginal.model';
class AlumnoController implements Controller {
  public path = '/alumnos';
  public router = Router();
  private alumno = alumnoModel;
  private alumnoOriginal = alumnoOriginalModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    console.log('AlumnoController/initializeRoutes');
    this.router.get(`${this.path}/migrar`, this.migrar);
    this.router.get(`${this.path}/habilitados`, this.getAllAlumnos);
    this.router.get(`${this.path}/paginado`, this.getAllAlumnosPag);

    // Using the  route.all in such a way applies the middleware only to the route
    // handlers in the chain that match the  `${this.path}/*` route, including  POST /alumnos.
    this.router
      .all(`${this.path}/*`)
      .patch(
        `${this.path}/:id`,
        validationMiddleware(CreateAlumnoDto, true),
        this.modifyAlumno
      )
      .delete(`${this.path}/:id`, this.deleteAlumno)
      .put(
        this.path,
        validationMiddleware(CreateAlumnoDto),
        // checkPermisos(rolesEnum.ADMIN), // elimintar. test
        this.createAlumno
      );
  }

  private getAllAlumnos = async (request: Request, response: Response) => {
    const alumnos = await this.alumno.find({activo:true}).sort('_id'); //.populate('author', '-password') populate con imagen

    response.send(alumnos);
  };

  private migrar = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const alumnos: any = await this.alumnoOriginal.find();
      // {},
      // 'dni ApellidoyNombre fecha_nacimiento sexo nacionalidad telefonos mail fecha_ingreso procedencia_colegio_primario procedencia_colegio_secundario fecha_de_baja motivo_de_baja domicilio nombre_y_apellido_padre telefono_padre mail_padre nombre_y_apellido_madre telefono_madre mail_madre nombre_y_apellido_tutor1 telefono_tutor1 mail_tutor1 nombre_y_apellido_tutor2 telefono_tutor2 mail_tutor2 nombre_y_apellido_tutor3 telefono_tutor3 mail_tutor3 cantidad_integrantes_grupo_familiar SeguimientoETAP NombreyApellidoTae MailTae ArchivoDiagnostico'

      // .select('dni ApellidoyNombre fecha_nacimiento sexo nacionalidad telefonos mail fecha_ingreso procedencia_colegio_primario procedencia_colegio_secundario fecha_de_baja motivo_de_baja domicilio nombre_y_apellido_padre telefono_padre mail_padre nombre_y_apellido_madre telefono_madre mail_madre nombre_y_apellido_tutor1 telefono_tutor1 mail_tutor1 nombre_y_apellido_tutor2 telefono_tutor2 mail_tutor2 nombre_y_apellido_tutor3 telefono_tutor3 mail_tutor3 cantidad_integrantes_grupo_familiar SeguimientoETAP NombreyApellidoTae MailTae ArchivoDiagnostico'); //.populate('author', '-password') populate con imagen
      // console.log(
      //   'alumnos',
      //   alumnos[100].dni,
      //   alumnos[100].telefonos,
      //   alumnos[100].procedencia_colegio_primario
      // );
      console.log('Datos', alumnos);

      // console.log(
      //   'alumnos2',alumnos,

      // );
      const alumnosRefactorizados: IAlumno[] = alumnos.map(
        (x: any, index: number) => {
          const padre = {
            tipoAdulto: 'PADRE',
            activo: true,
            fechaCreacion: new Date(),
            nombreCompleto: x.nombre_y_apellido_padre,
            telefono: x.telefono_padre,
            email: x.mail_padre,
          };
          const madre = {
            tipoAdulto: 'MADRE',
            activo: true,
            fechaCreacion: new Date(),
            nombreCompleto: x.nombre_y_apellido_madre,
            telefono: x.telefono_madre,
            email: x.mail_madre,
          };
          const tutor1 = {
            tipoAdulto: 'TUTOR',
            activo: true,
            fechaCreacion: new Date(),
            nombreCompleto: x.nombre_y_apellido_tutor1,
            telefono: x.telefono_tutor1,
            email: x.mail_tutor1,
          };
          const tutor2 = {
            tipoAdulto: 'TUTOR',
            activo: true,
            fechaCreacion: new Date(),
            nombreCompleto: x.nombre_y_apellido_tutor2,
            telefono: x.telefono_tutor2,
            email: x.mail_tutor2,
          };
          const adultos: any = [padre, madre, tutor1, tutor2];
          let telefono = null;
          let celular = null;
          let obsTelefono = null;
          if (x.telefonos && x.telefonos.toString().length > 0) {
            console.log(x._id, 'x.telefonos', x.telefonos);
            const tel = x.telefonos.replace(' ', '').split('-');
            if (tel && tel.length == 2) {
              // 29951760044-2995176036
              if (tel[0].length > 2) {
                //!299
                telefono = tel[0].toUpperCase();
                celular = tel[1].toUpperCase();
              } else {
                // ===299
                telefono = tel[0] + tel[1];
              }
            } else {
              console.log(x._id, '===>', x.telefonos);
              const tel = x.telefonos.replace(' ', '').split('/');
              if (tel[0] && tel[1]) {
                telefono = tel[0].trim().toUpperCase();
                celular = tel[1].trim().toUpperCase();
              } else {
                telefono = x.telefonos.toUpperCase();
              }
            }
          }
          let dniMod = null;
          let tipoDniMod = null;
          if (x.dni) {
            const d = x.dni.split('-');
            if (d && d.length > 1) {
              dniMod = d[0];
              tipoDniMod = d[1];
            } else {
              dniMod = x.dni;
            }
          }
          const retorno: any = {
            identificador: index + 100,
            adultos,
            dni: dniMod,
            tipoDni: tipoDniMod,
            nombreCompleto: x.ApellidoyNombre,
            fechaNacimiento: x.fecha_nacimiento,
            observaciones: '',
            observacionTelefono: '',
            sexo:
              x.sexo.trim().length === 0
                ? 'SIN ESPECIFICAR'
                : x.sexo.toUpperCase() === 'MASCULINO' ||
                  x.sexo.toUpperCase() === 'M'
                ? 'MASCULINO'
                : 'FEMENINO',
            nacionalidad: x.nacionalidad ? x.nacionalidad.toUpperCase() : null,
            telefono,
            celular,
            email: x.mail,
            fechaIngreso: x.fecha_ingreso,
            procedenciaColegioPrimario: x.procedencia_colegio_primario
              ? x.procedencia_colegio_primario.toUpperCase()
              : null,
            procedenciaColegioSecundario: x.procedencia_colegio_secundario
              ? x.procedencia_colegio_secundario.toUpperCase()
              : null,
            fechaDeBaja: x.fecha_de_baja,
            motivoDeBaja: x.motivo_de_baja
              ? x.motivo_de_baja.toUpperCase()
              : null,
            domicilio: x.domicilio,

            cantidadIntegranteGrupoFamiliar:
              x.cantidad_integrantes_grupo_familiar,
            seguimientoEtap: x.SeguimientoETAP,

            nombreCompletoTae: x.NombreyApellidoTae,
            emailTae: x.MailTae,
            archivoDiagnostico: x.ArchivoDiagnostico,

            fechaCreacion: new Date(),
            activo: true,
          };

          return retorno;
        }
      );

      try {
        const savedAlumnos = await this.alumno.insertMany(
          alumnosRefactorizados
        );
        response.send({
          savedAlumnos,
        });
      } catch (e) {
        console.log('ERROR', e);
        next(new HttpException(400, 'Parametros Incorrectos'));
      }
    } catch (e2) {
      console.log('ERROR', e2);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
  private getAllAlumnosPag = async (request: Request, response: Response) => {
    // console.log('====================================================');
    // console.log('request body', request.body);
    console.log('request ', request.query);
    // console.log('escapeStringRegexp ', escapeStringRegexp(request.query));
    const parametros: IQueryAlumnoPag = request.query;

    const criterios = request.query.query
      ? JSON.parse(request.query.query)
      : {};

    console.log('query criterios', criterios);

    this.alumno.paginate(
      {},
      {
        page: Number(parametros.page),
        limit: Number(parametros.limit),
        sort: JSON.parse(parametros.sort || null),
      },
      (err: any, result: any) => {
        if (err) {
          console.log('[ERROR]', err);
        }
        console.log('result', result);
        // result.docs
        // result.total
        // result.limit - 10
        // result.page - 3
        // result.pages
        response.send(result);
      }
    );
    // const  count = request.query.count || 5;
    // const  page = request.query.page || 1;
    //   const alumnos = await this.alumno.find().populate('imagenes'); //.populate('author', '-password') populate con imagen
  };

  private getAlumnoById = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const id = request.params.id;
    try {
      const alumno = await this.alumno.findById(id).populate('imagenes');
      if (alumno) {
        response.send(alumno);
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private modifyAlumno = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const id = request.params.id;
    const alumnoData: Alumno = request.body;
    try {
      const alumno = await this.alumno.findByIdAndUpdate(id, alumnoData, {
        new: true,
      });

      if (alumno) {
        response.send(alumno);
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private createAlumno = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    // Agregar datos
    const alumnoData: CreateAlumnoDto = request.body;
    const createdAlumno = new this.alumno({
      ...alumnoData,
      // author: request.user ? request.user._id : null,
    });
    const savedAlumno = await createdAlumno.save();
    // await savedAlumno.populate('author', '-password').execPopulate();
    response.send(savedAlumno);
  };
  private createAlumnoComplete = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    // Agregar foto
    console.log('datos archio', request.file.filename);
    console.log('datos body', request.body);
    // Agregar datos
    const alumnoData: CreateAlumnoDto = request.body;
    const createdAlumno = new this.alumno({
      ...alumnoData,
      // author: request.user ? request.user._id : null,
    });
    const savedAlumno = await createdAlumno.save();
    //     const imagen: ImagenDto = {
    //       descripcion:''
    // posicion:.posicion,
    // src:''
    //     }
    // await savedAlumno.populate('author', '-password').execPopulate();
    response.send(savedAlumno);
  };
  private deleteAlumno = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    console.log('deleteAlumno');
    const id = request.params.id;
    try {
      const successResponse = await this.alumno.findByIdAndDelete(id);
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

export default AlumnoController;
