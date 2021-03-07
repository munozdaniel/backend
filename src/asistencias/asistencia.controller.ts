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
  }

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
      console.log(id);
      console.log(planillaId);
      const asistenciasAggregate = await this.asistencia.aggregate(opciones);
      console.log('asistenciasAggregate', asistenciasAggregate);
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
