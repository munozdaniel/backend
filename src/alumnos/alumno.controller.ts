import * as mongoose from 'mongoose';
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
import comisionesOriginalModel from '../comisiones/comisionOriginal.model';
import ciclolectivoModel from '../ciclolectivos/ciclolectivo.model';
import cursoModel from '../cursos/curso.model';
import ICicloLectivo from 'ciclolectivos/ciclolectivo.interface';
import estadoCursadaModel from './estadoCursada/estadoCursada.model';
import ConnectionService from '../services/Connection';
import IEstadoCursada from './estadoCursada/estadoCursada.interface';
import axios, { AxiosRequestConfig } from 'axios';
import moment from 'moment';
const ObjectId = require('mongoose').Types.ObjectId;
class AlumnoController implements Controller {
  public path = '/alumnos';
  public router = Router();
  private alumno = alumnoModel;
  private alumnoOriginal = alumnoOriginalModel;
  private curso = cursoModel;
  private estadoCursada = estadoCursadaModel;
  private comisionOriginal = comisionesOriginalModel;
  private ciclolectivo = ciclolectivoModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/migrar`, this.migrar);
    this.router.get(`${this.path}/todos`, this.obtenerTodos);
    this.router.get(`${this.path}/eliminar-coleccion`, this.eliminarColeccion);
    this.router.get(`${this.path}/habilitados`, this.getAllAlumnos);
    // this.router.get(`${this.path}/paginado`, this.getAllAlumnosPag);
    this.router.post(`${this.path}/ficha`, this.getFichaAlumnos);

    // Using the  route.all in such a way applies the middleware only to the route
    // handlers in the chain that match the  `${this.path}/*` route, including  POST /alumnos.
    this.router
      .all(`${this.path}/*`)
      .patch(`${this.path}/:id`, validationMiddleware(CreateAlumnoDto, true), this.modifyAlumno)
      .get(`${this.path}/:id`, this.getAlumnoById)
      .delete(`${this.path}/:id`, this.deleteAlumno)
      .post(`${this.path}/por-curso`, this.obtenerAlumnosPorCurso)
      .post(`${this.path}/por-curso-ciclo`, this.obtenerAlumnosPorCursoCiclo)
      .post(`${this.path}/por-curso-division-ciclo`, this.obtenerAlumnosPorCursoDivisionCiclo)
      .post(`${this.path}/por-curso-divisiones-ciclo`, this.obtenerAlumnosPorCursoDivisionesCiclo)
      .post(`${this.path}/por-curso-especifico`, this.obtenerAlumnosPorCursoEspecifico)
      .post(`${this.path}/actualizar-nuevo-ciclo`, this.actualizarAlNuevoCiclo)
      .post(`${this.path}/informar-ausencia`, this.informarAusencia)
      .put(
        this.path,
        validationMiddleware(CreateAlumnoDto),
        // checkPermisos(rolesEnum.ADMIN), // elimintar. test
        this.createAlumno
      );
  }
  private informarAusencia = async (request: Request, response: Response, next: NextFunction) => {
    const { observacion, nombreAdulto, fechaInasitencia, faltas, nombreAlumno, emailAdulto } = request.body;
    //     Hola { usuario.NAME },
    // Le informamos que el dia de la fecha {usuario.fecha} el/la alumno/a {usuario.nombreCompleto} no se ha presentado al establecimiento, obteniendo un total de {usuario.faltas} falta/s.
    // Atte. La Administración
    // Enviar Email
    const { SENDINBLUE_API, ENTORNO, MI_EMAIL } = process.env;
    const url = 'https://api.sendinblue.com/v3/smtp/email';
    const options = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': SENDINBLUE_API,
      },
      body: JSON.stringify({
        sender: {
          name: 'Notificación de Ausencia - CET 30',
          email: 'no-reply@propet.com',
        },
        to: [
          {
            email: ENTORNO === 'desarrollo' ? MI_EMAIL : emailAdulto,
            name: nombreAdulto,
          },
        ],
        subject: 'Notificación de Ausencia',
        params: {
          nombreAdulto: nombreAdulto ? nombreAdulto : '',
          fechaInasitencia,
          faltas,
          nombreAlumno,
          observacion,
        },
        templateId: 3,
        // textContent:
        //   "Please confirm your email address by clicking on the link https://text.domain.com",
      }),
    };

    const headers: AxiosRequestConfig = { headers: options.headers };
    try {
      const resultado = await axios.post(url, options.body, headers);
      response.status(200).send({ success: true });
    } catch (error) {
      console.log('[ERROR]', error);
      response.status(200).send({ success: false });
    }
  };
  private actualizarAlNuevoCiclo = async (request: Request, response: Response, next: NextFunction) => {
    const now = new Date();
    const hoy = new Date(moment(now).format('YYYY-MM-DD'));
    const { curso, divisiones, cicloAnterior, ciclo } = request.body;
    // Obtengo todos los cursos por curso y division. <NO
    // Busco todos los alumnos por curso y division y ciclo.
    // Por cada alumno busco el estadocursada con el ciclo enviado si existe pasa a la lista de alumnoNoActualizado <NO
    // Por cada alumno buscamos el estadocursada con findOneAndUpdate (upsert, new) para que lo inserte si no existe
    let match: any = {
      'estadoCursadas.activo': true,
      'estadoCursadas.cicloLectivo._id': ObjectId(cicloAnterior._id),
      'estadoCursadas.curso.curso': Number(curso),
      'estadoCursadas.curso.division': { $in: divisiones },
    };

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
        },
      },
      {
        $group: {
          _id: '$_id',
          root: {
            $mergeObjects: '$$ROOT',
          },
          estadoCursadas: {
            $push: '$estadoCursadas',
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$root', '$$ROOT'],
          },
        },
      },
      {
        $project: {
          root: 0,
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
    // Busco todos los alumnos por ciclo y

    const alumnosNoActualizados: any[] = [];
    const alumnosAggregate = await this.alumno.aggregate(opciones);
    if (alumnosAggregate) {
      const alumnosActualizados = await Promise.all(
        alumnosAggregate.map(async (x: IAlumno, index: number) => {
          const indice = await x.estadoCursadas.findIndex((x: IEstadoCursada) => {
            // return ObjectId(x.cicloLectivo._id) === ObjectId(ciclo._id);
            return x.cicloLectivo.anio === ciclo.anio;
          });

          const estadosCursadasAGuardar: IEstadoCursada & any = {
            curso: x.estadoCursadas[0].curso, // debe contener un solo ciclo
            cicloLectivo: ciclo,
            condicion: 'REGULAR',
            fechaCreacion: hoy,
            activo: true,
          };
          if (indice === -1) {
            //
            // No existe el ciclo entonces estamos seguro de insertarlo
            const created = new this.estadoCursada({
              curso: x.estadoCursadas[0].curso, // debe contener un solo ciclo
              cicloLectivo: ciclo,
              condicion: 'REGULAR',
              fechaCreacion: hoy,
              activo: true,
            });
            const savedEstado = await created.save();
            x.estadoCursadas.push(savedEstado);
            const alumnoActualizado = await this.alumno.findByIdAndUpdate(
              x._id,
              {
                $set: {
                  estadoCursadas: x.estadoCursadas,
                },
              },
              // { $push: { estadoCursadas: savedEstado } },
              // { $addToSet: { estadoCursadas: savedEstado } },
              { upsert: true, new: true }
            );
            return alumnoActualizado;
          } else {
            alumnosNoActualizados.push(x);
          }
        })
      );
      return response.send({ alumnosActualizados: alumnosActualizados.filter((x) => x), alumnosNoActualizados });
    } else {
      next(new NotFoundException());
    }
  };
  /**
   *
   * @param request
   * @param response
   * @param next
   */
  private obtenerAlumnosPorCursoEspecifico = async (request: Request, response: Response, next: NextFunction) => {
    const { curso, comision, division, cicloLectivo } = request.body;
    let match: any = {
      'estadoCursadas.activo': true,
      'estadoCursadas.cicloLectivo._id': ObjectId(cicloLectivo._id),
      'estadoCursadas.curso.comision': comision,
      'estadoCursadas.curso.curso': Number(curso),
      'estadoCursadas.curso.division': Number(division),
    };

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
    const alumnosAggregate = await this.alumno.aggregate(opciones);
    if (alumnosAggregate) {
      response.send(alumnosAggregate);
    } else {
      next(new NotFoundException());
    }
  };
  /**
   *
   * @param request
   * @param response
   * @param next
   */
  private obtenerAlumnosPorCursoDivisionesCiclo = async (request: Request, response: Response, next: NextFunction) => {
    const { curso, divisiones, cicloLectivo } = request.body;
    let match: any = {
      'estadoCursadas.activo': true,
      'estadoCursadas.cicloLectivo._id': ObjectId(cicloLectivo._id),
      'estadoCursadas.curso.curso': Number(curso),
      'estadoCursadas.curso.division': { $in: divisiones },
    };

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
    const alumnosAggregate = await this.alumno.aggregate(opciones);
    if (alumnosAggregate) {
      response.send(alumnosAggregate);
    } else {
      next(new NotFoundException());
    }
  };
  /**
   *
   * @param request
   * @param response
   * @param next
   */
  private obtenerAlumnosPorCursoDivisionCiclo = async (request: Request, response: Response, next: NextFunction) => {
    const { curso, division, ciclo } = request.body;
    let match: any = {
      'estadoCursadas.curso.curso': Number(curso),
      'estadoCursadas.curso.division': Number(division),
      'estadoCursadas.cicloLectivo.anio': Number(ciclo),
    };

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
    const alumnosAggregate = await this.alumno.aggregate(opciones);
    if (alumnosAggregate) {
      response.send(alumnosAggregate);
    } else {
      next(new NotFoundException());
    }
  };
  private obtenerAlumnosPorCursoCiclo = async (request: Request, response: Response, next: NextFunction) => {
    const { curso, comision, division, ciclo } = request.body;
    let match: any = {
      'estadoCursadas.curso.curso': Number(curso),
      'estadoCursadas.curso.comision': comision,
      'estadoCursadas.curso.division': Number(division),
      'estadoCursadas.cicloLectivo.anio': Number(ciclo),
    };
    if (!comision) {
      match = {
        'estadoCursadas.curso.curso': Number(curso),
        'estadoCursadas.curso.division': Number(division),
        'estadoCursadas.cicloLectivo.anio': Number(ciclo),
      };
    }
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
    const alumnosAggregate = await this.alumno.aggregate(opciones);
    if (alumnosAggregate) {
      response.send(alumnosAggregate);
    } else {
      next(new NotFoundException());
    }
  };
  private obtenerAlumnosPorCurso = async (request: Request, response: Response, next: NextFunction) => {
    const { curso, comision, division } = request.body;
    let match: any = {
      'estadoCursadas.curso.curso': curso,
      'estadoCursadas.curso.comision': comision,
      'estadoCursadas.curso.division': division,
    };
    if (!comision) {
      match = {
        'estadoCursadas.curso.curso': curso,
        'estadoCursadas.curso.division': division,
      };
    }
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
    const alumnosAggregate = await this.alumno.aggregate(opciones);
    if (alumnosAggregate) {
      response.send(alumnosAggregate);
    } else {
      next(new NotFoundException());
    }
  };
  private getFichaAlumnos = async (request: Request, response: Response, next: NextFunction) => {
    try {
      let { cicloLectivo, division, curso } = request.body;
      let match: any = {
        'estadoCursadas.activo': true,
        'estadoCursadas.cicloLectivo._id': ObjectId(cicloLectivo._id),
        'estadoCursadas.curso.curso': Number(curso),
        'estadoCursadas.curso.division': Number(division),
      };

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
          },
        },
        {
          $group: {
            _id: '$_id',
            root: {
              $mergeObjects: '$$ROOT',
            },
            estadoCursadas: {
              $push: '$estadoCursadas',
            },
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: ['$root', '$$ROOT'],
            },
          },
        },
        {
          $project: {
            root: 0,
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
      const alumnos = await this.alumno.aggregate(opciones);
      // .find()
      // .find({ 'comisiones.cicloLectivo': 2019 })
      // .find( {
      //   comisiones: { $all: [
      //                  { "$elemMatch" : { cicloLectivo: 2020, division: { $gt: 0} } },
      //                ] }
      // })
      // .find({ comisiones: { $in: [{ 'comisiones.cicloLectivo': 2020 }] } })
      // .find({
      //   "comisiones.cicloLectivo": cicloLectivo, //cicloLectivo,
      //   "comisiones.division": division, //division,
      //   "comisiones.curso": curso, //curso,
      // })
      // .sort({ _id: -1 })
      // .populate({
      //   path: 'comisiones',
      //   model: 'Comisione',
      //   select: 'cicloLectivo division curso',
      // });
      // .populate("estadoComisiones");
      if (alumnos) {
        response.send(alumnos);
      } else {
        next(new NotFoundException());
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
  private getAllAlumnos = async (request: Request, response: Response) => {
    const alumnos = await this.alumno.find({ activo: true }).sort({ _id: -1 }); //.populate('author', '-password') populate con imagen

    response.send(alumnos);
  };
  private obtenerTodos = async (request: Request, response: Response) => {
    const alumnos = await this.alumno.find().sort({ _id: -1 }); //.populate('author', '-password') populate con imagen

    response.send(alumnos);
  };
  private obtenerAlumnoPorId = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const alumno = await this.alumno.findById(id).populate('comisiones');
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

  private eliminarColeccion = async (request: Request, response: Response, next: NextFunction) => {
    await ConnectionService.getConnection()
      .db.listCollections({ name: 'alumnos' })
      .next((err: any, collinfo: any) => {
        if (collinfo) {
          // The collection exists
          alumnoModel.collection.drop();
        }
      });
    await ConnectionService.getConnection()
      .db.listCollections({ name: 'estadocursadas' })
      .next((err: any, collinfo: any) => {
        if (collinfo) {
          // The collection exists
          estadoCursadaModel.collection.drop();
        }
      });
    await ConnectionService.getConnection()
      .db.listCollections({ name: 'cursos' })
      .next((err: any, collinfo: any) => {
        if (collinfo) {
          // The collection exists
          cursoModel.collection.drop();
        }
      });
    response.send('Colecciones eliminadas');
  };
  private migrar = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const arregloNoInsertados = [];
      const now = new Date();
      const hoy = new Date(moment(now).format('YYYY-MM-DD'));
      const alumnos: any = await this.alumnoOriginal.find();
      const ciclosLectivos: ICicloLectivo[] = await this.ciclolectivo.find();
      // {},
      // 'dni ApellidoyNombre fecha_nacimiento sexo nacionalidad telefonos mail fecha_ingreso procedencia_colegio_primario procedencia_colegio_secundario fecha_de_baja motivo_de_baja domicilio nombre_y_apellido_padre telefono_padre mail_padre nombre_y_apellido_madre telefono_madre mail_madre nombre_y_apellido_tutor1 telefono_tutor1 mail_tutor1 nombre_y_apellido_tutor2 telefono_tutor2 mail_tutor2 nombre_y_apellido_tutor3 telefono_tutor3 mail_tutor3 cantidad_integrantes_grupo_familiar SeguimientoETAP NombreyApellidoTae MailTae ArchivoDiagnostico'

      // .select('dni ApellidoyNombre fecha_nacimiento sexo nacionalidad telefonos mail fecha_ingreso procedencia_colegio_primario procedencia_colegio_secundario fecha_de_baja motivo_de_baja domicilio nombre_y_apellido_padre telefono_padre mail_padre nombre_y_apellido_madre telefono_madre mail_madre nombre_y_apellido_tutor1 telefono_tutor1 mail_tutor1 nombre_y_apellido_tutor2 telefono_tutor2 mail_tutor2 nombre_y_apellido_tutor3 telefono_tutor3 mail_tutor3 cantidad_integrantes_grupo_familiar SeguimientoETAP NombreyApellidoTae MailTae ArchivoDiagnostico'); //.populate('author', '-password') populate con imagen

      const alumnosRefactorizados: IAlumno[] = await Promise.all(
        alumnos.map(async (x: any, index: number) => {
          const padre = {
            tipoAdulto: 'PADRE',
            activo: true,
            fechaCreacion: hoy,
            nombreCompleto: x.nombre_y_apellido_padre,
            telefono: x.telefono_padre,
            email: x.mail_padre,
          };
          const madre = {
            tipoAdulto: 'MADRE',
            activo: true,
            fechaCreacion: hoy,
            nombreCompleto: x.nombre_y_apellido_madre,
            telefono: x.telefono_madre,
            email: x.mail_madre,
          };
          const tutor1 = {
            tipoAdulto: 'TUTOR',
            activo: true,
            fechaCreacion: hoy,
            nombreCompleto: x.nombre_y_apellido_tutor1,
            telefono: x.telefono_tutor1,
            email: x.mail_tutor1,
          };
          const tutor2 = {
            tipoAdulto: 'TUTOR',
            activo: true,
            fechaCreacion: hoy,
            nombreCompleto: x.nombre_y_apellido_tutor2,
            telefono: x.telefono_tutor2,
            email: x.mail_tutor2,
          };
          const adultos: any = [padre, madre, tutor1, tutor2];
          let telefono = null;
          let celular = null;
          let obsTelefono = null;
          if (x.telefonos && x.telefonos.toString().length > 0) {
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
              dniMod = d[0].trim();
              tipoDniMod = d[1].trim();
            } else {
              dniMod = x.dni;
            }
          }
          // Recupero las comisiones para guardarla

          let estadoCursadas: any = [];
          try {
            //  Recorro las comisiones originales
            const comisionesOriginales = await this.comisionOriginal.find({
              id_alumnos: Number(x.id_alumno),
            });
            if (comisionesOriginales.length < 1) {
              // TODO: estos no deberian venir en 0. Chequear migracion
              console.log(x.id_alumno, 'este alumno no tiene cursads===========> no existen', comisionesOriginales.length);
            }
            estadoCursadas = await Promise.all(
              comisionesOriginales.map(async (x, index2) => {
                // Por cada comision buscar si existe el curso por comision, curso, division
                try {
                  const nuevoCiclo: ICicloLectivo = ciclosLectivos.find((c: ICicloLectivo) => Number(c.anio) === Number(x.ciclo_lectivo));
                  if (x) {
                    let match: any = {
                      division: x.Division,
                      comision: x.comision,
                      curso: x.Tcurso,
                      // 'cicloLectivo._id': ObjectId(nuevoCiclo._id),
                    };
                    // Si no tiene comisione entonces no es taller
                    if (!x.comision || x.comision.trim().length < 1) {
                      match = {
                        division: x.Division,
                        curso: x.Tcurso,
                        // 'cicloLectivo._id': ObjectId(nuevoCiclo._id),
                      };
                    }

                    try {
                      const nuevo = {
                        division: x.Division,
                        comision: x.comision ? x.comision : null,
                        curso: x.Tcurso,
                        // cicloLectivo: [nuevoCiclo],
                        fechaCreacion: hoy,
                        activo: true,
                      };
                      const savedCurso = await this.curso.findOneAndUpdate(match, nuevo, {
                        upsert: true,
                        new: true,
                        setDefaultsOnInsert: true,
                      });

                      // crear estadocursada

                      const createdEstadoCursada = new this.estadoCursada({
                        estadoCursadaNro: 100 + index2,
                        curso: {
                          ...savedCurso,
                          comision: savedCurso.comision ? savedCurso.comision : 'Sin Registrar',
                        },
                        condicion: x.Condicion ? x.Condicion.toUpperCase() : 'Sin Registrar',
                        cicloLectivo: nuevoCiclo,
                        fechaCreacion: hoy,
                        activo: true,
                      });
                      try {
                        const savedEstadoComision = await createdEstadoCursada.save();
                        return savedEstadoComision;
                      } catch (e4) {
                        console.log('e4, ', e4);
                      }
                    } catch (e4) {
                      console.log('find, ', e4);
                    }
                  } else {
                    console.log('CXX, ', x);
                  }
                } catch (errorUp) {
                  console.log('errorUp', errorUp);
                }
              })
            );
          } catch (ero) {
            if (!ero.errmsg) {
            }
          }

          const retorno: any = {
            estadoCursadas: estadoCursadas,
            alumnoId: x.id_alumno,
            legajo: x.id_alumno,
            // alumnoNro: index + 100,
            adultos,
            dni: dniMod ? dniMod : 'Sin Registrar',
            tipoDni: tipoDniMod,
            nombreCompleto: x.ApellidoyNombre,
            fechaNacimiento: x.fecha_nacimiento,
            observaciones: '',
            observacionTelefono: '',
            sexo:
              x.sexo.trim().length === 0
                ? 'Sin Registrar'
                : x.sexo.toUpperCase() === 'MASCULINO' || x.sexo.toUpperCase() === 'M'
                ? 'MASCULINO'
                : 'FEMENINO',
            nacionalidad: x.nacionalidad ? x.nacionalidad.toUpperCase() : 'ARGENTINA',
            telefono,
            celular,
            email: x.mail ? x.mail : 'Sin Registrar',
            fechaIngreso: x.fecha_ingreso ? x.fecha_ingreso : 'Sin Registrar',
            procedenciaColegioPrimario: x.procedencia_colegio_primario ? x.procedencia_colegio_primario : 'Sin Registrar',
            procedenciaColegioSecundario: x.procedencia_colegio_secundario ? x.procedencia_colegio_secundario : 'Sin Registrar',
            fechaDeBaja: x.fecha_de_baja,
            motivoDeBaja: x.motivo_de_baja ? x.motivo_de_baja : null,
            domicilio: x.domicilio ? x.domicilio : 'Sin Registrar',

            cantidadIntegranteGrupoFamiliar: x.cantidad_integrantes_grupo_familiar,
            seguimientoEtap: x.SeguimientoETAP,

            nombreCompletoTae: x.NombreyApellidoTae,
            emailTae: x.MailTae,
            archivoDiagnostico: x.ArchivoDiagnostico,

            fechaCreacion: hoy,
            activo: true,
          };

          return retorno;
        })
      );

      try {
        const savedAlumnos = await this.alumno.insertMany(alumnosRefactorizados);
        response.send({
          savedAlumnos,
          cantidad: savedAlumnos.length,
        });
      } catch (e) {
        // [ 'errors', '_message', 'message', 'name' ]
        console.log('[ERROR 1]', e.errors);
        next(new HttpException(500, 'Problemas al insertar los registros'));
      }
    } catch (e2) {
      console.log('[ERROR 2]', e2);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
  // private getAllAlumnosPag = async (request: Request, response: Response) => {
  //   const parametros: IQueryAlumnoPag = request.query;

  //   const criterios = request.query.query
  //     ? JSON.parse(request.query.query)
  //     : {};

  //   await this.alumno.paginate(
  //     {},
  //     {
  //       page: Number(parametros.page),
  //       limit: Number(parametros.limit),
  //       sort: JSON.parse(parametros.sort || null),
  //     },
  //     (err: any, result: any) => {
  //       if (err) {
  //         console.log("[ERROR]", err);
  //       }
  //       // result.docs
  //       // result.totalDocs = 100
  //       // result.limit = 10
  //       // result.page = 1
  //       // result.totalPages = 10
  //       // result.hasNextPage = true
  //       // result.nextPage = 2
  //       // result.hasPrevPage = false
  //       // result.prevPage = null
  //       // result.pagingCounter = 1
  //       response.send(result);
  //     }
  //   );
  //   // const  count = request.query.count || 5;
  //   // const  page = request.query.page || 1;
  //   //   const alumnos = await this.alumno.find().populate('imagenes'); //.populate('author', '-password') populate con imagen
  // };

  private getAlumnoById = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    console.log('getAlumnoById', id);

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
          preserveNullAndEmptyArrays: true,
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
        $group: {
          _id: '$_id',
          root: {
            $mergeObjects: '$$ROOT',
          },
          estadoCursadas: {
            $push: '$estadoCursadas',
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$root', '$$ROOT'],
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$root', '$$ROOT'],
          },
        },
      },
      {
        $match: {
          _id: ObjectId(id),
        },
      },
    ];
    try {
      const alumno = await this.alumno.aggregate(opciones);
      if (alumno && alumno.length > 0) {
        response.send(alumno[0]);
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private modifyAlumno = async (request: Request, response: Response, next: NextFunction) => {
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

  private createAlumno = async (request: Request, response: Response, next: NextFunction) => {
    // Agregar datos
    const alumnoData: CreateAlumnoDto = request.body;
    const createdAlumno = new this.alumno({
      ...alumnoData,
      // author: request.user ? request.user._id : null,
    });
    try {
      const savedAlumno = await createdAlumno.save();
      response.send(savedAlumno);
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Error Interno'));
    }
  };

  private deleteAlumno = async (request: Request, response: Response, next: NextFunction) => {
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
