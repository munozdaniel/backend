import mongoose from 'mongoose';
import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import Controller from '../interfaces/controller.interface';

import asistenciaModel from './asistencia.model';
import escapeStringRegexp from 'escape-string-regexp';
import IAsistencia from './asistencia.interface';
import asistenciaOriginalModel from './asistenciaOriginal.model';
import planillaTallerModel from '../planillaTaller/planillaTaller.model';
import alumnoModel from '../alumnos/alumno.model';
import NotFoundException from '../exceptions/NotFoundException';
import moment from 'moment';
import calendarioModel from '../calendario/calendario.model';
import * as _ from 'lodash';

const ObjectId = mongoose.Types.ObjectId;
class AsistenciaController implements Controller {
  public path = '/asistencia';
  public router = Router();
  private asistencia = asistenciaModel;
  private planillaTaller = planillaTallerModel;
  private alumno = alumnoModel;
  private asistenciaOriginal = asistenciaOriginalModel;
  private calendario = calendarioModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/migrar`, this.migrarMultiples);
    this.router.post(`${this.path}/por-alumno/:id`, this.obtenerAsistenciasPorAlumnoId);
    this.router.post(`${this.path}/por-alumno-curso`, this.obtenerAsistenciasPorAlumnosCurso);
    this.router.get(`${this.path}/por-planilla/:id`, this.obtenerAsistenciasPorPlanilla);
    // this.router.post(`${this.path}/informe-plantillas-entre-fechas`, this.informeAsistenciasPlantillasEntreFechas);
    this.router.post(`${this.path}/informe-plantillas-entre-fechas`, this.informeAsistenciasGeneral);
    this.router.post(`${this.path}/informe-por-planilla`, this.informeAsistenciasPorPlanilla);
    this.router.put(`${this.path}`, this.guardarAsistencia);
    this.router.patch(`${this.path}/:id`, this.actualizarAsistencia);
    this.router.delete(`${this.path}/:id`, this.eliminar);
  }
  private async obtenerCalendarioEntreFechas(fechaInicio: Date, fechaFinalizacion: Date) {
    const opciones: any = [
      {
        $match: {
          fecha: {
            $gte: fechaInicio, // funciona sin isodate
            $lt: fechaFinalizacion, // funciona sin isodate
          },
        },
      },
    ];

    return await this.calendario.aggregate(opciones);
  }
  private async obtenerAlumnosPorCCD(ciclo: number, curso: Number, comision: string, division: Number) {
    let match: any = {
      'estadoCursadas.curso.curso': Number(curso),
      'estadoCursadas.curso.division': Number(division),
      'estadoCursadas.curso.comision': comision.toString(),
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
    return await this.alumno.aggregate(opciones);
  }
  private informeAsistenciasPorPlanilla = async (request: Request, response: Response, next: NextFunction) => {
    const planilla = request.body.planillaTaller;
    let fechaInicio: Date = new Date(moment.utc(planilla.fechaInicio).format('YYYY-MM-DD'));
    const fechaFinalizacion: Date = new Date(moment.utc(planilla.fechaFinalizacion).format('YYYY-MM-DD'));
    // Obtenemos el calendario
    const calendario = await this.obtenerCalendarioEntreFechas(fechaInicio, fechaFinalizacion);
    // console.log('calenda rio', calendario);
    // Obtenemos los alumnos
    const { curso, comision, division } = planilla.curso;
    const alumnos = await this.obtenerAlumnosPorCCD(planilla.cicloLectivo.anio, curso, comision, division);
    // console.log('alumnos', alumnos);
    //
    let totalAsistencias = 0;
    let totalAusentes = 0;
    const asistenciasPorAlumno = await Promise.all(
      alumnos.map(async (alumno: any) => {
        const asistenciasArray = await Promise.all(
          calendario.map(async (x: any) => {
            const f: any = new Date(moment.utc(x.fecha).format('YYYY-MM-DD'));
            const opciones: any[] = [
              {
                $match: {
                  planillaTaller: ObjectId(planilla._id),
                  alumno: ObjectId(alumno._id),
                  fecha: f,
                },
              },
            ];
            const asistencias = await this.asistencia.aggregate(opciones);
            console.log('asistencias', asistencias);
            if (asistencias && asistencias.length > 0) {
              totalAsistencias += asistencias[0].presente ? 1 : 0;
              totalAusentes += !asistencias[0].presente ? 1 : 0;
              return {
                // legajo: alumno.legajo,
                // alumnoId: alumno._id,
                // alumnoNombre: alumno.nombreCompleto,
                tarde: asistencias[0].tarde,
                presente: asistencias[0].presente,
                fecha: moment.utc(x.fecha).format('DD/MM/YYYY'),
                encontrada: true,
              };
            } else {
              // totalAsistencias += asistencias[0].presente ? 1 : 0;
              // totalAusentes += !asistencias[0].presente ? 1 : 0;
              return {
                // legajo: alumno.legajo,
                // alumnoId: alumno._id,
                // alumnoNombre: alumno.nombreCompleto,
                tarde: null,
                presente: null,
                fecha: moment.utc(x.fecha).format('DD/MM/YYYY'),
                encontrada: false, // No se agendó la asistencia
              };
            }
          })
        );
        return {
          legajo: alumno.legajo,
          alumnoId: alumno._id,
          alumnoNombre: alumno.nombreCompleto,
          asistenciasArray,
          totalAsistencias,
          totalAusentes,
        };
      })
    );
    return response.send({ asistenciasPorAlumno, calendario, alumnos });
  };
  private informeAsistenciasGeneral = async (request: Request, response: Response, next: NextFunction) => {
    const planillaTaller = request.body.planillaTaller;
    // const curso = Number(request.body.curso);
    // const division = Number(request.body.division);
    // const cicloLectivoId = Number(request.body.division);
    const fechaInicio: any = new Date(moment.utc(planillaTaller.fechaInicio).format('YYYY-MM-DD'));
    // moment(request.body.fechaInicio).utc();
    const fechaFinalizacion: any = new Date(moment.utc(planillaTaller.fechaFinalizacion).format('YYYY-MM-DD'));
    // Buscamos las planillas
    const matchAs = {
      $match: {
        'planillaTaller.fechaInicio': {
          $eq: fechaInicio,
        },
        'planillaTaller.fechaFinalizacion': {
          $eq: fechaFinalizacion,
        },
      },
    };

    const opciones = [
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
          preserveNullAndEmptyArrays: true,
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
      { ...matchAs },
      {
        $project: {
          _id: 1,
          alumnoId: '$alumno._id',
          alumno: '$alumno.nombreCompleto',
          asignatura: '$planillaTaller.asignatura.detalle',
          fecha: 1,
          presente: 1,
          llegoTarde: 1,
          planillaTaller: '$planillaTaller._id',
        },
      },
      { $sort: { fecha: 1 } },
    ];

    try {
      const asistenciasAggregate = await this.asistencia.aggregate(opciones);

      if (!asistenciasAggregate || asistenciasAggregate.length < 1) {
        response.send({ asistencias: [], success: false, message: 'No hay planillas cargadas' });
      } else {
        let match: any = {
          'estadoCursadas.activo': true,
          'estadoCursadas.cicloLectivo._id': ObjectId(planillaTaller.cicloLectivo._id),
          'estadoCursadas.curso.curso': Number(planillaTaller.curso.curso),
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
        try {
          const alumnos = await this.alumno.aggregate(opciones);
          if (!alumnos || alumnos.length < 1) {
            return response.send({ asistencias: [], success: false, message: 'No hay alumnos cargados para el curso solicitado' });
          }
          const mergeAsistencias = _.chain(asistenciasAggregate)
            // Group the elements of Array based on `color` property
            .groupBy('alumnoId')
            // `key` is group's name (color), `value` is the array of objects
            .map((value:any, key:any) => ({ alumnoId: key, asistencias: value }))
            .value();
          const alumnosConAsistencias = await Promise.all(
            alumnos.map((x) => {
              const index = mergeAsistencias.findIndex((a:any) => ObjectId(a.alumnoId) === ObjectId(x._id));
              if (index === -1) {
                return { ...x, asistencias: [] };
              } else {
                return { ...x, asistencias: mergeAsistencias[index] };
              }
            })
          );

          response.send({ asistencias: alumnosConAsistencias, success: true, message: 'Operación exitosa' });
        } catch (error) {
          console.log('[ERROR]', error);
          next(new HttpException(500, 'Error Interno'));
        }
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Error Interno'));
    }
  };
  private informeAsistenciasPlantillasEntreFechas = async (request: Request, response: Response, next: NextFunction) => {
    const comision = request.body.comision;
    const fechaInicio: any = new Date(moment.utc(request.body.fechaInicio).format('YYYY-MM-DD'));
    // moment(request.body.fechaInicio).utc();
    const fechaFinalizacion: any = new Date(moment.utc(request.body.fechaFinalizacion).format('YYYY-MM-DD'));
    // moment(request.body.fechaFinalizacion).utc(); //.format('YYYY-MM-DD');
    const match = {
      $match: {
        'planillaTaller.fechaInicio': {
          $eq: fechaInicio,
        },
        'planillaTaller.fechaFinalizacion': {
          $eq: fechaFinalizacion,
        },
      },
    };

    try {
      const opciones = [
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
            preserveNullAndEmptyArrays: true,
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
        { ...match },
        {
          $project: {
            _id: 1,
            alumnoId: '$alumno._id',
            alumno: '$alumno.nombreCompleto',
            asignatura: '$planillaTaller.asignatura.detalle',
            fecha: 1,
            presente: 1,
            llegoTarde: 1,
            planillaTaller: '$planillaTaller._id',
          },
        },
        { $sort: { fecha: 1 } },
      ];

      const asistenciasAggregate = await this.asistencia.aggregate(opciones);
      // Calendario. Obtener todos los dias de un calendario por planilla y comision.
      let matchComision: any = null;
      switch (comision) {
        case 'A':
          matchComision = {
            comisionA: 1,
          };
          break;
        case 'B':
          matchComision = {
            comisionB: 1,
          };
          break;
        case 'C':
          matchComision = {
            comisionC: 1,
          };
          break;
        case 'D':
          matchComision = {
            comisionD: 1,
          };
          break;
        case 'E':
          matchComision = {
            comisionE: 1,
          };
          break;
        case 'F':
          matchComision = {
            comisionF: 1,
          };
          break;
        case 'G':
          matchComision = {
            comisionG: 1,
          };
          break;
        case 'H':
          matchComision = {
            comisionH: 1,
          };
          break;

        default:
          console.log('BNONE');

          break;
      }
      const match2 = {
        $match: {
          fecha: {
            $gte: fechaInicio, // funciona sin isodate
            $lt: fechaFinalizacion, // funciona sin isodate
          },
          ...matchComision,
        },
      };
      const opcionesC: any = [
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
        { ...match2 },
        { $sort: { fecha: 1 } },
      ];
      const calendario = await this.calendario.aggregate(opcionesC);
      const merge = _.chain(asistenciasAggregate)
        // Group the elements of Array based on `color` property
        .groupBy('alumno')
        // `key` is group's name (color), `value` is the array of objects
        .map((value: any, key: any) => ({ alumno: key, asistencias: value }))
        .value();

      return response.send({ asistencias: merge, calendario, merge });
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
  private eliminar = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const successResponse = await this.asistencia.findByIdAndDelete(id);
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
  private guardarAsistencia = async (request: Request, response: Response, next: NextFunction) => {
    const asistencia = request.body.asistencia;
    const match = {
      alumno: ObjectId(asistencia.alumno._id),
      planillaTaller: ObjectId(asistencia.planillaTaller._id),
      fecha: {
        $gte: new Date(asistencia.fecha).toISOString(),
        $lt: moment(asistencia.fecha).add('59', 'seconds').add('59', 'minutes').add('23', 'hours').toDate().toISOString(),
      },
    };
    const ini = new Date(moment(asistencia.fecha).utc().format('YYYY-MM-DD'));
    asistencia.fecha = ini;
    try {
      const updated = await this.asistencia.findOneAndUpdate(match, asistencia, { upsert: true, new: true });
      if (updated) {
        response.send({ asistencia: updated });
      } else {
        response.send({ asistencia: null });
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Error Interno'));
    }
  };
  private actualizarAsistencia = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    const asistencia = request.body.asistencia;
    const ini = new Date(moment(asistencia.fecha).format('YYYY-MM-DD'));
    asistencia.fecha = ini;
    try {
      const updated = await this.asistencia.findByIdAndUpdate(id, asistencia, { new: true });
      if (updated) {
        response.send({ asistencia: updated });
      } else {
        response.send({ asistencia: null });
      }
    } catch (e4) {
      console.log('[ERROR], ', e4);
      next(new HttpException(500, 'Ocurrió un error interno'));
    }
  };
  private obtenerAsistenciasPorPlanilla = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    const opciones: any = [
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
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          'planillaTaller._id': ObjectId(id),
        },
      },
    ];
    const asistencias = await this.asistencia.aggregate(opciones);
    if (asistencias) {
      return response.send(asistencias);
    } else {
      next(new NotFoundException('asistencias'));
    }
  };
  private obtenerAsistenciasPorAlumnosCurso = async (request: Request, response: Response, next: NextFunction) => {
    const { curso, division, ciclo } = request.body;
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
        $match: {
          'estadoCursadas.curso.curso': Number(curso),
          'estadoCursadas.curso.division': Number(division),
          'estadoCursadas.cicloLectivo.anio': Number(ciclo),
        },
      },
    ];
    const alumnos = await this.alumno.aggregate(opciones);
    console.log(alumnos);
    if (alumnos) {
      return response.send(alumnos);
    } else {
      next(new NotFoundException('alumnos'));
    }
  };
  private obtenerAsistenciasPorAlumnoId = async (request: Request, response: Response, next: NextFunction) => {
    const id = escapeStringRegexp(request.params.id);
    const planillaId = escapeStringRegexp(request.body.planillaId);
    try {
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
            'alumno._id': ObjectId(id),
            planillaTaller: ObjectId(planillaId),
          },
        },
        {
          $sort: {
            fecha: -1,
          },
        },
      ];
      const asistenciasAggregate = await this.asistencia.aggregate(opciones);
      if (asistenciasAggregate) {
        response.send(asistenciasAggregate);
      } else {
        next(new NotFoundException());
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Ocurrió un error interno'));
    }
  };
  private recuperarDatos = async (skip: number, limit: number, request: Request, response: Response, next: NextFunction) => {
    const now = new Date();
    const hoy = new Date(moment(now).format('YYYY-MM-DD'));
    const asistenciasOriginales: any = await this.asistenciaOriginal.find().skip(skip).limit(limit);
    const asistenciasOriginalesRefactorizados: IAsistencia[] = await Promise.all(
      asistenciasOriginales.map(async (x: any, index: number) => {
        let planillataller: any = [];
        let alumno: any = [];
        try {
          planillataller = await this.planillaTaller.findOne({
            planillaTallerId: x.id_planilla_de_taller,
          });
          if (!planillataller) {
            console.log(' x.id_planilla_de_taller', x.id_planilla_de_taller);
            return null;
          }
        } catch (ero) {
          console.log('ero', ero);
        }
        try {
          if (x.id_alumnos && x.id_alumnos !== 0) {
            alumno = await this.alumno.findOne({
              alumnoId: x.id_alumnos,
            });
            if (!alumno) {
              console.log(' x.id_alumnos', x.id_alumnos);
              return null;
            }
          } else {
            console.log('&& x.id_alumnos', x.id_alumnos);
            return null;
          }
        } catch (ero) {
          console.log('ero', ero);
        }
        const fechadate = new Date(x.Fecha);
        const fecha = new Date(moment(fechadate).format('YYYY-MM-DD'));
        const unaAsistencia: IAsistencia & any = {
          id_planilla_de_asistencia: x.id_planilla_de_asistencia, // solo para migrar
          planillaTaller: planillataller,
          alumno: alumno,
          fecha,
          presente: x.Presente === 'SI' ? true : false,
          llegoTarde: x.LlegoTarde === 'SI' ? true : false,

          fechaCreacion: hoy,
          activo: true,
        };

        return unaAsistencia;
      })
    );
    asistenciasOriginalesRefactorizados;
    const filtrados = asistenciasOriginalesRefactorizados.filter((x) => {
      return x !== null && typeof x !== 'undefined' && x.fecha !== null;
    });
    return filtrados;
  };
  private migrarMultiples = async (request: Request, response: Response, next: NextFunction) => {
    // ================================================================
    let filtrados = await this.recuperarDatos(0, 10000, request, response, next);
    let savedAsistencias = await this.asistencia.insertMany(filtrados);
    console.log('(0,10000)================>', savedAsistencias.length);
    // ================================================================
    filtrados = await this.recuperarDatos(10000, 10000, request, response, next);
    savedAsistencias = await this.asistencia.insertMany(filtrados);
    console.log('(10000,10000)================>', savedAsistencias.length);
    // ================================================================
    filtrados = await this.recuperarDatos(20000, 10000, request, response, next);
    savedAsistencias = await this.asistencia.insertMany(filtrados);
    console.log('(20000,10000)================>', savedAsistencias.length);
    // ================================================================
    filtrados = await this.recuperarDatos(30000, 10000, request, response, next);
    savedAsistencias = await this.asistencia.insertMany(filtrados);
    console.log('(30000,10000)================>', savedAsistencias.length);
    // ================================================================
    filtrados = await this.recuperarDatos(40000, 10000, request, response, next);
    savedAsistencias = await this.asistencia.insertMany(filtrados);
    console.log('(40000,10000)================>', savedAsistencias.length);
    // ================================================================
    filtrados = await this.recuperarDatos(50000, 10000, request, response, next);
    savedAsistencias = await this.asistencia.insertMany(filtrados);
    console.log('(50000,10000)================>', savedAsistencias.length);
    // ================================================================
    filtrados = await this.recuperarDatos(60000, 10000, request, response, next);
    savedAsistencias = await this.asistencia.insertMany(filtrados);
    console.log('(60000,10000)================>', savedAsistencias.length);
    response.send({
      message: 'Finalizado',
    });
  };
  private migrar = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const now = new Date();
      const hoy = new Date(moment(now).format('YYYY-MM-DD'));
      const asistenciasOriginales: any = await this.asistenciaOriginal.find().limit(10000);
      // const asistenciasOriginales2: any = await this.asistenciaOriginal.find().skip(10000).limit(10000);
      // const asistenciasOriginales3: any = await this.asistenciaOriginal.find().skip(20000).limit(10000);
      // const asistenciasOriginales4: any = await this.asistenciaOriginal.find().skip(30000).limit(10000);
      // const asistenciasOriginales5: any = await this.asistenciaOriginal.find().skip(40000).limit(10000);
      // const asistenciasOriginales6: any = await this.asistenciaOriginal.find().skip(50000).limit(10000);
      // const asistenciasOriginales7: any = await this.asistenciaOriginal.find().skip(60000).limit(10000);
      // const asistenciasOriginales: any = await this.asistenciaOriginal.find().skip(70000).limit(10000);

      const asistenciasOriginalesRefactorizados: IAsistencia[] = await Promise.all(
        asistenciasOriginales.map(async (x: any, index: number) => {
          let planillataller: any = [];
          let alumno: any = [];
          try {
            planillataller = await this.planillaTaller.findOne({
              planillaTallerId: x.id_planilla_de_taller,
            });
            if (!planillataller) {
              console.log(' x.id_planilla_de_taller', x.id_planilla_de_taller);
              return null;
            }
          } catch (ero) {
            console.log('ero', ero);
          }
          try {
            if (x.id_alumnos && x.id_alumnos !== 0) {
              alumno = await this.alumno.findOne({
                alumnoId: x.id_alumnos,
              });
              if (!alumno) {
                console.log(' x.id_alumnos', x.id_alumnos);
                return null;
              }
            } else {
              console.log('&& x.id_alumnos', x.id_alumnos);
              return null;
            }
          } catch (ero) {
            console.log('ero', ero);
          }

          const unaAsistencia: IAsistencia & any = {
            id_planilla_de_asistencia: x.id_planilla_de_asistencia, // solo para migrar
            planillaTaller: planillataller,
            alumno: alumno,
            fecha: x.Fecha,
            presente: x.Presente === 'SI' ? true : false,
            llegoTarde: x.LlegoTarde === 'SI' ? true : false,

            fechaCreacion: hoy,
            activo: true,
          };

          return unaAsistencia;
        })
      );

      try {
        const filtrados = asistenciasOriginalesRefactorizados.filter((x) => {
          if (x.fecha === null) {
            console.log('&&&& x.id_alumnos', x.alumno.alumnoId);
          }
          return x !== null && typeof x !== 'undefined' && x.fecha !== null;
        });
        console.log('filtrados', filtrados.length);
        const savedAsistencias = await this.asistencia.insertMany(filtrados);
        response.send({
          savedAsistencias,
        });
      } catch (e) {
        console.log('ERROR', e);
        // response.send({
        //   error: asistenciasOriginalesRefactorizados,
        // });
        next(new HttpException(500, 'Ocurrió un error al guardar las asistenciasOriginales'));
      }
    } catch (e2) {
      console.log('ERROR', e2);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
}

export default AsistenciaController;
