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
import seguimientoAlumnoModel from './seguimientoAlumno.model';
import seguimientoAlumnoOriginalModel from './seguimientoAlumnoOriginal.model';
import planillaTallerModel from '../planillaTaller/planillaTaller.model';
import alumnoModel from '../alumnos/alumno.model';
import ciclolectivoModel from '../ciclolectivos/ciclolectivo.model';
import moment from 'moment';
import usuarioModel from '../usuario/usuario.model';
import passport from 'passport';
const ObjectId = mongoose.Types.ObjectId;
class SeguimientoAlumnoController {
    constructor() {
        this.path = '/seguimiento-alumnos';
        this.router = Router();
        this.seguimientoAlumno = seguimientoAlumnoModel;
        this.planillaTaller = planillaTallerModel;
        this.alumno = alumnoModel;
        this.seguimientoAlumnoOriginal = seguimientoAlumnoOriginalModel;
        this.ciclolectivo = ciclolectivoModel;
        this.usuario = usuarioModel;
        this.obtenerSeguimientoPorId = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const opciones = [
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
                const successResponse = yield this.seguimientoAlumno.aggregate(opciones);
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
        this.eliminar = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const successResponse = yield this.seguimientoAlumno.findByIdAndDelete(id);
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
        this.agregarSeguimientoAlumno = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const seguimientoData = request.body;
            const email = request.body.creadoPor.email;
            const ini = new Date(moment.utc(seguimientoData.fecha).format('YYYY-MM-DD')); // Se hace esto para que no pase al siguient dia
            seguimientoData.fecha = ini;
            let match = {
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
                };
            }
            // const ini = new Date(moment(seguimientoData.fecha).utc().format('YYYY-MM-DD'));
            // seguimientoData.fecha = ini;
            try {
                const usuario = yield this.usuario.findOne({ email: email });
                if (usuario) {
                    seguimientoData.creadoPor = usuario;
                    try {
                        const updated = yield this.seguimientoAlumno.findOne(match);
                        if (updated) {
                            response.send({
                                tema: updated,
                                success: false,
                                message: 'Ya existe cargado un seguimiento en la fecha: ' + moment.utc(ini).format('DD/MM/YYYY').toString(),
                            });
                        }
                        else {
                            const created = new this.seguimientoAlumno(Object.assign({}, seguimientoData));
                            const saved = yield created.save();
                            response.send({ seguimiento: saved, success: true, message: 'Seguimiento agregado correctamente' });
                        }
                    }
                    catch (error) {
                        console.log('[ERROR]', error);
                        next(new HttpException(500, 'Error Interno'));
                    }
                }
                else {
                    response.send({ seguimiento: null, success: false, message: 'El usuario no existe' });
                }
            }
            catch (e4) {
                console.log('[ERROR], ', e4);
                next(new HttpException(500, 'Ocurrió un error interno'));
            }
        });
        this.actualizarSeguimientoAlumno = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            const seguimiento = request.body;
            const email = request.body.modificadoPor.email;
            try {
                const usuario = yield this.usuario.findOne({ email: email });
                if (usuario) {
                    seguimiento.modificadoPor = usuario;
                    const fechadate = new Date(seguimiento.fecha);
                    const fecha = new Date(moment.utc(fechadate).format('YYYY-MM-DD'));
                    seguimiento.fechaModificacion = fecha;
                    try {
                        const updated = yield this.seguimientoAlumno.findByIdAndUpdate(id, seguimiento, { new: true });
                        if (updated) {
                            response.send({ seguimiento: updated });
                        }
                        else {
                            response.send({ seguimiento: null });
                        }
                    }
                    catch (e4) {
                        console.log('[ERROR], ', e4);
                        next(new HttpException(500, 'Ocurrió un error interno'));
                    }
                }
                else {
                    response.send({ seguimiento: null, message: 'El usuario no existe' });
                }
            }
            catch (e4) {
                console.log('[ERROR], ', e4);
                next(new HttpException(500, 'Ocurrió un error interno'));
            }
        });
        this.obtenerPorAlumno = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const alumnoId = request.params.alumnoId;
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
                const seguimientos = yield this.seguimientoAlumno.aggregate(opciones);
                response.send(seguimientos);
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Problemas en el servidor'));
            }
        });
        this.obtenerPorPlanillaYAlumno = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            const alumnoId = request.params.alumnoId;
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
                const seguimientos = yield this.seguimientoAlumno.aggregate(opciones);
                response.send(seguimientos);
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Problemas en el servidor'));
            }
        });
        this.obtenerSeguimientoAlumnoPorPlanilla = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
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
                            planillaTaller: ObjectId(id),
                        },
                    },
                ];
                const seguimientos = yield this.seguimientoAlumno.aggregate(opciones);
                response.send(seguimientos);
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Problemas en el servidor'));
            }
        });
        this.resueltos = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { resuelto } = request.body;
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
                const seguimientos = yield this.seguimientoAlumno.aggregate(opciones);
                // const seguimientos = await this.seguimientoAlumno.find(filtro).sort('_id').populate('alumno');
                if (seguimientos) {
                    response.send(seguimientos);
                }
                else {
                    next(new NotFoundException());
                }
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(400, 'Parametros Incorrectos'));
            }
        });
        this.migrar = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const now = new Date();
                const hoy = new Date(moment(now).format('YYYY-MM-DD'));
                const ciclosLectivos = yield this.ciclolectivo.find();
                const seguimientosOriginales = yield this.seguimientoAlumnoOriginal.find();
                const seguimientoRefactorizados = yield Promise.all(seguimientosOriginales.map((x, index) => __awaiter(this, void 0, void 0, function* () {
                    let planillataller = [];
                    let alumno = [];
                    try {
                        planillataller = yield this.planillaTaller.findOne({
                            planillaTallerId: x.IdPlanillaDeTaller,
                        });
                    }
                    catch (ero) {
                        console.log('ero', ero);
                    }
                    try {
                        alumno = yield this.alumno.findOne({
                            alumnoId: x.id_alumno,
                        });
                    }
                    catch (ero) {
                        console.log('ero', ero);
                    }
                    const fechadate = new Date(x.fecha);
                    const fecha = new Date(moment(fechadate).format('YYYY-MM-DD'));
                    const cl = yield ciclosLectivos.filter((d) => Number(d.anio) === (x.ciclo_lectivo === 0 ? 2019 : Number(x.ciclo_lectivo)));
                    const unSeguimientoAlumno = {
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
                })));
                try {
                    const savedPlanillaTallers = yield this.seguimientoAlumno.insertMany(seguimientoRefactorizados);
                    response.send({
                        savedPlanillaTallers,
                    });
                }
                catch (e) {
                    console.log('ERROR', e);
                    next(new HttpException(500, 'Ocurrió un error al guardar las planillasTalleres'));
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
        console.log('SeguimientoAlumnoController/initializeRoutes');
        this.router.get(`${this.path}/migrar`, this.migrar);
        this.router.post(`${this.path}/resueltos`, passport.authenticate('jwt', { session: false }), this.resueltos);
        // this.router.post(`${this.path}/por-planilla/:id`, this.obtenerSeguimientoAlumnoPorPlanilla);
        this.router.get(`${this.path}/por-planilla/:id`, passport.authenticate('jwt', { session: false }), this.obtenerSeguimientoAlumnoPorPlanilla);
        this.router.get(`${this.path}/por-planilla-alumno/:id/:alumnoId`, passport.authenticate('jwt', { session: false }), this.obtenerPorPlanillaYAlumno);
        this.router.get(`${this.path}/por-alumno/:alumnoId`, passport.authenticate('jwt', { session: false }), this.obtenerPorAlumno);
        this.router.put(`${this.path}`, passport.authenticate('jwt', { session: false }), this.agregarSeguimientoAlumno);
        this.router.get(`${this.path}/:id`, passport.authenticate('jwt', { session: false }), this.obtenerSeguimientoPorId);
        this.router.patch(`${this.path}/:id`, passport.authenticate('jwt', { session: false }), this.actualizarSeguimientoAlumno);
        this.router.delete(`${this.path}/:id`, passport.authenticate('jwt', { session: false }), this.eliminar);
    }
}
export default SeguimientoAlumnoController;
//# sourceMappingURL=seguimientoAlumno.controller.js.map