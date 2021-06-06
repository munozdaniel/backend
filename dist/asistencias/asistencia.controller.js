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
import asistenciaModel from './asistencia.model';
import escapeStringRegexp from 'escape-string-regexp';
import asistenciaOriginalModel from './asistenciaOriginal.model';
import planillaTallerModel from '../planillaTaller/planillaTaller.model';
import alumnoModel from '../alumnos/alumno.model';
import NotFoundException from '../exceptions/NotFoundException';
import moment from 'moment';
import calendarioModel from '../calendario/calendario.model';
import * as _ from 'lodash';
import passport from 'passport';
const ObjectId = mongoose.Types.ObjectId;
class AsistenciaController {
    constructor() {
        this.path = '/asistencia';
        this.router = Router();
        this.asistencia = asistenciaModel;
        this.planillaTaller = planillaTallerModel;
        this.alumno = alumnoModel;
        this.asistenciaOriginal = asistenciaOriginalModel;
        this.calendario = calendarioModel;
        this.buscarAsistenciasPorFechaYPlanilla = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const alumnos = request.body.alumnos;
            const planilla = request.body.planilla;
            const fecha = request.body.fecha;
            const f = new Date(moment.utc(fecha).format('YYYY-MM-DD'));
            const opciones = [
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
            const asistencias = yield this.asistencia.aggregate(opciones);
            return response.send(asistencias);
        });
        this.obtenerAsistenciasHoyPorPlanilla = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const alumnos = request.body.alumnos;
            const planilla = request.body.planilla;
            const now = new Date();
            const hoy = new Date(moment(now).format('YYYY-MM-DD'));
            const opciones = [
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
            const asistencias = yield this.asistencia.aggregate(opciones);
            return response.send(asistencias);
        });
        this.tomarAsistenciaPorPlanilla = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const alumnos = request.body.alumnos;
            const planilla = request.body.planilla;
            // const now = new Date();
            // const hoy = new Date(moment(now).format('YYYY-MM-DD'));
            const fecha = request.body.fecha;
            const f = new Date(moment.utc(fecha).format('YYYY-MM-DD'));
            const opciones = [
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
            const asistencias = yield this.asistencia.aggregate(opciones);
            if (asistencias && asistencias.length > 0) {
                // Ya existen... deberia comprobar cuales y pisarlas
                const actualizarAsistencias = yield Promise.all(alumnos.map((alumno) => __awaiter(this, void 0, void 0, function* () {
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
                    const updated = yield this.asistencia.findOneAndUpdate({ fecha: f, planillaTaller: planilla._id, alumno: alumno._id }, asistencia, {
                        new: true,
                        upsert: true,
                    });
                    return updated;
                })));
                response.send({
                    actualizarAsistencias,
                });
                // const interseccion = _.intersectionWith(
                //   alumnos,
                //   asistencias,
                //   (al: IAlumno, asis: IAsistencia) => ObjectId(al._id.toString()) === ObjectId(asis.alumno.toString())
                // );
            }
            else {
                const nuevasAsistencias = yield Promise.all(alumnos.map((alumno) => ({
                    planillaTaller: planilla,
                    alumno: alumno,
                    fecha: f,
                    presente: alumno.presente,
                    ausentePermitido: alumno.ausentePermitido,
                    llegoTarde: alumno.tarde,
                    fechaCreacion: f,
                    activo: true,
                })));
                const saved = yield this.asistencia.insertMany(nuevasAsistencias);
                response.send({
                    saved,
                });
            }
        });
        this.buscarInasistencias = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const turno = request.body.turno;
            let desde = new Date(moment.utc(request.body.desde).format('YYYY-MM-DD'));
            let hasta = new Date(moment.utc(request.body.hasta).format('YYYY-MM-DD'));
            let match;
            if (request.body.hasta) {
                match = {
                    $gte: desde,
                    $lt: hasta,
                };
            }
            else {
                match = {
                    $eq: desde,
                };
            }
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
                            preserveNullAndEmptyArrays: false,
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
                    {
                        $match: {
                            presente: false,
                            fecha: match,
                            'planillaTaller.turno': turno,
                        },
                    },
                ];
                const alumnosInasistentes = yield this.asistencia.aggregate(opciones);
                const alumnosNoRegistrados = [];
                const alumnos = [];
                yield Promise.all(alumnosInasistentes.map((x) => __awaiter(this, void 0, void 0, function* () {
                    const index = yield x.alumno.adultos.findIndex((y) => y.email);
                    let email = null;
                    if (index !== -1) {
                        email = x.alumno.adultos[index].email;
                        alumnos.push(Object.assign(Object.assign({}, x), { email, nombreAdulto: x.alumno.adultos[index].nombreCompleto }));
                    }
                    else {
                        alumnosNoRegistrados.push(x);
                    }
                })));
                response.send({ alumnosMerge: alumnosInasistentes, alumnos, alumnosNoRegistrados: alumnosNoRegistrados });
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Problemas interno'));
            }
        });
        this.buscarAsistenciasPorFechas = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const turno = request.body.turno;
            let desde = new Date(moment.utc(request.body.desde).format('YYYY-MM-DD'));
            let hasta = new Date(moment.utc(request.body.hasta).format('YYYY-MM-DD'));
            let match;
            if (request.body.hasta) {
                match = {
                    $gte: desde,
                    $lt: hasta,
                };
            }
            else {
                match = {
                    $eq: desde,
                };
            }
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
                            preserveNullAndEmptyArrays: false,
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
                    {
                        $match: {
                            fecha: match,
                            presente: false,
                            'planillaTaller.turno': turno,
                        },
                    },
                    {
                        $sort: {
                            fecha: 1,
                        },
                    },
                ];
                const alumnosInasistentes = yield this.asistencia.aggregate(opciones);
                response.send({ alumnos: alumnosInasistentes });
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Problemas interno'));
            }
        });
        this.informeAsistenciasPorPlanilla = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const planilla = request.body.planillaTaller;
            let fechaInicio = new Date(moment.utc(planilla.fechaInicio).format('YYYY-MM-DD'));
            const fechaFinalizacion = new Date(moment.utc(planilla.fechaFinalizacion).format('YYYY-MM-DD'));
            // Obtenemos el calendario
            const calendario = yield this.obtenerCalendarioEntreFechas(fechaInicio, fechaFinalizacion);
            // Obtenemos los alumnos
            const { curso, comision, division } = planilla.curso;
            const alumnos = yield this.obtenerAlumnosPorCCD(planilla.cicloLectivo.anio, curso, comision, division);
            //
            let totalAsistencias = 0;
            let totalAusentes = 0;
            const asistenciasPorAlumno = yield Promise.all(alumnos.map((alumno) => __awaiter(this, void 0, void 0, function* () {
                const asistenciasArray = yield Promise.all(calendario.map((x) => __awaiter(this, void 0, void 0, function* () {
                    const f = new Date(moment.utc(x.fecha).format('YYYY-MM-DD'));
                    const opciones = [
                        {
                            $match: {
                                planillaTaller: ObjectId(planilla._id),
                                alumno: ObjectId(alumno._id),
                                fecha: f,
                            },
                        },
                    ];
                    const asistencias = yield this.asistencia.aggregate(opciones);
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
                    }
                    else {
                        // totalAsistencias += asistencias[0].presente ? 1 : 0;
                        // totalAusentes += !asistencias[0].presente ? 1 : 0;
                        return {
                            // legajo: alumno.legajo,
                            // alumnoId: alumno._id,
                            // alumnoNombre: alumno.nombreCompleto,
                            tarde: null,
                            presente: null,
                            fecha: moment.utc(x.fecha).format('DD/MM/YYYY'),
                            encontrada: false,
                        };
                    }
                })));
                return {
                    legajo: alumno.legajo,
                    alumnoId: alumno._id,
                    alumnoNombre: alumno.nombreCompleto,
                    asistenciasArray,
                    totalAsistencias,
                    totalAusentes,
                };
            })));
            return response.send({ asistenciasPorAlumno, calendario, alumnos });
        });
        // TODO: General
        this.informeAsistenciasGeneral = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const planilla = request.body.planillaTaller;
                let fechaInicio = new Date(moment.utc(planilla.fechaInicio).format('YYYY-MM-DD'));
                const fechaFinalizacion = new Date(moment.utc(planilla.fechaFinalizacion).format('YYYY-MM-DD'));
                // Obtenemos el calendario
                const calendario = yield this.obtenerCalendarioEntreFechas(fechaInicio, fechaFinalizacion);
                // Obtenemos los alumnos
                const { curso, comision, division } = planilla.curso;
                const alumnos = yield this.obtenerAlumnosPorCCD(planilla.cicloLectivo.anio, curso, comision, division);
                // =================================
                const asistenciasPorAlumno = yield Promise.all(alumnos.map((alumno) => __awaiter(this, void 0, void 0, function* () {
                    const asistenciasArray = yield Promise.all(calendario.map((x) => __awaiter(this, void 0, void 0, function* () {
                        const f = new Date(moment.utc(x.fecha).format('YYYY-MM-DD'));
                        const opciones = [
                            {
                                $match: {
                                    planillaTaller: ObjectId(planilla._id),
                                    alumno: ObjectId(alumno._id),
                                    fecha: f,
                                },
                            },
                        ];
                        const asistencias = yield this.asistencia.aggregate(opciones);
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
                        }
                        else {
                            // totalAsistencias += asistencias[0].presente ? 1 : 0;
                            // totalAusentes += !asistencias[0].presente ? 1 : 0;
                            return {
                                // legajo: alumno.legajo,
                                // alumnoId: alumno._id,
                                // alumnoNombre: alumno.nombreCompleto,
                                tarde: '-',
                                presente: '-',
                                fecha: moment.utc(x.fecha).format('DD/MM/YYYY'),
                                encontrada: false,
                            };
                        }
                    })));
                    return {
                        legajo: alumno.legajo,
                        alumnoId: alumno._id,
                        alumnoNombre: alumno.nombreCompleto,
                        asistenciasArray,
                    };
                })));
                // =================================
                return response.send({
                    asistenciasPorAlumno,
                    calendario,
                    alumnos,
                });
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Ocurrió un problema interno'));
            }
        });
        this.informeAsistenciasPlantillasEntreFechas = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const comision = request.body.comision;
            const fechaInicio = new Date(moment.utc(request.body.fechaInicio).format('YYYY-MM-DD'));
            // moment(request.body.fechaInicio).utc();
            const fechaFinalizacion = new Date(moment.utc(request.body.fechaFinalizacion).format('YYYY-MM-DD'));
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
                    Object.assign({}, match),
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
                const asistenciasAggregate = yield this.asistencia.aggregate(opciones);
                // Calendario. Obtener todos los dias de un calendario por planilla y comision.
                let matchComision = null;
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
                    $match: Object.assign({ fecha: {
                            $gte: fechaInicio,
                            $lt: fechaFinalizacion,
                        } }, matchComision),
                };
                const opcionesC = [
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
                    Object.assign({}, match2),
                    { $sort: { fecha: 1 } },
                ];
                const calendario = yield this.calendario.aggregate(opcionesC);
                const merge = _.chain(asistenciasAggregate)
                    // Group the elements of Array based on `color` property
                    .groupBy('alumno')
                    // `key` is group's name (color), `value` is the array of objects
                    .map((value, key) => ({ alumno: key, asistencias: value }))
                    .value();
                return response.send({ asistencias: merge, calendario, merge });
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(400, 'Parametros Incorrectos'));
            }
        });
        this.eliminar = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const successResponse = yield this.asistencia.findByIdAndDelete(id);
                if (successResponse) {
                    response.send({
                        status: 200,
                        success: true,
                        message: 'Operación Exitosa',
                    });
                }
                else {
                    next(new NotFoundException(id));
                }
            }
            catch (e) {
                console.log('[ERROR]', e);
                next(new HttpException(400, 'Parametros Incorrectos'));
            }
        });
        this.guardarAsistencia = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
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
                const updated = yield this.asistencia.findOneAndUpdate(match, asistencia, { upsert: true, new: true });
                if (updated) {
                    response.send({ asistencia: updated });
                }
                else {
                    response.send({ asistencia: null });
                }
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Error Interno'));
            }
        });
        this.actualizarAsistencia = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            const asistencia = request.body.asistencia;
            const ini = new Date(moment(asistencia.fecha).format('YYYY-MM-DD'));
            asistencia.fecha = ini;
            try {
                const updated = yield this.asistencia.findByIdAndUpdate(id, asistencia, { new: true });
                if (updated) {
                    response.send({ asistencia: updated });
                }
                else {
                    response.send({ asistencia: null });
                }
            }
            catch (e4) {
                console.log('[ERROR], ', e4);
                next(new HttpException(500, 'Ocurrió un error interno'));
            }
        });
        this.obtenerAsistenciasPorPlanilla = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            const opciones = [
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
            const asistencias = yield this.asistencia.aggregate(opciones);
            if (asistencias) {
                return response.send(asistencias);
            }
            else {
                next(new NotFoundException('asistencias'));
            }
        });
        this.obtenerAsistenciasPorAlumnosCurso = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const { curso, division, ciclo } = request.body;
            const opciones = [
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
            const alumnos = yield this.alumno.aggregate(opciones);
            if (alumnos) {
                return response.send(alumnos);
            }
            else {
                next(new NotFoundException('alumnos'));
            }
        });
        this.obtenerAsistenciasPorAlumnoId = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = escapeStringRegexp(request.params.id);
            const planillaId = escapeStringRegexp(request.body.planillaId);
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
                const asistenciasAggregate = yield this.asistencia.aggregate(opciones);
                if (asistenciasAggregate) {
                    response.send(asistenciasAggregate);
                }
                else {
                    next(new NotFoundException());
                }
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Ocurrió un error interno'));
            }
        });
        this.recuperarDatos = (skip, limit, request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const hoy = new Date(moment(now).format('YYYY-MM-DD'));
            const asistenciasOriginales = yield this.asistenciaOriginal.find().skip(skip).limit(limit);
            const asistenciasOriginalesRefactorizados = yield Promise.all(asistenciasOriginales.map((x, index) => __awaiter(this, void 0, void 0, function* () {
                let planillataller = [];
                let alumno = [];
                try {
                    planillataller = yield this.planillaTaller.findOne({
                        planillaTallerId: x.id_planilla_de_taller,
                    });
                    if (!planillataller) {
                        return null;
                    }
                }
                catch (ero) {
                    console.log('ero', ero);
                }
                try {
                    if (x.id_alumnos && x.id_alumnos !== 0) {
                        alumno = yield this.alumno.findOne({
                            alumnoId: x.id_alumnos,
                        });
                        if (!alumno) {
                            return null;
                        }
                    }
                    else {
                        return null;
                    }
                }
                catch (ero) {
                    console.log('ero', ero);
                }
                const fechadate = new Date(x.Fecha);
                const fecha = new Date(moment.utc(fechadate).format('YYYY-MM-DD'));
                const unaAsistencia = {
                    id_planilla_de_asistencia: x.id_planilla_de_asistencia,
                    planillaTaller: planillataller,
                    alumno: alumno,
                    fecha,
                    presente: x.Presente === 'SI' ? true : false,
                    llegoTarde: x.LlegoTarde === 'SI' ? true : false,
                    fechaCreacion: hoy,
                    activo: true,
                };
                return unaAsistencia;
            })));
            asistenciasOriginalesRefactorizados;
            const filtrados = asistenciasOriginalesRefactorizados.filter((x) => {
                return x !== null && typeof x !== 'undefined' && x.fecha !== null;
            });
            return filtrados;
        });
        this.migrarMultiples = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            // ================================================================
            let filtrados = yield this.recuperarDatos(0, 10000, request, response, next);
            let savedAsistencias = yield this.asistencia.insertMany(filtrados, { ordered: true });
            console.log('(0,10000)================>', savedAsistencias.length);
            // ================================================================
            filtrados = yield this.recuperarDatos(10000, 10000, request, response, next);
            savedAsistencias = yield this.asistencia.insertMany(filtrados, { ordered: true });
            console.log('(10000,10000)================>', savedAsistencias.length);
            // ================================================================
            filtrados = yield this.recuperarDatos(20000, 10000, request, response, next);
            savedAsistencias = yield this.asistencia.insertMany(filtrados, { ordered: true });
            console.log('(20000,10000)================>', savedAsistencias.length);
            // ================================================================
            filtrados = yield this.recuperarDatos(30000, 10000, request, response, next);
            savedAsistencias = yield this.asistencia.insertMany(filtrados, { ordered: true });
            console.log('(30000,10000)================>', savedAsistencias.length);
            // ================================================================
            filtrados = yield this.recuperarDatos(40000, 10000, request, response, next);
            savedAsistencias = yield this.asistencia.insertMany(filtrados, { ordered: true });
            console.log('(40000,10000)================>', savedAsistencias.length);
            // ================================================================
            filtrados = yield this.recuperarDatos(50000, 10000, request, response, next);
            savedAsistencias = yield this.asistencia.insertMany(filtrados, { ordered: true });
            console.log('(50000,10000)================>', savedAsistencias.length);
            // ================================================================
            filtrados = yield this.recuperarDatos(60000, 10000, request, response, next);
            savedAsistencias = yield this.asistencia.insertMany(filtrados, { ordered: true });
            console.log('(60000,10000)================>', savedAsistencias.length);
            response.send({
                message: 'Finalizado',
            });
        });
        this.migrar = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const now = new Date();
                const hoy = new Date(moment.utc(now).format('YYYY-MM-DD'));
                const asistenciasOriginales = yield this.asistenciaOriginal.find().limit(10000);
                // const asistenciasOriginales2: any = await this.asistenciaOriginal.find().skip(10000).limit(10000);
                // const asistenciasOriginales3: any = await this.asistenciaOriginal.find().skip(20000).limit(10000);
                // const asistenciasOriginales4: any = await this.asistenciaOriginal.find().skip(30000).limit(10000);
                // const asistenciasOriginales5: any = await this.asistenciaOriginal.find().skip(40000).limit(10000);
                // const asistenciasOriginales6: any = await this.asistenciaOriginal.find().skip(50000).limit(10000);
                // const asistenciasOriginales7: any = await this.asistenciaOriginal.find().skip(60000).limit(10000);
                // const asistenciasOriginales: any = await this.asistenciaOriginal.find().skip(70000).limit(10000);
                const asistenciasOriginalesRefactorizados = yield Promise.all(asistenciasOriginales.map((x, index) => __awaiter(this, void 0, void 0, function* () {
                    let planillataller = [];
                    let alumno = [];
                    try {
                        planillataller = yield this.planillaTaller.findOne({
                            planillaTallerId: x.id_planilla_de_taller,
                        });
                        if (!planillataller) {
                            return null;
                        }
                    }
                    catch (ero) {
                        console.log('ero', ero);
                    }
                    try {
                        if (x.id_alumnos && x.id_alumnos !== 0) {
                            alumno = yield this.alumno.findOne({
                                alumnoId: x.id_alumnos,
                            });
                            if (!alumno) {
                                return null;
                            }
                        }
                        else {
                            return null;
                        }
                    }
                    catch (ero) {
                        console.log('ero', ero);
                    }
                    const unaAsistencia = {
                        id_planilla_de_asistencia: x.id_planilla_de_asistencia,
                        planillaTaller: planillataller,
                        alumno: alumno,
                        fecha: x.Fecha,
                        presente: x.Presente === 'SI' ? true : false,
                        llegoTarde: x.LlegoTarde === 'SI' ? true : false,
                        fechaCreacion: hoy,
                        activo: true,
                    };
                    return unaAsistencia;
                })));
                try {
                    const filtrados = asistenciasOriginalesRefactorizados.filter((x) => {
                        if (x.fecha === null) {
                        }
                        return x !== null && typeof x !== 'undefined' && x.fecha !== null;
                    });
                    const savedAsistencias = yield this.asistencia.insertMany(filtrados);
                    response.send({
                        savedAsistencias,
                    });
                }
                catch (e) {
                    console.log('ERROR', e);
                    // response.send({
                    //   error: asistenciasOriginalesRefactorizados,
                    // });
                    next(new HttpException(500, 'Ocurrió un error al guardar las asistenciasOriginales'));
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
        this.router.get(`${this.path}/migrar`, this.migrarMultiples);
        this.router.post(`${this.path}/por-alumno/:id`, passport.authenticate('jwt', { session: false }), this.obtenerAsistenciasPorAlumnoId);
        this.router.post(`${this.path}/por-alumno-curso`, passport.authenticate('jwt', { session: false }), this.obtenerAsistenciasPorAlumnosCurso);
        this.router.get(`${this.path}/por-planilla/:id`, passport.authenticate('jwt', { session: false }), this.obtenerAsistenciasPorPlanilla);
        // this.router.post(`${this.path}/informe-plantillas-entre-fechas`, this.informeAsistenciasPlantillasEntreFechas);
        this.router
            .all(`${this.path}/*`, passport.authenticate('jwt', { session: false }))
            .post(`${this.path}/informe-plantillas-entre-fechas`, this.informeAsistenciasGeneral)
            .post(`${this.path}/informe-por-planilla`, this.informeAsistenciasPorPlanilla)
            .put(`${this.path}`, this.guardarAsistencia)
            .patch(`${this.path}/:id`, this.actualizarAsistencia)
            .delete(`${this.path}/:id`, this.eliminar)
            .post(`${this.path}/buscar-inasistencias`, this.buscarInasistencias)
            .post(`${this.path}/buscar-asistencias-por-fechas`, this.buscarAsistenciasPorFechas)
            .post(`${this.path}/tomar-asistencias`, this.tomarAsistenciaPorPlanilla)
            .post(`${this.path}/obtener-asistencias-hoy`, this.obtenerAsistenciasHoyPorPlanilla)
            .post(`${this.path}/obtener-asistencias-fecha`, this.buscarAsistenciasPorFechaYPlanilla);
    }
    obtenerCalendarioEntreFechas(fechaInicio, fechaFinalizacion) {
        return __awaiter(this, void 0, void 0, function* () {
            const opciones = [
                {
                    $match: {
                        fecha: {
                            $gte: fechaInicio,
                            $lt: fechaFinalizacion,
                        },
                    },
                },
            ];
            return yield this.calendario.aggregate(opciones);
        });
    }
    obtenerAlumnosPorCCD(ciclo, curso, comision, division) {
        return __awaiter(this, void 0, void 0, function* () {
            let match = {
                'estadoCursadas.curso.curso': Number(curso),
                'estadoCursadas.curso.division': Number(division),
                'estadoCursadas.curso.comision': comision.toString(),
                'estadoCursadas.cicloLectivo.anio': Number(ciclo),
            };
            const opciones = [
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
            return yield this.alumno.aggregate(opciones);
        });
    }
}
export default AsistenciaController;
//# sourceMappingURL=asistencia.controller.js.map