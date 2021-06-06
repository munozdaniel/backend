var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import mongoose from 'mongoose';
import HttpException from '../exceptions/HttpException';
import { Router } from 'express';
import calendarioModel from './calendario.model';
import calendarioOriginalModel from './calendarioOriginal.model';
import ciclolectivoModel from '../ciclolectivos/ciclolectivo.model';
import moment from 'moment';
const ObjectId = mongoose.Types.ObjectId;
import passport from 'passport';
class CalendarioController {
    constructor() {
        this.path = '/calendario';
        this.router = Router();
        this.calendario = calendarioModel;
        this.cicloLectivo = ciclolectivoModel;
        this.calendarioOriginal = calendarioOriginalModel;
        this.crearCalendarioNuevo = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const hoy = new Date(moment(now).utc().format('YYYY-MM-DD'));
            const cicloLectivoActual = yield this.cicloLectivo.findOne({ anio: moment().year() });
            const existentes = yield this.calendario.aggregate([
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
                        'cicloLectivo._id': ObjectId(cicloLectivoActual._id),
                    },
                },
            ]);
            const calendarioEliminado = yield Promise.all(existentes.map((x, index) => __awaiter(this, void 0, void 0, function* () {
                const eliminados = yield this.calendario.findByIdAndDelete(x._id);
            })));
            // Obtengo por parametro la fecha de inicio de clases
            console.log('calendarioEliminado', calendarioEliminado);
            const fechaFinal = request.body.fechaFinal;
            // cicloLectivoActual
            const calendarioNuevo = [];
            let normal = true;
            let fechaInicio = moment(request.body.fechaInicio, 'YYYY-MM-DD').utc(); // .add(-1, 'day')
            //let fechaInicio = moment(request.body.fechaInicio).utc();
            console.log('UINUI', request.body.fechaInicio);
            console.log('UINUI', fechaFinal);
            console.log('UINUI', moment(fechaFinal, 'YYYY-MM-DD').utc().isSameOrAfter(fechaInicio));
            let miercolesSi = true;
            while (moment(fechaFinal, 'YYYY-MM-DD').utc().isSameOrAfter(fechaInicio)) {
                const fechaNombre = moment.utc(fechaInicio).format('dddd').toLowerCase();
                let fecha = new Date(moment(fechaInicio).utc().format('YYYY-MM-DD'));
                if (fechaNombre === 'monday') {
                    calendarioNuevo.push({
                        cicloLectivo: cicloLectivoActual,
                        comisionA: 1,
                        comisionB: 1,
                        comisionC: 1,
                        comisionD: 1,
                        comisionE: 0,
                        comisionF: 0,
                        comisionG: 0,
                        comisionH: 0,
                        fecha,
                        fechaCreacion: hoy,
                        activo: true,
                    });
                }
                if (fechaNombre === 'tuesday') {
                    calendarioNuevo.push({
                        cicloLectivo: cicloLectivoActual,
                        comisionA: 1,
                        comisionB: 1,
                        comisionC: 1,
                        comisionD: 1,
                        comisionE: 0,
                        comisionF: 0,
                        comisionG: 0,
                        comisionH: 0,
                        fecha,
                        fechaCreacion: hoy,
                        activo: true,
                    });
                }
                if (fechaNombre === 'wednesday') {
                    calendarioNuevo.push({
                        cicloLectivo: cicloLectivoActual,
                        comisionA: miercolesSi ? 1 : 0,
                        comisionB: miercolesSi ? 1 : 0,
                        comisionC: miercolesSi ? 1 : 0,
                        comisionD: miercolesSi ? 1 : 0,
                        comisionE: !miercolesSi ? 1 : 0,
                        comisionF: !miercolesSi ? 1 : 0,
                        comisionG: !miercolesSi ? 1 : 0,
                        comisionH: !miercolesSi ? 1 : 0,
                        fecha,
                        fechaCreacion: hoy,
                        activo: true,
                    });
                }
                if (fechaNombre === 'thursday') {
                    calendarioNuevo.push({
                        cicloLectivo: cicloLectivoActual,
                        comisionA: 0,
                        comisionB: 0,
                        comisionC: 0,
                        comisionD: 0,
                        comisionE: 1,
                        comisionF: 1,
                        comisionG: 1,
                        comisionH: 1,
                        fecha,
                        fechaCreacion: hoy,
                        activo: true,
                    });
                }
                if (fechaNombre === 'friday') {
                    calendarioNuevo.push({
                        cicloLectivo: cicloLectivoActual,
                        comisionA: 0,
                        comisionB: 0,
                        comisionC: 0,
                        comisionD: 0,
                        comisionE: 1,
                        comisionF: 1,
                        comisionG: 1,
                        comisionH: 1,
                        fecha,
                        fechaCreacion: hoy,
                        activo: true,
                    });
                }
                miercolesSi = !miercolesSi;
                fechaInicio = moment(fechaInicio).utc().add(1, 'day');
                // ============
                //    fechaInicio = moment(fechaInicio).utc().add(1, 'day');
            }
            console.log('calendarioNuevo', calendarioNuevo);
            try {
                const saved = yield this.calendario.insertMany(calendarioNuevo);
                response.send({ calendarioNuevo: saved, success: true });
            }
            catch (e) {
                // [ 'errors', '_message', 'message', 'name' ]
                console.log('[ERROR]', e);
                next(new HttpException(500, 'Problemas al insertar los registros'));
            }
        });
        this.crearCalendario = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const hoy = new Date(moment(now).utc().format('YYYY-MM-DD'));
            const cicloLectivoActual = yield this.cicloLectivo.findOne({ anio: moment().year() });
            const existentes = yield this.calendario.aggregate([
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
                        'cicloLectivo._id': ObjectId(cicloLectivoActual._id),
                    },
                },
            ]);
            const calendarioEliminado = yield Promise.all(existentes.map((x, index) => __awaiter(this, void 0, void 0, function* () {
                const eliminados = yield this.calendario.findByIdAndDelete(x._id);
            })));
            // Obtengo por parametro la fecha de inicio de clases
            console.log('calendarioEliminado', calendarioEliminado);
            const fechaFinal = request.body.fechaFinal;
            // cicloLectivoActual
            const calendarioNuevo = [];
            let normal = true;
            let fechaInicio = moment(request.body.fechaInicio, 'YYYY-MM-DD').utc().add(-1, 'day');
            //let fechaInicio = moment(request.body.fechaInicio).utc();
            console.log('UINUI', request.body.fechaInicio);
            console.log('UINUI', fechaFinal);
            console.log('UINUI', moment(fechaFinal, 'YYYY-MM-DD').utc().isSameOrAfter(fechaInicio));
            let miercolesSi = true;
            while (moment(fechaFinal, 'YYYY-MM-DD').utc().isSameOrAfter(fechaInicio)) {
                if (normal) {
                    for (let i = 0; i < 3; i++) {
                        fechaInicio = moment(fechaInicio).utc().add(1, 'day');
                        if (moment(fechaFinal, 'YYYY-MM-DD').utc().isSameOrAfter(fechaInicio)) {
                            let fecha = new Date(moment(fechaInicio).utc().format('YYYY-MM-DD'));
                            const fechaNombre = moment.utc(fechaInicio).format('dddd').toLowerCase();
                            if (fechaNombre !== 'saturday' && fechaNombre !== 'sunday') {
                                calendarioNuevo.push({
                                    cicloLectivo: cicloLectivoActual,
                                    comisionA: 1,
                                    comisionB: 1,
                                    comisionC: 1,
                                    comisionD: 1,
                                    comisionE: 0,
                                    comisionF: 0,
                                    comisionG: 0,
                                    comisionH: 0,
                                    fecha,
                                    fechaCreacion: hoy,
                                    activo: true,
                                });
                            }
                        }
                    }
                    for (let i = 0; i < 2; i++) {
                        fechaInicio = moment(fechaInicio).utc().add(1, 'day');
                        if (moment(fechaFinal, 'YYYY-MM-DD').utc().isSameOrAfter(fechaInicio)) {
                            let fecha = new Date(moment(fechaInicio).utc().format('YYYY-MM-DD'));
                            const fechaNombre = moment.utc(fechaInicio).format('dddd').toLowerCase();
                            if (fechaNombre !== 'saturday' && fechaNombre !== 'sunday') {
                                calendarioNuevo.push({
                                    cicloLectivo: cicloLectivoActual,
                                    comisionA: 0,
                                    comisionB: 0,
                                    comisionC: 0,
                                    comisionD: 0,
                                    comisionE: 1,
                                    comisionF: 1,
                                    comisionG: 1,
                                    comisionH: 1,
                                    fecha,
                                    fechaCreacion: hoy,
                                    activo: true,
                                });
                            }
                        }
                    }
                }
                else {
                    for (let i = 0; i < 2; i++) {
                        fechaInicio = moment(fechaInicio).utc().add(1, 'day');
                        if (moment(fechaFinal, 'YYYY-MM-DD').utc().isSameOrAfter(fechaInicio)) {
                            let fecha = new Date(moment(fechaInicio).utc().format('YYYY-MM-DD'));
                            const fechaNombre = moment.utc(fechaInicio).format('dddd').toLowerCase();
                            if (fechaNombre !== 'saturday' && fechaNombre !== 'sunday') {
                                calendarioNuevo.push({
                                    cicloLectivo: cicloLectivoActual,
                                    comisionA: 1,
                                    comisionB: 1,
                                    comisionC: 1,
                                    comisionD: 1,
                                    comisionE: 0,
                                    comisionF: 0,
                                    comisionG: 0,
                                    comisionH: 0,
                                    fecha,
                                    fechaCreacion: hoy,
                                    activo: true,
                                });
                            }
                        }
                    }
                    for (let i = 0; i < 3; i++) {
                        fechaInicio = moment(fechaInicio).utc().add(1, 'day');
                        if (moment(fechaFinal, 'YYYY-MM-DD').utc().isSameOrAfter(fechaInicio)) {
                            let fecha = new Date(moment(fechaInicio).utc().format('YYYY-MM-DD'));
                            const fechaNombre = moment.utc(fechaInicio).format('dddd').toLowerCase();
                            if (fechaNombre !== 'saturday' && fechaNombre !== 'sunday') {
                                calendarioNuevo.push({
                                    cicloLectivo: cicloLectivoActual,
                                    comisionA: 0,
                                    comisionB: 0,
                                    comisionC: 0,
                                    comisionD: 0,
                                    comisionE: 1,
                                    comisionF: 1,
                                    comisionG: 1,
                                    comisionH: 1,
                                    fecha,
                                    fechaCreacion: hoy,
                                    activo: true,
                                });
                            }
                        }
                    }
                }
                normal = !normal;
                //    fechaInicio = moment(fechaInicio).utc().add(1, 'day');
            }
            console.log('calendarioNuevo', calendarioNuevo);
            try {
                const saved = yield this.calendario.insertMany(calendarioNuevo);
                response.send({ calendarioNuevo: saved, success: true });
            }
            catch (e) {
                // [ 'errors', '_message', 'message', 'name' ]
                console.log('[ERROR]', e);
                next(new HttpException(500, 'Problemas al insertar los registros'));
            }
        });
        this.obtenerCalendarioPorCiclo = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const ciclo = request.params.ciclo;
                const opciones = [
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
                            'cicloLectivo.anio': Number(ciclo),
                        },
                    },
                ];
                const calendario = yield this.calendario.aggregate(opciones);
                return response.send(calendario);
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Ocurrió un error interno'));
            }
        });
        this.obtenerCalendario = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const calendario = yield this.calendario.find();
                return response.send(calendario);
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Ocurrió un error interno'));
            }
        });
        this.migrar = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const now = new Date();
                const hoy = new Date(moment(now).format('YYYY-MM-DD'));
                const calendariosOriginales = yield this.calendarioOriginal.find();
                const calendariosOriginalesRefactorizados = yield Promise.all(calendariosOriginales.map((x, index) => __awaiter(this, void 0, void 0, function* () {
                    let cicloLectivo = null;
                    try {
                        cicloLectivo = yield this.cicloLectivo.findOne({
                            anio: Number(x.ciclo_lectivo),
                        });
                        if (!cicloLectivo) {
                            return null;
                        }
                    }
                    catch (ero) {
                        console.log('ero', ero);
                    }
                    const fechadate = new Date(x.fechas);
                    const fecha = new Date(moment(fechadate).format('YYYY-MM-DD'));
                    const unaCalendario = {
                        calendarioNro: index,
                        id_calendario: x.id_calendario,
                        fecha,
                        cicloLectivo: cicloLectivo,
                        comisionA: x.A,
                        comisionB: x.B,
                        comisionC: x.C,
                        comisionD: x.D,
                        comisionE: x.E,
                        comisionF: x.F,
                        comisionG: x.G,
                        comisionH: x.H,
                        fechaCreacion: hoy,
                        activo: true,
                    };
                    return unaCalendario;
                })));
                try {
                    // console.log(
                    //   "calendariosOriginalesRefactorizados",
                    //   calendariosOriginalesRefactorizados
                    // );
                    const filtrados = calendariosOriginalesRefactorizados.filter((x) => {
                        return x !== null && typeof x !== 'undefined';
                    });
                    const savedCalendarios = yield this.calendario.insertMany(filtrados);
                    response.send({
                        savedCalendarios,
                    });
                }
                catch (e) {
                    console.log('ERROR', e);
                    // response.send({
                    //   error: calendariosOriginales,
                    // });
                    next(new HttpException(500, 'Ocurrió un error al guardar las calendariosOriginales'));
                }
            }
            catch (e2) {
                console.log('ERROR', e2);
                next(new HttpException(400, 'Parametros Incorrectos'));
            }
        });
        this.initializeRoutes();
    }
    initializeRoutes() {
        console.log('CalendarioController/initializeRoutes');
        this.router.get(`${this.path}/migrar`, this.migrar);
        this.router.get(`${this.path}`, passport.authenticate('jwt', { session: false }), this.obtenerCalendario);
        this.router.get(`${this.path}/por-ciclo/:ciclo`, passport.authenticate('jwt', { session: false }), this.obtenerCalendarioPorCiclo);
        this.router.post(`${this.path}`, passport.authenticate('jwt', { session: false }), this.crearCalendarioNuevo);
    }
}
export default CalendarioController;
//# sourceMappingURL=calendario.controller.js.map