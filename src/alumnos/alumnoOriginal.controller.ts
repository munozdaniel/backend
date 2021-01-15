import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import NotFoundException from '../exceptions/NotFoundException';
import Controller from '../interfaces/controller.interface';
import validationMiddleware from '../middleware/validation.middleware';
import AlumnoOriginal from './alumnoOriginal.interface';
import alumnoOriginalModel from './alumnoOriginal.model';
import escapeStringRegexp from 'escape-string-regexp';
import IAlumnoOriginal from './alumnoOriginal.interface';
import IAdulto from '../adulto/adulto.interface';
class AlumnoOriginalController implements Controller {
  public path = '/alumnoOriginals';
  public router = Router();
  private alumnoOriginal = alumnoOriginalModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    console.log('AlumnoOriginalController/initializeRoutes');
    this.router.get(`${this.path}/test`, this.test);
  }

  private test = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const alumnoOriginals: any = await this.alumnoOriginal.find();
      // {},
      // 'dni ApellidoyNombre fecha_nacimiento sexo nacionalidad telefonos mail fecha_ingreso procedencia_colegio_primario procedencia_colegio_secundario fecha_de_baja motivo_de_baja domicilio nombre_y_apellido_padre telefono_padre mail_padre nombre_y_apellido_madre telefono_madre mail_madre nombre_y_apellido_tutor1 telefono_tutor1 mail_tutor1 nombre_y_apellido_tutor2 telefono_tutor2 mail_tutor2 nombre_y_apellido_tutor3 telefono_tutor3 mail_tutor3 cantidad_integrantes_grupo_familiar SeguimientoETAP NombreyApellidoTae MailTae ArchivoDiagnostico'

      // .select('dni ApellidoyNombre fecha_nacimiento sexo nacionalidad telefonos mail fecha_ingreso procedencia_colegio_primario procedencia_colegio_secundario fecha_de_baja motivo_de_baja domicilio nombre_y_apellido_padre telefono_padre mail_padre nombre_y_apellido_madre telefono_madre mail_madre nombre_y_apellido_tutor1 telefono_tutor1 mail_tutor1 nombre_y_apellido_tutor2 telefono_tutor2 mail_tutor2 nombre_y_apellido_tutor3 telefono_tutor3 mail_tutor3 cantidad_integrantes_grupo_familiar SeguimientoETAP NombreyApellidoTae MailTae ArchivoDiagnostico'); //.populate('author', '-password') populate con imagen
      // console.log(
      //   'alumnoOriginals',
      //   alumnoOriginals[100].dni,
      //   alumnoOriginals[100].telefonos,
      //   alumnoOriginals[100].procedencia_colegio_primario
      // );
      console.log('DatosalumnoOriginals', alumnoOriginals);

      response.send({
        alumnoOriginals,
      });
    } catch (e2) {
      console.log('ERROR', e2);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
 
}

export default AlumnoOriginalController;
