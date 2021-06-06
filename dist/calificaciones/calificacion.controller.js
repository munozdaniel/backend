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
import NotFoundException from '../exceptions/NotFoundException';
import calificacionModel from './calificacion.model';
import escapeStringRegexp from 'escape-string-regexp';
import calificacionOriginalModel from './calificacionOriginal.model';
import planillaTallerModel from '../planillaTaller/planillaTaller.model';
import alumnoModel from '../alumnos/alumno.model';
import profesorModel from '../profesores/profesor.model';
import moment from 'moment';
import asistenciaModel from '../asistencias/asistencia.model';
import calendarioModel from '../calendario/calendario.model';
const ObjectId = mongoose.Types.ObjectId;
import passport from 'passport';
class CalificacionController {
    constructor() {
        this.path = '/calificacion';
        this.router = Router();
        this.calificacion = calificacionModel;
        this.planillaTaller = planillaTallerModel;
        this.alumno = alumnoModel;
        this.profesor = profesorModel;
        this.calificacionOriginal = calificacionOriginalModel;
        this.asistencia = asistenciaModel;
        this.calendario = calendarioModel;
        this.informeAlumnosPorTaller = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const planilla = request.body.planillaTaller;
            let fechaInicio = new Date(moment.utc(planilla.fechaInicio).format('YYYY-MM-DD'));
            const fechaFinalizacion = new Date(moment.utc(planilla.fechaFinalizacion).format('YYYY-MM-DD'));
            // Obtenemos el calendario
            const calendario = yield this.obtenerCalendarioEntreFechas(fechaInicio, fechaFinalizacion);
            // Obtenemos los alumnos
            const { curso, comision, division } = planilla.curso;
            const alumnos = yield this.obtenerAlumnosPorCCD(planilla.cicloLectivo.anio, curso, comision, division);
            const reporteAlumnos = yield Promise.all(alumnos.map((alumno) => __awaiter(this, void 0, void 0, function* () {
                let alumnoRetorno = null;
                // Obtengo las calificaciones por alumno
                const opcionesC = [
                    {
                        $match: {
                            planillaTaller: ObjectId(planilla._id),
                            alumno: ObjectId(alumno._id),
                        },
                    },
                ];
                let llegadasTardes = 0;
                let totalAsistencias = 0;
                let totalAusentes = 0;
                const calificaciones = yield this.calificacion.aggregate(opcionesC);
                alumnoRetorno = {
                    alumnoId: alumno._id,
                    alumnoNombre: alumno.nombreCompleto,
                    legajo: alumno.legajo,
                    calificaciones,
                };
                // Obtengo las asistencias por alumno y dia
                const inasistencias = [];
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
                        llegadasTardes += !asistencias[0].tarde ? 1 : 0;
                        const retorno = {
                            // legajo: alumno.legajo,
                            // alumnoId: alumno._id,
                            // alumnoNombre: alumno.nombreCompleto,
                            tarde: asistencias[0].tarde,
                            presente: asistencias[0].presente,
                            fecha: moment.utc(x.fecha).format('DD/MM/YYYY'),
                            encontrada: true,
                        };
                        if (!asistencias[0].presente) {
                            inasistencias.push(retorno);
                        }
                        return retorno;
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
                    calificaciones,
                    asistenciasArray,
                    totalAsistencias,
                    totalAusentes,
                    inasistencias,
                    porcentajeAsistencias: ((totalAsistencias * 100) / calendario.length).toFixed(2),
                    llegadasTardes,
                    porcentajeInasistencias: ((totalAusentes * 100) / calendario.length).toFixed(2),
                    totalClases: calendario.length,
                };
            })));
            response.send({ reporteAlumnos });
        });
        this.informeCalificacionesPorPlanilla = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const planilla = request.body.planillaTaller;
            const { curso, comision, division } = planilla.curso;
            const alumnos = yield this.obtenerAlumnosPorCCD(planilla.cicloLectivo.anio, curso, comision, division);
            const calificacionesPorAlumno = yield Promise.all(alumnos.map((alumno) => __awaiter(this, void 0, void 0, function* () {
                // Por cada alumno y planilla buscamos el
                const opciones = [
                    {
                        $match: {
                            planillaTaller: ObjectId(planilla._id),
                            alumno: ObjectId(alumno._id),
                        },
                    },
                ];
                const calificaciones = yield this.calificacion.aggregate(opciones);
                return {
                    alumnoId: alumno._id,
                    alumnoNombre: alumno.nombreCompleto,
                    legajo: alumno.legajo,
                    calificaciones,
                };
            })));
            return response.send({ calificaciones: calificacionesPorAlumno });
        });
        this.eliminar = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const successResponse = yield this.calificacion.findByIdAndDelete(id);
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
        this.guardarCalificacion = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const calificacionData = request.body;
            const created = new this.calificacion(Object.assign({}, calificacionData));
            try {
                const saved = yield created.save();
                response.send(saved);
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Error Interno'));
            }
        });
        this.actualizarCalificacion = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            const calificacion = request.body.calificacion;
            try {
                const updated = yield this.calificacion.findByIdAndUpdate(id, calificacion, { new: true });
                if (updated) {
                    response.send({ calificacion: updated });
                }
                else {
                    response.send({ calificacion: null });
                }
            }
            catch (e4) {
                console.log('[ERROR], ', e4);
                next(new HttpException(500, 'Ocurrió un error interno'));
            }
        });
        this.migrar = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const calificacionsOriginales = yield this.calificacionOriginal.find();
                const calificacionsOriginalesRefactorizados = yield Promise.all(calificacionsOriginales.map((x, index) => __awaiter(this, void 0, void 0, function* () {
                    let planillataller = null;
                    let alumno = null;
                    let profesor = null;
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
                        profesor = yield this.profesor.findOne({
                            id_profesores: x.id_profesor,
                        });
                    }
                    catch (ero) {
                        console.log('ero', ero);
                    }
                    try {
                        if (x.Id_alumno && x.Id_alumno !== 0) {
                            alumno = yield this.alumno.findOne({
                                alumnoId: x.Id_alumno,
                            });
                        }
                        else {
                            return null;
                        }
                    }
                    catch (ero) {
                        console.log('ero', ero);
                    }
                    let tipoExamen = null;
                    switch (x.tipo_de_examen) {
                        case '1er Trab Grupal':
                            tipoExamen = '1ER TRABAJO GRUPAL';
                            break;
                        case '1er Trab Practi':
                            tipoExamen = '1ER TRABAJO PRACTICO';
                            break;
                        case '1ra Evaluacion':
                            tipoExamen = '1RA EVALUACION';
                            break;
                        case '2da Evaluacion':
                            tipoExamen = '2DA EVALUACION';
                            break;
                        case '2do Trab Grupal':
                            tipoExamen = '2DO TRABAJO GRUPAL';
                            break;
                        case '2do Trab Practi':
                            tipoExamen = '2DO TRABAJO PRACTICO';
                            break;
                        case '3er  Trab Pract':
                            tipoExamen = '3ER TRABAJO PRACTICO';
                            break;
                        case '3ra Evaluacion':
                            tipoExamen = '3RA EVALUACION';
                            break;
                        case '3ro Trab Grupal':
                            tipoExamen = '3ER TRABAJO GRUPAL';
                            break;
                        case '4to  Trab Pract':
                            tipoExamen = '4TO TRABAJO PRACTICO';
                            break;
                        case 'Concepto':
                            tipoExamen = 'CONCEPTO';
                            break;
                        case 'Evaluacion':
                            tipoExamen = 'EVALUACION';
                            break;
                        case 'Participacion':
                            tipoExamen = 'PARTICIPACION';
                            break;
                        case 'Trabajo Grupal':
                            tipoExamen = 'TRABAJO GRUPAL';
                            break;
                        case 'Trabajo Practico':
                            tipoExamen = 'TRABAJO PRACTICO';
                            break;
                        default:
                            break;
                    }
                    let formaExamen = null;
                    switch (x.forma_del_examen) {
                        case 'Escrito':
                            formaExamen = 'ESCRITO';
                            break;
                        case 'Oral':
                            formaExamen = 'ORAL';
                            break;
                        case 'Prac.Laboratori':
                            formaExamen = 'PRACT. LABORATORIO';
                            break;
                        default:
                            break;
                    }
                    const now = new Date();
                    const hoy = new Date(moment(now).format('YYYY-MM-DD'));
                    const unaCalificacion = {
                        calificacionNro: index,
                        id_calificaciones: x.id_calificaciones,
                        planillaTaller: planillataller,
                        profesor: profesor,
                        alumno: alumno,
                        formaExamen,
                        tipoExamen,
                        promedioGeneral: x.PromedioGeneral,
                        observaciones: x.Observaciones,
                        promedia: x.promedia === 'SI' ? true : false,
                        fechaCreacion: hoy,
                        activo: true,
                    };
                    return unaCalificacion;
                })));
                try {
                    // console.log(
                    //   "calificacionsOriginalesRefactorizados",
                    //   calificacionsOriginalesRefactorizados
                    // );
                    const filtrados = calificacionsOriginalesRefactorizados.filter((x) => {
                        return x !== null && typeof x !== 'undefined';
                    });
                    const savedCalificacions = yield this.calificacion.insertMany(filtrados);
                    response.send({
                        savedCalificacions,
                    });
                }
                catch (e) {
                    console.log('ERROR', e);
                    // response.send({
                    //   error: calificacionsOriginales,
                    // });
                    next(new HttpException(500, 'Ocurrió un error al guardar las calificacionsOriginales'));
                }
            }
            catch (e2) {
                console.log('ERROR', e2);
                next(new HttpException(400, 'Parametros Incorrectos'));
            }
        });
        this.obtenerCalificacionesPorAlumnoId = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
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
                ];
                const calificacionesAggregate = yield this.calificacion.aggregate(opciones);
                if (calificacionesAggregate) {
                    response.send(calificacionesAggregate);
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
        this.initializeRoutes();
    }
    initializeRoutes() {
        console.log('CalificacionController/initializeRoutes');
        this.router.get(`${this.path}/migrar`, this.migrar);
        this.router.post(`${this.path}/por-alumno/:id`, passport.authenticate('jwt', { session: false }), this.obtenerCalificacionesPorAlumnoId);
        this.router.put(`${this.path}`, passport.authenticate('jwt', { session: false }), this.guardarCalificacion);
        this.router.delete(`${this.path}/:id`, passport.authenticate('jwt', { session: false }), this.eliminar);
        this.router.patch(`${this.path}/:id`, passport.authenticate('jwt', { session: false }), this.actualizarCalificacion);
        this.router.post(`${this.path}/informe-por-planilla`, passport.authenticate('jwt', { session: false }), this.informeCalificacionesPorPlanilla);
        this.router.post(`${this.path}/informe-alumnos-por-taller`, passport.authenticate('jwt', { session: false }), this.informeAlumnosPorTaller);
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
export default CalificacionController;
//# sourceMappingURL=calificacion.controller.js.map