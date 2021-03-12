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
var isodate = require('isodate');
const ObjectId = require('mongoose').Types.ObjectId;
class AsistenciaController implements Controller {
  public path = '/asistencia';
  public router = Router();
  private asistencia = asistenciaModel;
  private planillaTaller = planillaTallerModel;
  private alumno = alumnoModel;
  private asistenciaOriginal = asistenciaOriginalModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    console.log('AsistenciaController/initializeRoutes');
    this.router.get(`${this.path}/migrar`, this.migrarMultiples);
    this.router.post(`${this.path}/por-alumno/:id`, this.obtenerAsistenciasPorAlumnoId);
    this.router.post(`${this.path}/por-alumno-curso`, this.obtenerAsistenciasPorAlumnosCurso);
    this.router.get(`${this.path}/por-planilla/:id`, this.obtenerAsistenciasPorPlanilla);
    this.router.put(`${this.path}`, this.guardarAsistencia);
    this.router.patch(`${this.path}/:id`, this.actualizarAsistencia);
  }

  private guardarAsistencia = async (request: Request, response: Response, next: NextFunction) => {
    const asistencia = request.body.asistencia;
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
        },
      },
      {
        $match: {
          'alumno._id': ObjectId(asistencia.alumno._id),
          'planillaTaller._id': ObjectId(asistencia.planillaTaller._id),
          fecha: isodate(asistencia.fecha.toString()),
        },
      },
    ];
    const asistenciaRepetida = await this.asistencia.aggregate(opciones);
    console.log('¿asistencia', asistenciaRepetida);
    console.log('opciones', opciones);
    if (asistenciaRepetida && asistenciaRepetida.length > 0) {
      const updated = await this.asistencia.findByIdAndUpdate(asistenciaRepetida[0]._id, asistencia, { new: true });
      console.log('updated', updated);
      if (updated) {
        response.send({ asistencia: updated });
      } else {
        response.send({ asistencia: null });
      }
    } else {
      const created = new this.asistencia({ ...asistencia });
      try {
        const saved = await created.save();
        if (saved) {
          response.send({ asistencia: saved });
        } else {
          response.send({ asistencia: null });
        }
      } catch (e4) {
        console.log('[ERROR], ', e4);
        next(new HttpException(500, 'Ocurrió un error interno'));
      }
    }
  };
  private actualizarAsistencia = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    console.log('id', id);
    const asistencia = request.body.asistencia;
    try {
      const updated = await this.asistencia.findByIdAndUpdate(id, asistencia, { new: true });
      console.log('updated', updated);
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
    console.log('opciones', opciones);
    const asistencias = await this.asistencia.aggregate(opciones);
    console.log(asistencias);
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
    console.log('opciones', opciones);
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
    console.log('id', id);
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

        const unaAsistencia: IAsistencia & any = {
          id_planilla_de_asistencia: x.id_planilla_de_asistencia, // solo para migrar
          planillaTaller: planillataller,
          alumno: alumno,
          fecha: x.Fecha,
          presente: x.Presente === 'SI' ? true : false,
          llegoTarde: x.LlegoTarde === 'SI' ? true : false,

          fechaCreacion: new Date(),
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

            fechaCreacion: new Date(),
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
