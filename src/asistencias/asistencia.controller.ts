import mongoose from 'mongoose';
import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import Controller from '../interfaces/controller.interface';

import asistenciaModel, { asistenciaSchema } from './asistencia.model';
import escapeStringRegexp from 'escape-string-regexp';
import IAsistencia from './asistencia.interface';
import asistenciaOriginalModel from './asistenciaOriginal.model';
import planillaTallerModel from '../planillaTaller/planillaTaller.model';
import alumnoModel from '../alumnos/alumno.model';
import NotFoundException from '../exceptions/NotFoundException';
import moment from 'moment';
import calendarioModel from '../calendario/calendario.model';
import * as _ from 'lodash';
import passport from 'passport';
import IAdulto from '../adulto/adulto.interface';

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
    this.router.post(`${this.path}/por-alumno/:id`, passport.authenticate('jwt', { session: false }), this.obtenerAsistenciasPorAlumnoId);
    this.router.post(
      `${this.path}/por-alumno-curso`,
      passport.authenticate('jwt', { session: false }),
      this.obtenerAsistenciasPorAlumnosCurso
    );
    this.router.get(`${this.path}/por-planilla/:id`, passport.authenticate('jwt', { session: false }), this.obtenerAsistenciasPorPlanilla);
    // this.router.post(`${this.path}/informe-plantillas-entre-fechas`, this.informeAsistenciasPlantillasEntreFechas);
    this.router
      .all(`${this.path}/*`, passport.authenticate('jwt', { session: false }))

      .post(`${this.path}/informe-plantillas-entre-fechas`, this.informeAsistenciasGeneral)
      .post(`${this.path}/informe-por-planilla`, this.informeAsistenciasPorPlanilla)
      .put(`${this.path}`, this.guardarAsistencia)
      .patch(`${this.path}/:id`, this.actualizarAsistencia)
      .delete(`${this.path}/:id`, this.eliminar)
      .get(`${this.path}/asistencias-hoy/:id`, this.buscarAsistenciasHoy)
      .post(`${this.path}/buscar-inasistencias`, this.buscarInasistencias)
      .post(`${this.path}/buscar-asistencias-por-fechas`, this.buscarAsistenciasPorFechas)
      .post(`${this.path}/tomar-asistencias`, this.tomarAsistenciaPorPlanilla)
      .post(`${this.path}/obtener-asistencias-hoy`, this.obtenerAsistenciasHoyPorPlanilla)
      .post(`${this.path}/obtener-asistencias-fecha`, this.buscarAsistenciasPorFechaYPlanilla);
  }
  private buscarAsistenciasPorFechaYPlanilla = async (request: Request, response: Response, next: NextFunction) => {
    const alumnos = request.body.alumnos;
    const planilla = request.body.planilla;
    const fecha = request.body.fecha;
    const f = new Date(moment.utc(fecha).format('YYYY-MM-DD'));
    const opciones: any[] = [
      [
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
          $match: {
            'planillaTaller._id': ObjectId(planilla._id),
            fecha: {
              $eq: f,
            },
          },
        },
      ],
    ];
    const asistencias = await this.asistencia.aggregate(opciones);
    return response.send(asistencias);
  };
  private obtenerAsistenciasHoyPorPlanilla = async (request: Request, response: Response, next: NextFunction) => {
    const alumnos = request.body.alumnos;
    const planilla = request.body.planilla;
    const now = new Date();
    const hoy = new Date(moment(now).format('YYYY-MM-DD'));
    const opciones: any[] = [
      [
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
          $match: {
            'planillaTaller._id': ObjectId(planilla._id),
            fecha: {
              $eq: hoy,
            },
          },
        },
      ],
    ];
    const asistencias = await this.asistencia.aggregate(opciones);
    return response.send(asistencias);
  };
  private tomarAsistenciaPorPlanilla = async (request: Request, response: Response, next: NextFunction) => {
    const alumnos = request.body.alumnos;
    const planilla = request.body.planilla;
    // const now = new Date();
    // const hoy = new Date(moment(now).format('YYYY-MM-DD'));
    const fecha = request.body.fecha;

    const f = new Date(moment.utc(fecha).format('YYYY-MM-DD'));

    const opciones: any[] = [
      [
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
          $match: {
            'planillaTaller._id': ObjectId(planilla._id),
            fecha: {
              $eq: f,
            },
          },
        },
      ],
    ];
    const asistencias = await this.asistencia.aggregate(opciones);
    if (asistencias && asistencias.length > 0) {
      // Ya existen... deberia comprobar cuales y pisarlas

      const actualizarAsistencias = await Promise.all(
        alumnos.map(async (alumno: any) => {
          const asistencia = {
            planillaTaller: planilla,
            alumno: alumno,
            fecha: f,
            presente: alumno.presente,
            llegoTarde: alumno.tarde,
            ausentePermitido: alumno.ausentePermitido,
            fechaCreacion: f,
            activo: true,
          };
          const updated = await this.asistencia.findOneAndUpdate(
            { fecha: f, planillaTaller: planilla._id, alumno: alumno._id },
            asistencia,
            {
              new: true,
              upsert: true,
            }
          );
          return updated;
        })
      );
      response.send({
        actualizarAsistencias,
      });
      // const interseccion = _.intersectionWith(
      //   alumnos,
      //   asistencias,
      //   (al: IAlumno, asis: IAsistencia) => ObjectId(al._id.toString()) === ObjectId(asis.alumno.toString())
      // );
    } else {
      const nuevasAsistencias = await Promise.all(
        alumnos.map((alumno: any) => ({
          planillaTaller: planilla,
          alumno: alumno,
          fecha: f,
          presente: alumno.presente,
          ausentePermitido: alumno.ausentePermitido,
          llegoTarde: alumno.tarde,
          fechaCreacion: f,
          activo: true,
        }))
      );
      const saved = await this.asistencia.insertMany(nuevasAsistencias);
      response.send({
        saved,
      });
    }
  };
  private buscarAsistenciasHoy = async (request: Request, response: Response, next: NextFunction) => {
    const planillaId = request.params.id;
    try {
      const now = new Date();
      const hoy = new Date(moment(now).format('YYYY-MM-DD'));
      const asistencias = await this.asistencia.find({ planillaTaller: ObjectId(planillaId), fecha: hoy });
      let presentes = 0;
      let ausentes = 0;
      await Promise.all(
        asistencias.map((x) => {
          if (x.presente) {
            presentes++;
          } else {
            if (!x.ausentePermitido) {
              ausentes++;
            }
          }
        })
      );
      response.status(200).send({ presentes, ausentes });
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Problemas interno'));
    }
  };
  private buscarInasistencias = async (request: Request, response: Response, next: NextFunction) => {
    const turno = request.body.turno;
    const curso = request.body.curso;
    const division = request.body.division;
    let desde: Date = new Date(moment.utc(request.body.desde).format('YYYY-MM-DD'));
    let hasta: Date = new Date(moment.utc(request.body.hasta).format('YYYY-MM-DD'));
    let match: any = {};
    let matchFecha: any = {};
    if (request.body.hasta) {
      matchFecha = {
        $gte: desde,
        $lt: hasta,
      };
    } else {
      matchFecha = {
        $eq: desde,
      };
    }
    if (curso) {
      match = {
        fecha: matchFecha,
        'planillaTaller.curso.curso': Number(curso),
        presente: false,
        'planillaTaller.turno': turno,
        ausentePermitido: false,
      };
    } else {
      match = { fecha: matchFecha, presente: false, 'planillaTaller.turno': turno, ausentePermitido: false };
    }
    if (division) {
      match = { ...match, 'planillaTaller.curso.division': division };
    }
    // console.log('match', match);
    try {
      const opciones: any[] = [
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
            // preserveNullAndEmptyArrays: false,
          },
        },
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
        // {
        //   $match: {
        //     presente: false,
        //     fecha: match,
        //     'planillaTaller.turno': turno,
        //   },
        // },
        { $match: { ...match } },
      ];
      const alumnosInasistentes = await this.asistencia.aggregate(opciones);
      const alumnosNoRegistrados: any[] = [];
      const alumnos: any[] = [];
      await Promise.all(
        alumnosInasistentes.map(async (x) => {
          if (x.alumno.adultos) {
            const adultoPreferido = await x.alumno.adultos.filter((y: IAdulto) => y.preferencia && y.email && this.validateEmail(y.email));
            if (adultoPreferido && adultoPreferido.length > 0) {
              await Promise.all(
                adultoPreferido.map((z: IAdulto) => {
                  alumnos.push({
                    ...x,
                    email: z.email,
                    nombreAdulto: z.nombreCompleto ? z.nombreCompleto : 'Sin Nombre',
                  });
                })
              );
            } else {
              const index: number = await x.alumno.adultos.findIndex((y: any) => y.email && this.validateEmail(y.email));
              let email = null;
              if (index !== -1) {
                email = x.alumno.adultos[index].email;
                alumnos.push({
                  ...x,
                  email,
                  nombreAdulto: x.alumno.adultos[index].nombreCompleto ? x.alumno.adultos[index].nombreCompleto : 'Sin Nombre',
                });
              } else {
                alumnosNoRegistrados.push(x);
              }
            }
          } else {
            alumnosNoRegistrados.push(x);
          }
        })
      );
      response.send({ alumnosMerge: alumnosInasistentes, alumnos, alumnosNoRegistrados: alumnosNoRegistrados });
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Problemas interno'));
    }
  };
  private validateEmail(email: string) {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }
  private buscarAsistenciasPorFechas = async (request: Request, response: Response, next: NextFunction) => {
    const curso = Number(request.body.curso);
    const division = Number(request.body.division);
    const turno = request.body.turno;
    let desde: Date = new Date(moment.utc(request.body.desde).format('YYYY-MM-DD'));
    let hasta: Date = new Date(moment.utc(request.body.hasta).format('YYYY-MM-DD'));
    let match;
    let matchFecha: any = {};
    if (request.body.hasta) {
      matchFecha = {
        $gte: desde,
        $lt: hasta,
      };
    } else {
      matchFecha = {
        $eq: desde,
      };
    }
    if (curso) {
      match = { fecha: matchFecha, 'planillaTaller.curso.curso': Number(curso), presente: false, 'planillaTaller.turno': turno };
    } else {
      match = { fecha: matchFecha, presente: false, 'planillaTaller.turno': turno };
    }
    if (division) {
      match = { ...match, 'planillaTaller.curso.division': division };
    }
    try {
      const opciones: any[] = [
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
            //   preserveNullAndEmptyArrays: false,
          },
        },
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
        { $match: { ...match } },

        // {
        //   $match: {
        //     fecha: match,
        //     presente: false,
        //     'planillaTaller.turno': turno,
        //     // 'planillaTaller.curso.curso': curso,
        //   },
        // },
        {
          $sort: {
            fecha: 1,
          },
        },
      ];
      const alumnosInasistentes = await this.asistencia.aggregate(opciones);

      response.send({ alumnos: alumnosInasistentes });
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Problemas interno'));
    }
  };
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
          nombreCompleto: 1,
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
    // Obtenemos los alumnos
    const { curso, comision, division } = planilla.curso;
    const alumnos = await this.obtenerAlumnosPorCCD(planilla.cicloLectivo.anio, curso, comision, division);
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
  // TODO: General
  private informeAsistenciasGeneral = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const planilla = request.body.planillaTaller;
      let fechaInicio: Date = new Date(moment.utc(planilla.fechaInicio).format('YYYY-MM-DD'));
      const fechaFinalizacion: Date = new Date(moment.utc(planilla.fechaFinalizacion).format('YYYY-MM-DD'));
      // Obtenemos el calendario
      const calendario = await this.obtenerCalendarioEntreFechas(fechaInicio, fechaFinalizacion);
      // Obtenemos los alumnos
      const { curso, comision, division } = planilla.curso;
      const alumnos = await this.obtenerAlumnosPorCCD(planilla.cicloLectivo.anio, curso, comision, division);
      // =================================
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
              if (asistencias && asistencias.length > 0) {
                return {
                  // legajo: alumno.legajo,
                  // alumnoId: alumno._id,
                  // alumnoNombre: alumno.nombreCompleto,
                  tarde: asistencias[0].tarde ? 'SI' : 'NO',
                  presente: asistencias[0].presente ? 'SI' : 'NO',
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
                  tarde: '-',
                  presente: '-',
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
          };
        })
      );
      // =================================

      return response.send({
        asistenciasPorAlumno,
        calendario,
        alumnos,
      });
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Ocurrió un problema interno'));
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
    const ini = new Date(moment.utc(asistencia.fecha).format('YYYY-MM-DD'));
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
              return null;
            }
          } else {
            return null;
          }
        } catch (ero) {
          console.log('ero', ero);
        }
        const fechadate = new Date(x.Fecha);
        const fecha = new Date(moment.utc(fechadate).format('YYYY-MM-DD'));
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
    let savedAsistencias = await this.asistencia.insertMany(filtrados, { ordered: true });
    console.log('(0,10000)================>', savedAsistencias.length);
    // ================================================================
    filtrados = await this.recuperarDatos(10000, 10000, request, response, next);
    savedAsistencias = await this.asistencia.insertMany(filtrados, { ordered: true });
    console.log('(10000,10000)================>', savedAsistencias.length);
    // ================================================================
    filtrados = await this.recuperarDatos(20000, 10000, request, response, next);
    savedAsistencias = await this.asistencia.insertMany(filtrados, { ordered: true });
    console.log('(20000,10000)================>', savedAsistencias.length);
    // ================================================================
    filtrados = await this.recuperarDatos(30000, 10000, request, response, next);
    savedAsistencias = await this.asistencia.insertMany(filtrados, { ordered: true });
    console.log('(30000,10000)================>', savedAsistencias.length);
    // ================================================================
    filtrados = await this.recuperarDatos(40000, 10000, request, response, next);
    savedAsistencias = await this.asistencia.insertMany(filtrados, { ordered: true });
    console.log('(40000,10000)================>', savedAsistencias.length);
    // ================================================================
    filtrados = await this.recuperarDatos(50000, 10000, request, response, next);
    savedAsistencias = await this.asistencia.insertMany(filtrados, { ordered: true });
    console.log('(50000,10000)================>', savedAsistencias.length);
    // ================================================================
    filtrados = await this.recuperarDatos(60000, 10000, request, response, next);
    savedAsistencias = await this.asistencia.insertMany(filtrados, { ordered: true });
    console.log('(60000,10000)================>', savedAsistencias.length);
    response.send({
      message: 'Finalizado',
    });
  };
  private migrar = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const now = new Date();
      const hoy = new Date(moment.utc(now).format('YYYY-MM-DD'));
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
                return null;
              }
            } else {
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
          }
          return x !== null && typeof x !== 'undefined' && x.fecha !== null;
        });
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
