import mongoose from 'mongoose';
import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
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
import IPlanillaTaller from 'planillaTaller/planillaTaller.interface';
const ObjectId = mongoose.Types.ObjectId;
import passport from 'passport';

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
    this.router.get(`${this.path}/migrar`, this.migrar);
    this.router.get(`${this.path}/por-planilla/:id`, passport.authenticate('jwt', { session: false }), this.obtenerTemaPorPlanillaTaller);
    // this.router.post(`${this.path}/temas-calendario`, this.obtenerTemasCalendario);
    this.router.post(
      `${this.path}/temas-calendario`,
      passport.authenticate('jwt', { session: false }),
      this.obtenerCalendarioPorTipoMateria
    );
    this.router.put(`${this.path}`, passport.authenticate('jwt', { session: false }), this.guardarTema);
    this.router.patch(`${this.path}/:id`, passport.authenticate('jwt', { session: false }), this.actualizarTema);
    this.router.delete(`${this.path}/:id`, passport.authenticate('jwt', { session: false }), this.eliminar);
    this.router.post(
      `${this.path}/informe-por-planilla`,
      passport.authenticate('jwt', { session: false }),
      this.informeTemasPorPlanillaTaller
    );
    this.router.post(`${this.path}/eliminar-temas`, passport.authenticate('jwt', { session: false }), this.eliminarTemas);
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
    const now = new Date();
    const hoy = new Date(moment(now).format('YYYY-MM-DD'));
    const planilla = request.body.planillaTaller;
    const opciones: any[] = [
      {
        $match: {
          planillaTaller: ObjectId(planilla._id),
          // caracterClase: { $ne: null },
        },
      },
    ];
    const temas = await this.tema.aggregate(opciones);
    let totalClases = temas.length;
    let totalClasesDictadas = 0;
    if (temas && temas.length > 0) {
      const temasDictados = await Promise.all(
        temas.map((x) => {
          if (x.caracterClase) {
            if (x.caracterClase !== 'SIN DICTAR') {
              totalClasesDictadas++;
            }
            return x;
          }
        })
      );
      return response.send({ temasPorFecha: temasDictados.filter((x) => x), totalClases, totalClasesDictadas });
    }
    return response.send({ temasPorFecha: [], totalClases, totalClasesDictadas });

    // let fechaInicio: Date = new Date(moment.utc(planilla.fechaInicio).format('YYYY-MM-DD'));
    // const fechaFinalizacion: Date = new Date(moment.utc(planilla.fechaFinalizacion).format('YYYY-MM-DD'));
    // // Obtenemos el calendario
    // const calendario = await this.obtenerCalendarioEntreFechas(fechaInicio, fechaFinalizacion);
    // const temasPorFecha = await Promise.all(
    //   calendario.map(async (x: any) => {
    //     const f: any = new Date(moment.utc(x.fecha).format('YYYY-MM-DD'));
    //     const opciones: any[] = [
    //       {
    //         $match: {
    //           planillaTaller: ObjectId(planilla._id),
    //           fecha: f,
    //         },
    //       },
    //     ];
    //     const temas = await this.tema.aggregate(opciones);
    //     if (temas && temas.length > 0) {
    //       return {
    //         fecha: moment.utc(x.fecha).format('DD/MM/YYYY'),
    //         temaNro: temas[0].temaNro,
    //         temaDelDia: temas[0].temaDelDia,
    //         tipoDesarrollo: temas[0].tipoDesarrollo,
    //         temasProximaClase: temas[0].temasProximaClase,
    //         unidad: temas[0].unidad,
    //         caracterClase: temas[0].caracterClase,
    //         observacionJefe: temas[0].observacionJefe,
    //         encontrada: true,
    //       };
    //     } else {
    //       return {
    //         fecha: moment.utc(x.fecha).format('DD/MM/YYYY'),
    //         temaNro: '',
    //         temaDelDia: 'No registra tema',
    //         tipoDesarrollo: null,
    //         temasProximaClase: null,
    //         unidad: null,
    //         caracterClase: null,
    //         observacionJefe: null,
    //         encontrada: false,
    //       };
    //     }
    //   })
    // );
    // return response.send({ temasPorFecha });
  };

  async calendarioTaller(temas: ITema[], planilla: IPlanillaTaller) {
    let total = 0;
    const now = new Date();
    const hoy = new Date(moment(now).format('YYYY-MM-DD'));
    const calendarioVisual: any[] = []; // para mostrar el calendario en pantalla
    let colorComision: { color: string }; // para mostrar el calendario en pantalla
    let matchComision: any = null;
    switch (planilla.curso.comision) {
      case 'A':
        colorComision = { color: 'rgb(0, 153, 255)' };
        matchComision = {
          comisionA: 1,
        };
        break;
      case 'B':
        colorComision = { color: 'rgb(0, 255, 106)' };
        matchComision = {
          comisionB: 1,
        };
        break;
      case 'C':
        colorComision = { color: 'rgb(187, 255, 0)' };
        matchComision = {
          comisionC: 1,
        };
        break;
      case 'D':
        colorComision = { color: 'rgb(255, 208, 0)' };
        matchComision = {
          comisionD: 1,
        };
        break;
      case 'E':
        colorComision = { color: 'rgb(255, 94, 0);' };
        matchComision = {
          comisionE: 1,
        };
        break;
      case 'F':
        colorComision = { color: 'rgb(255, 0, 0);' };
        matchComision = {
          comisionF: 1,
        };
        break;
      case 'G':
        colorComision = { color: 'rgb(255, 0, 128)' };
        matchComision = {
          comisionG: 1,
        };
        break;
      case 'H':
        colorComision = { color: 'rgb(55, 0, 255)' };
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
          const unCalendario = {
            fecha: x.fecha,
            cicloLectivo: planilla.cicloLectivo,
            activo: true,
            titulo: 'SIN DEFINIR',
            color: 'rgb(66 66 66)',
          };
          calendarioVisual.push(unCalendario);
          return {
            planillaTaller: planilla,
            fecha: x.fecha,
            activo: true,
            fechaCreacion: hoy,
          };
        } else {
          // Existe un tema
          total++;
          const unCalendario = {
            fecha: x.fecha,
            cicloLectivo: planilla.cicloLectivo,
            activo: true,
            titulo: temas[index].temaDelDia
              ? temas[index].temaDelDia
              : temas[index].motivoSinDictar
              ? 'MOTIVO POR EL CUAL NO SE DICTÓ LA CLASE: ' + temas[index].motivoSinDictar
              : 'SIN DEFINIR',
            ...colorComision,
          };
          calendarioVisual.push(unCalendario);
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
            motivoSinDictar: temas[index].motivoSinDictar,
            planillaTaller: planilla,
            fecha: x.fecha,
            activo: true,
            fechaCreacion: temas[index].fechaCreacion,
          };
        }
      })
    );
    return { temas: temasARetornar, total, calendario: calendarioVisual };
  }
  async calendarioSinCriterio(temas: ITema[], planilla: IPlanillaTaller) {
    const calendarioVisual: any[] = []; // para mostrar el calendario en pantalla
    const temasCalendario = await Promise.all(
      temas.map((x) => {
        const cal = {
          fecha: x.fecha,
          cicloLectivo: planilla.cicloLectivo,
          activo: true,
          titulo: x.temaDelDia
            ? x.temaDelDia
            : x.motivoSinDictar
            ? 'MOTIVO POR EL CUAL NO SE DICTÓ LA CLASE: ' + x.motivoSinDictar
            : 'SIN DEFINIR',
          color: 'rgb(55, 0, 255)',
        };
        calendarioVisual.push(cal);
        return {
          _id: x._id,
          temaNro: x.temaNro,
          temaDelDia: x.temaDelDia,
          tipoDesarrollo: x.tipoDesarrollo,
          temasProximaClase: x.temasProximaClase,
          nroClase: x.nroClase,
          unidad: x.unidad,
          caracterClase: x.caracterClase,
          observacionJefe: x.observacionJefe,
          motivoSinDictar: x.motivoSinDictar,
          planillaTaller: planilla,
          fecha: x.fecha,
          activo: true,
          fechaCreacion: x.fechaCreacion,
        };
      })
    );
    return { total: temasCalendario.length, temas: temasCalendario, calendario: calendarioVisual };
  }
  /**
   * Recorremos desde la fecha inicial a la final
   * En el bucle, por cada dia, verificamos si existe el tema...
   * Si existe, entoces agregamos la fecha con tema al retorno
   * Si no existe, y pertenece al arreglo de dias entonces la agregamos al arreglo de retorno como una fecha vacia.
   * @param temas
   * @param planilla
   * @returns
   */
  async calendarioAulas(temas: ITema[], planilla: IPlanillaTaller) {
    const calendarioVisual: any[] = []; // para mostrar el calendario en pantalla
    let total = 0;
    const now = new Date();
    const hoy = new Date(moment(now).format('YYYY-MM-DD'));
    let fechaInicio = moment(planilla.fechaInicio, 'YYYY-MM-DD').utc();
    let fechaFinal = moment(planilla.fechaFinalizacion, 'YYYY-MM-DD').utc();
    const calendarioMaterias = [];
    while (fechaFinal.isSameOrAfter(fechaInicio)) {
      // Buscamos si este dia (fechaInicio) fue agregado en el libro de temas y lo devolvemos
      const index = temas.findIndex((i) => {
        return moment(i.fecha, 'YYYY-MM-DD').utc().isSame(moment(fechaInicio, 'YYYY-MM-DD').utc());
      });
      if (index === -1) {
        // Si no fue agregado al libro de temas, verificamos si existen en el arreglo de dias de la planilla
        const diasHabilitados: string[] = planilla.diasHabilitados;
        const nombreDelDia = moment.utc(fechaInicio).format('dddd');
        const index2 = diasHabilitados.findIndex((d) => d.toString() === nombreDelDia.toString());
        if (index2 !== -1) {
          // Agrego al calendarioVisual
          const unCalendario = {
            fecha: fechaInicio,
            cicloLectivo: planilla.cicloLectivo,
            activo: true,
            titulo: 'SIN DEFINIR',
            color: 'rgb(66 66 66)',
          };
          calendarioVisual.push(unCalendario);
          //
          calendarioMaterias.push({
            planillaTaller: planilla,
            fecha: fechaInicio,
            activo: true,
            fechaCreacion: hoy,
          });
        }
      } else {
        total++;
        // Agrego al calendarioVisual
        const unCalendario = {
          fecha: fechaInicio,
          cicloLectivo: planilla.cicloLectivo,
          activo: true,
          titulo: temas[index].temaDelDia
            ? temas[index].temaDelDia
            : temas[index].motivoSinDictar
            ? 'MOTIVO POR EL CUAL NO SE DICTÓ LA CLASE: ' + temas[index].motivoSinDictar
            : 'SIN DEFINIR',
          color: 'rgb(25 162 0)',
        };
        calendarioVisual.push(unCalendario);
        //
        calendarioMaterias.push({
          _id: temas[index]._id,
          temaNro: temas[index].temaNro,
          temaDelDia: temas[index].temaDelDia,
          tipoDesarrollo: temas[index].tipoDesarrollo,
          temasProximaClase: temas[index].temasProximaClase,
          nroClase: temas[index].nroClase,
          unidad: temas[index].unidad,
          motivoSinDictar: temas[index].motivoSinDictar,
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
    return { total, temas: calendarioMaterias, calendario: calendarioVisual };
  }
  /**
   * Obtiene los temas y el calendario
   * 1. Si es por comision
   * 2. Si es personalizado (por arreglo de dias)
   * 3. Ninguno de los dos, solo trae los temas que ya tiene ingresado.
   * *Importante: Si ya tiene los temas ingresado y los modifica debe traer
   * los temas que trajo mas si es por comision o personalizado
   * @param request
   * @param response
   * @param next
   * @returns totalDeClases, temas (completados), calendario
   */
  private obtenerCalendarioPorTipoMateria = async (request: Request, response: Response, next: NextFunction) => {
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
        if (!planilla.tipoCalendario) {
          // Solo devuelvo los temas que tenga cargado
          const retornoSinCriterio: any = await this.calendarioSinCriterio(temas, planilla);
          response.send({
            status: 200,
            message: 'Calendario Academico (Taller)',
            totalClases: retornoSinCriterio.total,
            temas: retornoSinCriterio.temas,
            calendario: retornoSinCriterio.calendario,
          });
        } else {
          if (planilla.tipoCalendario === 'POR COMISION') {
            //   Obtiene el calendario por la comision (seria calendario de taller)
            try {
              const retornoTaller: any = await this.calendarioTaller(temas, planilla);
              response.send({
                status: 200,
                message: 'Calendario Academico (Taller)',
                totalClases: retornoTaller.total,
                temas: retornoTaller.temas,
                calendario: retornoTaller.calendario,
              });
            } catch (errorTaller) {
              console.log('[ERROR]', errorTaller);
              next(new HttpException(500, 'Error Interno al recuperar los temas del taller'));
            }
          } else {
            //   Es un calendario personalizado, busca todos los dias seleccionados entre las fechas de ini y fin. Y los temas que contengan esas fechas
            try {
              const retornoAula: any = await this.calendarioAulas(temas, planilla);
              response.send({
                status: 200,
                message: 'Calendario Academico (Aula)',
                totalClases: retornoAula.total,
                temas: retornoAula.temas,
                calendario: retornoAula.calendario,
              });
            } catch (errorAula) {
              console.log('[ERROR]', errorAula);
              next(new HttpException(500, 'Error Interno al recuperar los temas del aula'));
            }
          }
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
        if (tipo.toString() === 'AULAS' || tipo.toString() === 'MATERIAS') {
          let fechaInicio = moment(planilla.fechaInicio, 'YYYY-MM-DD').utc();
          let fechaFinal = moment(planilla.fechaFinalizacion, 'YYYY-MM-DD').utc();
          const calendarioMaterias = [];
          while (fechaFinal.isSameOrAfter(fechaInicio)) {
            // TODO: Si fechaInicio pertenece al grupo de dias lo agrego
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
  private eliminarTemas = async (request: Request, response: Response, next: NextFunction) => {
    const temas = request.body.temas;
    try {
      const eliminados = await Promise.all(
        temas.map(async (x: any) => {
          return await this.tema.findByIdAndDelete(x._id);
        })
      );
      if (eliminados) {
        response.send({
          status: 200,
          success: true,
          message: 'Operación Exitosa',
        });
      } else {
        response.send({
          status: 200,
          success: false,
          message: 'No se eliminó ningun tema',
        });
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
