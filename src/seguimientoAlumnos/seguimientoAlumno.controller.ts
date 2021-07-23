import mongoose from 'mongoose';
import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import NotFoundException from '../exceptions/NotFoundException';
import Controller from '../interfaces/controller.interface';
import CreateSeguimientoAlumnoDto from './seguimientoAlumno.dto';
import seguimientoAlumnoModel from './seguimientoAlumno.model';
import ISeguimientoAlumno from './seguimientoAlumno.interface';
import seguimientoAlumnoOriginalModel from './seguimientoAlumnoOriginal.model';
import planillaTallerModel from '../planillaTaller/planillaTaller.model';
import alumnoModel from '../alumnos/alumno.model';
import ciclolectivoModel from '../ciclolectivos/ciclolectivo.model';
import ICicloLectivo from '../ciclolectivos/ciclolectivo.interface';
import moment from 'moment';
import usuarioModel from '../usuario/usuario.model';
import passport from 'passport';
const ObjectId = mongoose.Types.ObjectId;
class SeguimientoAlumnoController implements Controller {
  public path = '/seguimiento-alumnos';
  public router = Router();
  private seguimientoAlumno = seguimientoAlumnoModel;
  private planillaTaller = planillaTallerModel;
  private alumno = alumnoModel;
  private seguimientoAlumnoOriginal = seguimientoAlumnoOriginalModel;
  private ciclolectivo = ciclolectivoModel;
  private usuario = usuarioModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    console.log('SeguimientoAlumnoController/initializeRoutes');
    this.router.get(`${this.path}/migrar`, this.migrar);
    this.router.post(`${this.path}/resueltos`, passport.authenticate('jwt', { session: false }), this.resueltos);
    // this.router.post(`${this.path}/por-planilla/:id`, this.obtenerSeguimientoAlumnoPorPlanilla);
    this.router.get(
      `${this.path}/por-usuario/:id`,
      passport.authenticate('jwt', { session: false }),
      this.obtenerSeguimientosNuevosPorUsuario
    );
    this.router.get(
      `${this.path}/por-planilla/:id`,
      passport.authenticate('jwt', { session: false }),
      this.obtenerSeguimientoAlumnoPorPlanilla
    );
    this.router.get(
      `${this.path}/por-planilla-alumno/:id/:alumnoId`,
      passport.authenticate('jwt', { session: false }),
      this.obtenerPorPlanillaYAlumno
    );
    this.router.get(`${this.path}/por-alumno/:alumnoId`, passport.authenticate('jwt', { session: false }), this.obtenerPorAlumno);
    this.router.put(`${this.path}`, passport.authenticate('jwt', { session: false }), this.agregarSeguimientoAlumno);
    this.router.post(`${this.path}/marcar-leido`, passport.authenticate('jwt', { session: false }), this.marcarSeguimientoLeido);
    this.router.get(`${this.path}/:id`, passport.authenticate('jwt', { session: false }), this.obtenerSeguimientoPorId);
    this.router.get(`${this.path}/completo/:id`, passport.authenticate('jwt', { session: false }), this.obtenerSeguimientoPorIdCompleto);
    this.router.patch(`${this.path}/:id`, passport.authenticate('jwt', { session: false }), this.actualizarSeguimientoAlumno);
    this.router.delete(`${this.path}/:id`, passport.authenticate('jwt', { session: false }), this.eliminar);
  }
  private obtenerSeguimientoPorIdCompleto = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const opciones: any = [
        // PlanillaTaller

        {
          $lookup: {
            from: 'planillatalleres',
            localField: 'planillaTaller',
            foreignField: '_id',
            as: 'planillaTaller',
          },
        },
        {
          $unwind: {
            path: '$planillaTaller',
            preserveNullAndEmptyArrays: true,
          },
        },
        // Asignatura

        {
          $lookup: {
            from: 'asignaturas',
            localField: 'planillaTaller.asignatura',
            foreignField: '_id',
            as: 'planillaTaller.asignatura',
          },
        },
        {
          $unwind: {
            path: '$planillaTaller.asignatura',
            preserveNullAndEmptyArrays: true,
          },
        },
        // Profesor

        {
          $lookup: {
            from: 'profesores',
            localField: 'planillaTaller.profesor',
            foreignField: '_id',
            as: 'planillaTaller.profesor',
          },
        },
        {
          $unwind: {
            path: '$planillaTaller.profesor',
            preserveNullAndEmptyArrays: true,
          },
        },
        // Curso
        {
          $lookup: {
            from: 'cursos',
            localField: 'planillaTaller.curso',
            foreignField: '_id',
            as: 'planillaTaller.curso',
          },
        },
        {
          $unwind: {
            path: '$planillaTaller.curso',
            preserveNullAndEmptyArrays: true,
          },
        },
        //
        {
          $lookup: {
            from: 'alumnos',
            localField: 'alumno',
            foreignField: '_id',
            as: 'alumno',
          },
        },
        {
          $unwind: {
            path: '$alumno',
            preserveNullAndEmptyArrays: false,
          },
        },
        // Usuario
        {
          $lookup: {
            from: 'usuarios',
            localField: 'modificadoPor',
            foreignField: '_id',
            as: 'modificadoPor',
          },
        },
        {
          $unwind: {
            path: '$modificadoPor',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'usuarios',
            localField: 'creadoPor',
            foreignField: '_id',
            as: 'creadoPor',
          },
        },
        {
          $unwind: {
            path: '$creadoPor',
            preserveNullAndEmptyArrays: true,
          },
        },

        // CicloLectivo
        {
          $lookup: {
            from: 'ciclolectivos',
            localField: 'cicloLectivo',
            foreignField: '_id',
            as: 'cicloLectivo',
          },
        },
        {
          $unwind: {
            path: '$cicloLectivo',
          },
        },
        {
          $match: {
            _id: ObjectId(id),
          },
        },
      ];
      const successResponse: any[] = await this.seguimientoAlumno.aggregate(opciones);
      if (successResponse) {
        const seguimiento = successResponse.length > 0 ? successResponse[0] : null;
        // TODO: ELiminar hash y salt en todos lados que se recupere creadoPor y modificadoPor
        if (seguimiento && seguimiento.creadorPor) {
          seguimiento.creadoPor.hash = null;
          seguimiento.creadoPor.salt = null;
        }
        if (seguimiento && seguimiento.modificadoPor) {
          seguimiento.modificadoPor.hash = null;
          seguimiento.modificadoPor.salt = null;
        }

        if (seguimiento && seguimiento.planillaTaller && !seguimiento.planillaTaller._id) {
          seguimiento.planillaTaller = null;
        }

        response.send({ seguimiento: seguimiento });
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
  private obtenerSeguimientoPorId = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const opciones: any = [
        // PlanillaTaller

        {
          $lookup: {
            from: 'planillatalleres',
            localField: 'planillaTaller',
            foreignField: '_id',
            as: 'planillaTaller',
          },
        },
        {
          $unwind: {
            path: '$planillaTaller',
            preserveNullAndEmptyArrays: true,
          },
        },
        // Curso
        {
          $lookup: {
            from: 'cursos',
            localField: 'planillaTaller.curso',
            foreignField: '_id',
            as: 'planillaTaller.curso',
          },
        },
        {
          $unwind: {
            path: '$planillaTaller.curso',
            preserveNullAndEmptyArrays: true,
          },
        },
        //
        {
          $lookup: {
            from: 'alumnos',
            localField: 'alumno',
            foreignField: '_id',
            as: 'alumno',
          },
        },
        {
          $unwind: {
            path: '$alumno',
            preserveNullAndEmptyArrays: false,
          },
        },
        // Usuario
        {
          $lookup: {
            from: 'usuarios',
            localField: 'modificadoPor',
            foreignField: '_id',
            as: 'modificadoPor',
          },
        },
        {
          $unwind: {
            path: '$modificadoPor',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'usuarios',
            localField: 'creadoPor',
            foreignField: '_id',
            as: 'creadoPor',
          },
        },
        {
          $unwind: {
            path: '$creadoPor',
            preserveNullAndEmptyArrays: true,
          },
        },

        // CicloLectivo
        {
          $lookup: {
            from: 'ciclolectivos',
            localField: 'cicloLectivo',
            foreignField: '_id',
            as: 'cicloLectivo',
          },
        },
        {
          $unwind: {
            path: '$cicloLectivo',
          },
        },
        {
          $match: {
            _id: ObjectId(id),
          },
        },
      ];
      const successResponse: any[] = await this.seguimientoAlumno.aggregate(opciones);
      if (successResponse) {
        const seguimiento = successResponse.length > 0 ? successResponse[0] : null;
        // TODO: ELiminar hash y salt en todos lados que se recupere creadoPor y modificadoPor
        if (seguimiento && seguimiento.creadorPor) {
          seguimiento.creadoPor.hash = null;
          seguimiento.creadoPor.salt = null;
        }
        if (seguimiento && seguimiento.modificadoPor) {
          seguimiento.modificadoPor.hash = null;
          seguimiento.modificadoPor.salt = null;
        }

        if (seguimiento && seguimiento.planillaTaller && !seguimiento.planillaTaller._id) {
          seguimiento.planillaTaller = null;
        }

        response.send({ seguimiento: seguimiento });
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
  private eliminar = async (request: Request, response: Response, next: NextFunction) => {
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
  private agregarSeguimientoAlumno = async (request: Request, response: Response, next: NextFunction) => {
    const seguimientoData: CreateSeguimientoAlumnoDto = request.body;
    const email = request.body.creadoPor.email;
    const ini = new Date(moment.utc(seguimientoData.fecha).format('YYYY-MM-DD')); // Se hace esto para que no pase al siguient dia
    seguimientoData.fecha = ini;
    let match: any = {
      alumno: ObjectId(seguimientoData.alumno._id),
      fecha: {
        $eq: ini.toISOString(),
      },
    };
    if (seguimientoData.planillaTaller) {
      match = {
        alumno: ObjectId(seguimientoData.alumno._id),
        planillaTaller: ObjectId(seguimientoData.planillaTaller._id),
        fecha: {
          $eq: ini.toISOString(),
        },
        // fecha: {
        //   $gte: new Date(seguimientoData.fecha).toISOString(),
        //   $lt: moment(seguimientoData.fecha).add('59', 'seconds').add('59', 'minutes').add('23', 'hours').toDate().toISOString(),
        // },
      };
    }
    // const ini = new Date(moment(seguimientoData.fecha).utc().format('YYYY-MM-DD'));
    // seguimientoData.fecha = ini;
    try {
      const usuario: any = await this.usuario.findOne({ email: email });
      if (usuario) {
        seguimientoData.creadoPor = usuario;
        try {
          const updated = await this.seguimientoAlumno.findOne(match);
          if (updated) {
            response.send({
              tema: updated,
              success: false,
              message: 'Ya existe cargado un seguimiento en la fecha: ' + moment.utc(ini).format('DD/MM/YYYY').toString(),
            });
          } else {
            const created = new this.seguimientoAlumno({
              ...seguimientoData,
            });
            const saved = await created.save();
            response.send({ seguimiento: saved, success: true, message: 'Seguimiento agregado correctamente' });
          }
        } catch (error) {
          console.log('[ERROR]', error);
          next(new HttpException(500, 'Error Interno'));
        }
      } else {
        response.send({ seguimiento: null, success: false, message: 'El usuario no existe' });
      }
    } catch (e4) {
      console.log('[ERROR], ', e4);
      next(new HttpException(500, 'Ocurrió un error interno'));
    }
  };
  private marcarSeguimientoLeido = async (request: Request, response: Response, next: NextFunction) => {
    const seguimiento = request.body.seguimiento;
    try {
      const nuevoSeguimiento = await this.seguimientoAlumno.findByIdAndUpdate(ObjectId(seguimiento._id), { leido: true }, { new: true });
      if (nuevoSeguimiento) {
        return response.status(200).send(nuevoSeguimiento);
      } else {
        return response.status(404).send(null);
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Problemas interno'));
    }
  };
  private actualizarSeguimientoAlumno = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    const seguimiento = request.body;
    const email = request.body.modificadoPor.email;
    try {
      const usuario = await this.usuario.findOne({ email: email });
      if (usuario) {
        seguimiento.modificadoPor = usuario;
        const fechadate = new Date(seguimiento.fecha);
        const fecha = new Date(moment.utc(fechadate).format('YYYY-MM-DD'));
        seguimiento.fechaModificacion = fecha;
        try {
          const updated = await this.seguimientoAlumno.findByIdAndUpdate(id, seguimiento, { new: true });
          if (updated) {
            response.send({ seguimiento: updated });
          } else {
            response.send({ seguimiento: null });
          }
        } catch (e4) {
          console.log('[ERROR], ', e4);
          next(new HttpException(500, 'Ocurrió un error interno'));
        }
      } else {
        response.send({ seguimiento: null, message: 'El usuario no existe' });
      }
    } catch (e4) {
      console.log('[ERROR], ', e4);
      next(new HttpException(500, 'Ocurrió un error interno'));
    }
  };
  private obtenerPorAlumno = async (request: Request, response: Response, next: NextFunction) => {
    const alumnoId = request.params.alumnoId;
    const opciones: any = [
      {
        $lookup: {
          from: 'alumnos',
          localField: 'alumno',
          foreignField: '_id',
          as: 'alumno',
        },
      },
      {
        $unwind: {
          path: '$alumno',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: 'planillatalleres',
          localField: 'planillaTaller',
          foreignField: '_id',
          as: 'planillaTaller',
        },
      },
      {
        $unwind: {
          path: '$planillaTaller',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Curso
      {
        $lookup: {
          from: 'cursos',
          localField: 'planillaTaller.curso',
          foreignField: '_id',
          as: 'planillaTaller.curso',
        },
      },
      {
        $unwind: {
          path: '$planillaTaller.curso',
        },
      },
      // Profesor
      {
        $lookup: {
          from: 'profesores',
          localField: 'planillaTaller.profesor',
          foreignField: '_id',
          as: 'planillaTaller.profesor',
        },
      },
      {
        $unwind: {
          path: '$planillaTaller.profesor',
        },
      },
      // Asignatura
      {
        $lookup: {
          from: 'asignaturas',
          localField: 'planillaTaller.asignatura',
          foreignField: '_id',
          as: 'planillaTaller.asignatura',
        },
      },
      {
        $unwind: {
          path: '$planillaTaller.asignatura',
        },
      },
      {
        $lookup: {
          from: 'ciclolectivos',
          localField: 'cicloLectivo',
          foreignField: '_id',
          as: 'cicloLectivo',
        },
      },
      {
        $unwind: {
          path: '$cicloLectivo',
        },
      },
      // Usuario
      {
        $lookup: {
          from: 'usuarios',
          localField: 'modificadoPor',
          foreignField: '_id',
          as: 'modificadoPor',
        },
      },
      {
        $unwind: {
          path: '$modificadoPor',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'usuarios',
          localField: 'creadoPor',
          foreignField: '_id',
          as: 'creadoPor',
        },
      },
      {
        $unwind: {
          path: '$creadoPor',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          'alumno._id': ObjectId(alumnoId),
        },
      },
    ];
    try {
      const seguimientos = await this.seguimientoAlumno.aggregate(opciones);
      response.send(seguimientos);
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Problemas en el servidor'));
    }
  };
  private obtenerPorPlanillaYAlumno = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    const alumnoId = request.params.alumnoId;
    const opciones: any = [
      {
        $lookup: {
          from: 'alumnos',
          localField: 'alumno',
          foreignField: '_id',
          as: 'alumno',
        },
      },
      {
        $unwind: {
          path: '$alumno',
        },
      },
      {
        $match: {
          planillaTaller: ObjectId(id),
          'alumno._id': ObjectId(alumnoId),
        },
      },
      {
        $lookup: {
          from: 'planillatalleres',
          localField: 'planillaTaller',
          foreignField: '_id',
          as: 'planillaTaller',
        },
      },
      {
        $unwind: {
          path: '$planillaTaller',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Curso
      {
        $lookup: {
          from: 'cursos',
          localField: 'planillaTaller.curso',
          foreignField: '_id',
          as: 'planillaTaller.curso',
        },
      },
      {
        $unwind: {
          path: '$planillaTaller.curso',
        },
      },
      // Usuario
      {
        $lookup: {
          from: 'usuarios',
          localField: 'modificadoPor',
          foreignField: '_id',
          as: 'modificadoPor',
        },
      },
      {
        $unwind: {
          path: '$modificadoPor',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'usuarios',
          localField: 'creadoPor',
          foreignField: '_id',
          as: 'creadoPor',
        },
      },
      {
        $unwind: {
          path: '$creadoPor',
          preserveNullAndEmptyArrays: true,
        },
      },
    ];
    try {
      const seguimientos = await this.seguimientoAlumno.aggregate(opciones);
      response.send(seguimientos);
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Problemas en el servidor'));
    }
  };
  private obtenerSeguimientosNuevosPorUsuario = async (request: Request, response: Response, next: NextFunction) => {
    const email = request.params.id;
    try {
      const usuario = await this.usuario.findOne({ email }).populate('profesor');
      // Si el usuario es administrador o jefe de taller tiene que recibir la notificacion de todas los seguimientos no leidos.
      // Si elusuario es profesor entonces se van a buscar todos los registros no leidos de ese usuario
      if (usuario) {
        if (usuario.profesor) {
          const opciones: any[] = [
            {
              $lookup: {
                from: 'planillatalleres',
                localField: 'planillaTaller',
                foreignField: '_id',
                as: 'planillaTaller',
              },
            },
            {
              $unwind: {
                path: '$planillaTaller',
              },
            },
            {
              $lookup: {
                from: 'alumnos',
                localField: 'alumno',
                foreignField: '_id',
                as: 'alumno',
              },
            },
            {
              $unwind: {
                path: '$alumno',
              },
            },
            //
            {
              $match: {
                'planillaTaller.profesor': ObjectId(usuario.profesor._id),
                leido: false,
                activo: true,
              },
            },
            {
              $project: {
                _id: 1,
                planillaTaller: 1,
                'alumno._id': 1,
                'alumno.nombreCompleto': 1,
                tipoSeguimiento: 1,
                resuelto: 1,
                leido: 1,
              },
            },
          ];
          const seguimientos = await this.seguimientoAlumno.aggregate(opciones);
          return response.status(200).send(seguimientos);
        } else {
          const seguimientos = await this.seguimientoAlumno.find({ leido: false, activo: true });
          return response.status(200).send(seguimientos);
        }
      } else {
        next(new HttpException(400, 'El usuario que solicita los seguimientos no existe'));
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Problemas en el servidor'));
    }
  };
  private obtenerSeguimientoAlumnoPorPlanilla = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const opciones: any = [
        {
          $lookup: {
            from: 'ciclolectivos',
            localField: 'cicloLectivo',
            foreignField: '_id',
            as: 'cicloLectivo',
          },
        },
        {
          $unwind: {
            path: '$cicloLectivo',
          },
        },
        {
          $match: {
            planillaTaller: ObjectId(id),
          },
        },
      ];

      const seguimientos = await this.seguimientoAlumno.aggregate(opciones);
      response.send(seguimientos);
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Problemas en el servidor'));
    }
  };

  private resueltos = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { resuelto } = request.body;

      const opciones: any = [
        {
          $lookup: {
            from: 'alumnos',
            localField: 'alumno',
            foreignField: '_id',
            as: 'alumno',
          },
        },
        {
          $unwind: {
            path: '$alumno',
          },
        },
        {
          $lookup: {
            from: 'planillatalleres',
            localField: 'planillaTaller',
            foreignField: '_id',
            as: 'planillaTaller',
          },
        },
        {
          $unwind: {
            path: '$planillaTaller',
            preserveNullAndEmptyArrays: true,
          },
        },
        // Curso
        {
          $lookup: {
            from: 'cursos',
            localField: 'planillaTaller.curso',
            foreignField: '_id',
            as: 'planillaTaller.curso',
          },
        },
        {
          $unwind: {
            path: '$planillaTaller.curso',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'ciclolectivos',
            localField: 'cicloLectivo',
            foreignField: '_id',
            as: 'cicloLectivo',
          },
        },
        {
          $unwind: {
            path: '$cicloLectivo',
          },
        },
        {
          $sort: {
            fecha: -1,
          },
        },
      ];

      if (typeof resuelto === 'boolean') {
        // planillaTaller: null, Este campo se puede agregar si solo quieren los seguimientos sin planilla
        opciones.push({
          $match: { resuelto: resuelto },
        });
      }
      const seguimientos = await this.seguimientoAlumno.aggregate(opciones);
      // const seguimientos = await this.seguimientoAlumno.find(filtro).sort('_id').populate('alumno');

      if (seguimientos) {
        response.send(seguimientos);
      } else {
        next(new NotFoundException());
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
  private migrar = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const now = new Date();
      const hoy = new Date(moment(now).format('YYYY-MM-DD'));
      const ciclosLectivos: ICicloLectivo[] = await this.ciclolectivo.find();
      const seguimientosOriginales: any = await this.seguimientoAlumnoOriginal.find();

      const seguimientoRefactorizados: ISeguimientoAlumno[] = await Promise.all(
        seguimientosOriginales.map(async (x: any, index: number) => {
          let planillataller: any = [];
          let alumno: any = [];
          try {
            planillataller = await this.planillaTaller.findOne({
              planillaTallerId: x.IdPlanillaDeTaller,
            });
          } catch (ero) {
            console.log('ero', ero);
          }
          try {
            alumno = await this.alumno.findOne({
              alumnoId: x.id_alumno,
            });
          } catch (ero) {
            console.log('ero', ero);
          }
          const fechadate = new Date(x.fecha);
          const fecha = new Date(moment(fechadate).format('YYYY-MM-DD'));
          const cl = await ciclosLectivos.filter((d) => Number(d.anio) === (x.ciclo_lectivo === 0 ? 2019 : Number(x.ciclo_lectivo)));
          const unSeguimientoAlumno: ISeguimientoAlumno & any = {
            seguimientoAlumnoNro: index,
            alumno: alumno,
            planillaTaller: planillataller,
            fecha,
            tipoSeguimiento: x.tipo_seguimiento,
            cicloLectivo: cl[0],
            resuelto: x.Resuelto === 'SI' ? true : false,
            observacion: x.observacion,
            observacion2: x.Observacion,
            observacionJefe: x.ObservacionJefe,

            fechaCreacion: hoy,
            activo: true,
          };

          return unSeguimientoAlumno;
        })
      );

      try {
        const savedPlanillaTallers = await this.seguimientoAlumno.insertMany(seguimientoRefactorizados);
        response.send({
          savedPlanillaTallers,
        });
      } catch (e) {
        console.log('ERROR', e);
        next(new HttpException(500, 'Ocurrió un error al guardar las planillasTalleres'));
      }
    } catch (e2) {
      console.log('ERROR', e2);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
}

export default SeguimientoAlumnoController;
