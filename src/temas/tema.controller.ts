import mongoose from 'mongoose';
import HttpException from '../exceptions/HttpException';
import r, { Request, Response, NextFunction } from 'express';
import NotFoundException from '../exceptions/NotFoundException';
import Controller from '../interfaces/controller.interface';
import CreateTemaDto from './tema.dto';
import temaModel from './tema.model';
import escapeStringRegexp from 'escape-string-regexp';
import ITema from './tema.interface';
import temaOriginalModel from './temaOriginal.model';
import planillaTallerModel from '../planillaTaller/planillaTaller.model';
import moment from 'moment';
import calendarioModel from '../calendario/calendario.model';
const { Router } = r;
const ObjectId = mongoose.Types.ObjectId;

class TemaController implements Controller {
  public path = '/tema';
  public router = Router();
  private tema = temaModel;
  private calendario = calendarioModel;
  private planillaTaller = planillaTallerModel;
  private temaOriginal = temaOriginalModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    console.log('TemaController/initializeRoutes');
    this.router.get(`${this.path}/migrar`, this.migrar);
    this.router.get(`${this.path}/por-planilla/:id`, this.obtenerTemaPorPlanillaTaller);
    // this.router.post(`${this.path}/temas-calendario`, this.obtenerTemasCalendario);
    this.router.post(`${this.path}/temas-calendario`, this.obtenerCalendarioPorTipoMateria);
    this.router.put(`${this.path}`, this.guardarTema);
    this.router.patch(`${this.path}/:id`, this.actualizarTema);
    this.router.delete(`${this.path}/:id`, this.eliminar);
    this.router.post(`${this.path}/informe-por-planilla`, this.informeTemasPorPlanillaTaller);
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
  private informeTemasPorPlanillaTaller = async (request: Request, response: Response, next: NextFunction) => {
    const planilla = request.body.planillaTaller;
    let fechaInicio: Date = new Date(moment.utc(planilla.fechaInicio).format('YYYY-MM-DD'));
    const fechaFinalizacion: Date = new Date(moment.utc(planilla.fechaFinalizacion).format('YYYY-MM-DD'));
    // Obtenemos el calendario
    const calendario = await this.obtenerCalendarioEntreFechas(fechaInicio, fechaFinalizacion);
    const temasPorFecha = await Promise.all(
      calendario.map(async (x: any) => {
        const f: any = new Date(moment.utc(x.fecha).format('YYYY-MM-DD'));
        const opciones: any[] = [
          {
            $match: {
              planillaTaller: ObjectId(planilla._id),
              fecha: f,
            },
          },
        ];
        const temas = await this.tema.aggregate(opciones);
        if (temas && temas.length > 0) {
          return {
            fecha: moment.utc(x.fecha).format('DD/MM/YYYY'),
            temaNro: temas[0].temaNro,
            temaDelDia: temas[0].temaDelDia,
            tipoDesarrollo: temas[0].tipoDesarrollo,
            temasProximaClase: temas[0].temasProximaClase,
            unidad: temas[0].unidad,
            caracterClase: temas[0].caracterClase,
            observacionJefe: temas[0].observacionJefe,
            encontrada: true,
          };
        } else {
          return {
            fecha: moment.utc(x.fecha).format('DD/MM/YYYY'),
            temaNro: '',
            temaDelDia: 'No registra tema',
            tipoDesarrollo: null,
            temasProximaClase: null,
            unidad: null,
            caracterClase: null,
            observacionJefe: null,
            encontrada: false,
          };
        }
      })
    );
    return response.send({ temasPorFecha });
  };
  private obtenerCalendarioPorTipoMateria = async (request: Request, response: Response, next: NextFunction) => {
    const now = new Date();
    const hoy = new Date(moment(now).format('YYYY-MM-DD'));
    const tipo = escapeStringRegexp(request.body.tipo);
    const planillaId = request.body.planillaId;
    try {
      const temas = await this.tema.find({ planillaTaller: ObjectId(planillaId) });
      const opcionesP: any = [
        {
          $lookup: {
            from: 'cursos',
            localField: 'curso',
            foreignField: '_id',
            as: 'curso',
          },
        },
        {
          $unwind: {
            path: '$curso',
          },
        },
        {
          $match: {
            _id: ObjectId(planillaId),
          },
        },
      ];
      const planillaAggregate = await this.planillaTaller.aggregate(opcionesP);
      try {
        if (!planillaAggregate || planillaAggregate.length < 1) {
          return next(new HttpException(400, 'Parametros Incorrectos'));
        }
        const planilla = planillaAggregate[0];

        // Obtener calendario de taller
        if (tipo.toString() === 'TALLER') {
          let matchComision: any = null;
          switch (planilla.curso.comision) {
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
                'cicloLectivo._id': ObjectId(planilla.cicloLectivo._id),
                fecha: {
                  $gte: planilla.fechaInicio, // funciona sin isodate
                  $lt: planilla.fechaFinalizacion, // funciona sin isodate
                },
                ...matchComision,
              },
            },
          ];
          // Calendario por Comision
          const calendario = await this.calendario.aggregate(opciones);
          const temasARetornar: ITema[] & any = await Promise.all(
            calendario.map((x) => {
              const index = temas.findIndex((i) => {
                return moment(i.fecha, 'YYYY-MM-DD').utc().isSame(moment(x.fecha, 'YYYY-MM-DD').utc());
              });
              if (index === -1) {
                return {
                  planillaTaller: planilla,
                  fecha: x.fecha,
                  activo: true,
                  fechaCreacion: hoy,
                };
              } else {
                return {
                  _id: temas[index]._id,
                  temaNro: temas[index].temaNro,
                  temaDelDia: temas[index].temaDelDia,
                  tipoDesarrollo: temas[index].tipoDesarrollo,
                  temasProximaClase: temas[index].temasProximaClase,
                  nroClase: temas[index].nroClase,
                  unidad: temas[index].unidad,
                  caracterClase: temas[index].caracterClase,
                  observacionJefe: temas[index].observacionJefe,
                  planillaTaller: planilla,
                  fecha: x.fecha,
                  activo: true,
                  fechaCreacion: hoy,
                };
              }
            })
          );
          try {
            // const temasSaved = await this.tema.insertMany(temasInsertar);
            response.send({ status: 200, message: 'Calendario Academico (Taller)', temasDelCalendario: temasARetornar });
          } catch (error) {
            console.log('[ERROR]', error);
            next(new HttpException(500, 'Error Interno al insertar los temas'));
          }
        }
        // Cargar todos los dias
        if (tipo.toString().toUpperCase() === 'MATERIAS' || tipo.toString().toUpperCase() === 'AULA') {
          let fechaInicio = moment(planilla.fechaInicio, 'YYYY-MM-DD').utc();
          let fechaFinal = moment(planilla.fechaFinalizacion, 'YYYY-MM-DD').utc();
          const calendarioMaterias = [];
          while (fechaFinal.isSameOrAfter(fechaInicio)) {
            const index = temas.findIndex((i) => {
              return moment(i.fecha, 'YYYY-MM-DD').utc().isSame(moment(fechaInicio, 'YYYY-MM-DD').utc());
            });
            if (index === -1) {
              calendarioMaterias.push({
                planillaTaller: planilla,
                fecha: fechaInicio,
                activo: true,
                fechaCreacion: hoy,
              });
            } else {
              calendarioMaterias.push({
                _id: temas[index]._id,
                temaNro: temas[index].temaNro,
                temaDelDia: temas[index].temaDelDia,
                tipoDesarrollo: temas[index].tipoDesarrollo,
                temasProximaClase: temas[index].temasProximaClase,
                nroClase: temas[index].nroClase,
                unidad: temas[index].unidad,
                caracterClase: temas[index].caracterClase,
                observacionJefe: temas[index].observacionJefe,
                planillaTaller: planilla,
                fecha: fechaInicio,
                activo: true,
                fechaCreacion: hoy,
              });
            }

            fechaInicio = moment(fechaInicio).utc().add(1, 'day');
          }
          // const temasSaved = await this.tema.insertMany(calendarioMaterias);
          response.send({ status: 200, message: 'Calendario Academico (Aulas)', temasDelCalendario: calendarioMaterias });
        }
      } catch (error) {
        console.log('[ERROR]', error);
        next(new HttpException(500, 'Error Interno al recuperar los temas'));
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Error Interno al recuperar la planilla'));
    }
  };
  private obtenerTemasCalendario = async (request: Request, response: Response, next: NextFunction) => {
    const now = new Date();
    const hoy = new Date(moment(now).format('YYYY-MM-DD'));
    const tipo = escapeStringRegexp(request.body.tipo);
    try {
      const planillaId = request.body.planillaId;
      console.log('planillaId', planillaId);

      const opcionesP: any = [
        {
          $lookup: {
            from: 'cursos',
            localField: 'curso',
            foreignField: '_id',
            as: 'curso',
          },
        },
        {
          $unwind: {
            path: '$curso',
          },
        },
        {
          $match: {
            _id: ObjectId(planillaId),
          },
        },
      ];
      const planillaAggregate = await this.planillaTaller.aggregate(opcionesP);
      try {
        if (!planillaAggregate || planillaAggregate.length < 1) {
          return next(new HttpException(400, 'Parametros Incorrectos'));
        }
        const planilla = planillaAggregate[0];

        // Obtener calendario de taller
        if (tipo.toString() === 'TALLER') {
          let matchComision: any = null;
          switch (planilla.curso.comision) {
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
                'cicloLectivo._id': ObjectId(planilla.cicloLectivo._id),
                fecha: {
                  $gte: planilla.fechaInicio, // funciona sin isodate
                  $lt: planilla.fechaFinalizacion, // funciona sin isodate
                },
                ...matchComision,
              },
            },
          ];

          const calendario = await this.calendario.aggregate(opciones);
          const temasInsertar: ITema[] & any = await Promise.all(
            calendario.map((x) => {
              return {
                planillaTaller: planilla,
                fecha: x.fecha,
                activo: true,
                fechaCreacion: hoy,
              };
            })
          );
          try {
            // const temasSaved = await this.tema.insertMany(temasInsertar);
            response.send({ status: 200, message: 'Calendario Academico (Taller)', temasDelCalendario: temasInsertar });
          } catch (error) {
            console.log('[ERROR]', error);
            next(new HttpException(500, 'Error Interno al insertar los temas'));
          }
        }
        // Cargar todos los dias
        if (tipo.toString() === 'MATERIAS') {
          let fechaInicio = moment(planilla.fechaInicio, 'YYYY-MM-DD').utc();
          let fechaFinal = moment(planilla.fechaFinalizacion, 'YYYY-MM-DD').utc();
          const calendarioMaterias = [];
          while (fechaFinal.isSameOrAfter(fechaInicio)) {
            calendarioMaterias.push({
              planillaTaller: planilla,
              fecha: fechaInicio,
              activo: true,
              fechaCreacion: hoy,
            });
            fechaInicio = moment(fechaInicio).utc().add(1, 'day');
          }
          // const temasSaved = await this.tema.insertMany(calendarioMaterias);
          response.send({ status: 200, message: 'Calendario Academico (Taller)', temasDelCalendario: calendarioMaterias });
        }
      } catch (error) {
        console.log('[ERROR]', error);
        next(new HttpException(500, 'Error Interno al recuperar los temas'));
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Error Interno al recuperar la planilla'));
    }
  };
  private eliminar = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const successResponse = await this.tema.findByIdAndDelete(id);
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
  private guardarTema = async (request: Request, response: Response, next: NextFunction) => {
    const temaData: CreateTemaDto = request.body;

    const ini = new Date(moment.utc(temaData.fecha).format('YYYY-MM-DD')); // Se hace esto para que no pase al siguient dia
    temaData.fecha = ini;

    const match = {
      planillaTaller: ObjectId(temaData.planillaTaller._id),
      fecha: {
        $eq: ini.toISOString(),
      },
    };
    try {
      const updated = await this.tema.findOne(match);
      if (updated) {
        response.send({
          tema: updated,
          success: false,
          message: 'Ya existe cargado un tema en la fecha: ' + moment.utc(temaData.fecha).format('DD/MM/YYYY'),
        });
      } else {
        const created = new this.tema({
          ...temaData,
        });
        const saved = await created.save();
        const temas = await this.tema.find({ planillaTaller: ObjectId(temaData.planillaTaller._id) }).sort({ fecha: 1 });
        const renumerar = await Promise.all(
          temas.map(async (unTema, index) => {
            if (unTema.temaDelDia) {
              unTema.nroClase = index;
              return await this.tema.findByIdAndUpdate(unTema._id, { nroClase: index }, { new: true });
            } else {
              return unTema;
            }
          })
        );
        response.send({ tema: saved, success: true, message: 'Tema agregado correctamente', renumerar });
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Error Interno'));
    }
  };
  private actualizarTema = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    const tema = request.body.tema;
    // const ini = new Date(moment(tema.fecha).format('YYYY-MM-DD'));
    // tema.fecha = ini;

    try {
      let updated;
      if (id && id !== 'undefined') {
        const fechadate = new Date(tema.fecha);
        const fecha = new Date(moment.utc(fechadate).format('YYYY-MM-DD'));
        tema.fecha = fecha;
        updated = await this.tema.findByIdAndUpdate(id, tema, { new: true });
      } else {
        const fecha = new Date(moment.utc(tema.fecha).format('YYYY-MM-DD'));
        tema.fecha = fecha;
        const created = new this.tema({ ...tema });
        updated = await created.save();
      }
      // console.log('updated', updated);
      if (updated) {
        const temas = await this.tema.find({ planillaTaller: ObjectId(updated.planillaTaller._id) }).sort({ fecha: 1 });
        let numero = 0;
        const renumerar = await Promise.all(
          temas.map(async (unTema, index) => {
            if (unTema.temaDelDia) {
              numero++;
              unTema.nroClase = numero;
              return await this.tema.findByIdAndUpdate(unTema._id, { nroClase: unTema.nroClase }, { new: true });
            } else {
              return unTema;
            }
          })
        );
        response.send({ tema: updated, success: true, message: 'Tema agregado correctamente', renumerar });
      } else {
        response.send({ tema: null });
      }
    } catch (e4) {
      console.log('[ERROR], ', e4);
      next(new HttpException(500, 'Ocurrió un error interno'));
    }
  };
  private obtenerTemaPorPlanillaTaller = async (request: Request, response: Response, next: NextFunction) => {
    const id = escapeStringRegexp(request.params.id);
    try {
      const temas = await this.tema.find({ planillaTaller: ObjectId(id) });
      if (temas) {
        response.send(temas);
      } else {
        next(new NotFoundException());
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Problemas en el servidor'));
    }
  };
  private migrar = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const now = new Date();
      const hoy = new Date(moment(now).format('YYYY-MM-DD'));
      const temasOriginales: any = await this.temaOriginal.find();
      // console.log('temasOriginales>', temasOriginales);

      const temasOriginalesRefactorizados: ITema[] = await Promise.all(
        temasOriginales.map(async (x: any, index: number) => {
          let unaPlanillaTaller: any = null;
          unaPlanillaTaller = await this.planillaTaller.findOne({
            planillaTallerId: x.id_planilla_taller,
          });
          if (!unaPlanillaTaller) {
            return null;
          } else {
            let caracterClase = null;
            switch (x.CaracterClase) {
              case 'Por Dictar':
                caracterClase = 'SIN DICTAR';
                break;
              case 'Practica':
                caracterClase = 'PRACTICA';
                break;
              case 'Sin Dictar':
                caracterClase = 'SIN DICTAR';
                break;
              case 'Teorico':
                caracterClase = 'TEORICO';
                break;
              case 'Teorico-Practic':
                caracterClase = 'TEORICO-PRACTICO';
                break;

              default:
                break;
            }
            const fechadate = new Date(x.Fecha);
            const fecha = new Date(moment(fechadate).format('YYYY-MM-DD'));
            // console.log('unaPlanillaTaller', unaPlanillaTaller);
            const unaTema: ITema & any = {
              temaNro: 100 + index,
              id_planilla_temas: x.id_planilla_temas, // solo para migrar
              planillaTaller: unaPlanillaTaller,
              fecha,
              temaDelDia: x.Temas_del_dia,
              tipoDesarrollo: x.Tipo_de_desarrollo,
              temasProximaClase: x.Temas_Proxima_Clase,
              nroClase: x.NroClase,
              unidad: x.Unidad,
              caracterClase,
              observacionJefe: x.ObservacionJefe,

              fechaCreacion: hoy,
              activo: true,
            };

            return unaTema;
          }
        })
      );

      try {
        const filtrados = temasOriginalesRefactorizados.filter((x) => {
          return x !== null && typeof x !== 'undefined';
        });
        const savedTemas = await this.tema.insertMany(filtrados);
        response.send({
          savedTemas,
        });
      } catch (e) {
        console.log('ERROR', e);
        // response.send({
        //   error: temasOriginalesRefactorizados,
        // });
        next(new HttpException(500, 'Ocurrió un error al guardar las temasOriginales'));
      }
    } catch (e2) {
      console.log('ERROR', e2);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
}

export default TemaController;
