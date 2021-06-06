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
import validationMiddleware from '../middleware/validation.middleware';
import CreateAlumnoDto from './alumno.dto';
import alumnoModel from './alumno.model';
import escapeStringRegexp from 'escape-string-regexp';
import alumnoOriginalModel from './alumnoOriginal.model';
import comisionesOriginalModel from '../comisiones/comisionOriginal.model';
import ciclolectivoModel from '../ciclolectivos/ciclolectivo.model';
import cursoModel from '../cursos/curso.model';
import estadoCursadaModel from './estadoCursada/estadoCursada.model';
import ConnectionService from '../services/Connection';
import axios from 'axios';
import moment from 'moment';
import planillaTallerModel from '../planillaTaller/planillaTaller.model';
import asistenciaModel from '../asistencias/asistencia.model';
import passport from 'passport';
import multerMiddleware from '../middleware/upload.middleware';
const ObjectId = mongoose.Types.ObjectId;
class AlumnoController {
    constructor() {
        this.path = '/alumnos';
        this.router = Router();
        this.alumno = alumnoModel;
        this.alumnoOriginal = alumnoOriginalModel;
        this.curso = cursoModel;
        this.estadoCursada = estadoCursadaModel;
        this.comisionOriginal = comisionesOriginalModel;
        this.ciclolectivo = ciclolectivoModel;
        this.planillaTaller = planillaTallerModel;
        this.asistencia = asistenciaModel;
        this.uploadDiagnostico = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            console.log('subirImagen ', request.file);
            console.log('subirImagen ', request.files);
            console.log('subirImagen ', request.body);
            try {
                const alumno = yield this.alumno.findById(id);
                if (alumno) {
                    if (!request.file) {
                        response.send({ success: true, message: 'EXITO' });
                    }
                    else {
                        console.log('=>', request.file.filename);
                        if (alumno.archivoDiagnostico && alumno.archivoDiagnostico.length > 0) {
                            alumno.archivoDiagnostico.push('public/imagenes/' + request.file.filename);
                        }
                        else {
                            alumno.archivoDiagnostico = ['public/imagenes/' + request.file.filename];
                        }
                        try {
                            const alumnoActualizado = yield this.alumno.findByIdAndUpdate(alumno._id, alumno, { new: true });
                            // const imagenData: ImagenDto = JSON.parse(request.body.imagen);
                            // console.log('request.file.filename', request.file.filename);
                            // imagenData.src = '/public/imagenes/' + request.file.filename;
                            // const imagenModel = new this.imagen({
                            //   ...imagenData,
                            // });
                            // const productoGuardado = await imagenModel.save();
                            // response.send(savedProducto);
                            response.send({
                                data: alumnoActualizado,
                                success: true,
                                message: 'EXITO',
                            });
                        }
                        catch (error) {
                            console.log('[ERROR UPDATE]', error);
                            response.status(500).send('Error interno al actualizar el alumno');
                        }
                    }
                }
                else {
                    response.status(400).send('No se encontró el alumno');
                }
            }
            catch (error) {
                console.log('[ERROR]', error);
                response.status(500).send('Error interno');
            }
        });
        this.enviarEmailMasivo = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const alumnos = request.body.alumnos;
            let fecha = moment.utc(request.body.fecha).format('DD/MM/YYYY');
            const remitentes = yield Promise.all(alumnos.map((x) => __awaiter(this, void 0, void 0, function* () {
                // ({ email: x.email, name: x.tipoAdulto })
                // Enviar Email
                const { SENDINBLUE_API, ENTORNO, MI_EMAIL } = process.env;
                const url = 'https://api.sendinblue.com/v3/smtp/email';
                const options = {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'api-key': SENDINBLUE_API,
                    },
                    body: JSON.stringify({
                        sender: {
                            name: 'Notificación de Ausencia - CET 30',
                            email: 'no-reply@propet.com',
                        },
                        to: [{ email: ENTORNO === 'desarrollo' ? MI_EMAIL : x.email, name: x.tipoAdulto }],
                        subject: 'Notificación de Ausencia',
                        params: {
                            nombreAdulto: x.nombreAdulto,
                            nombreAlumno: x.nombreCompleto,
                            fechaInasitencia: fecha,
                        },
                        templateId: 3,
                    }),
                };
                const headers = { headers: options.headers };
                return { url, body: options.body, headers };
                // try {
                //   return await axios.post(url, options.body, headers);
                // } catch (error) {
                //   console.log('[ERROR]', error);
                //   // response.status(200).send({ usuario: userToReturn, email: false });
                // }
            })));
            remitentes.map(({ url, body, headers }) => __awaiter(this, void 0, void 0, function* () {
                try {
                    return yield axios.post(url, body, headers);
                }
                catch (error) {
                    console.log('[ERROR]', error);
                    // response.status(200).send({ usuario: userToReturn, email: false });
                }
            }));
            response.status(200).send({ remitentes: remitentes });
        });
        this.agregarEstadoCursada = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const alumnoId = request.params.id;
            const alumno = yield this.alumno.findById(alumnoId).populate('estadoCursadas');
            if (alumno) {
                const estadoCursada = request.body.estadoCursada;
                const nuevo = {
                    curso: estadoCursada.curso.curso,
                    comision: estadoCursada.curso.comision,
                    division: estadoCursada.curso.division,
                    // fechaCreacion: hoy,
                    activo: true,
                };
                const match = {
                    curso: estadoCursada.curso.curso,
                    comision: estadoCursada.curso.comision,
                    division: estadoCursada.curso.division,
                };
                const curso = yield this.curso.findOneAndUpdate(match, nuevo, {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true,
                });
                const now = new Date();
                const hoy = new Date(moment(now).format('YYYY-MM-DD'));
                const createdEstadoCursada = new this.estadoCursada({
                    curso,
                    condicion: estadoCursada.condicion,
                    cicloLectivo: estadoCursada.cicloLectivo,
                    fechaCreacion: hoy,
                    activo: true,
                });
                const creado = yield createdEstadoCursada.save();
                createdEstadoCursada._id = creado;
                if (!alumno.estadoCursadas) {
                    alumno.estadoCursadas = [createdEstadoCursada];
                }
                else {
                    alumno.estadoCursadas.push(createdEstadoCursada);
                }
                const alumnoActualizado = yield this.alumno.findOneAndUpdate({ _id: alumnoId }, { estadoCursadas: alumno.estadoCursadas }, { new: true });
                if (!alumnoActualizado) {
                    next(new NotFoundException(alumnoId));
                }
                else {
                    // console.log('alumnoActualizado', alumnoActualizado);
                    response.send(alumnoActualizado);
                }
            }
        });
        this.actualizarEstadoCursada = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const estadoCursadaId = request.params.id;
            try {
                const estadoCursada = request.body.estadoCursada;
                estadoCursada._id = estadoCursadaId;
                // Buscamos el curso
                const nuevo = {
                    curso: estadoCursada.curso.curso,
                    comision: estadoCursada.curso.comision,
                    division: estadoCursada.curso.division,
                    // fechaCreacion: hoy,
                    activo: true,
                };
                const match = {
                    curso: estadoCursada.curso.curso,
                    comision: estadoCursada.curso.comision,
                    division: estadoCursada.curso.division,
                };
                const curso = yield this.curso.findOneAndUpdate(match, nuevo, {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true,
                });
                estadoCursada.curso = curso;
                // seteamos estado cursada
                const estadoCursadaActualizado = yield this.estadoCursada.findByIdAndUpdate({ _id: estadoCursadaId }, estadoCursada, { new: true });
                if (!estadoCursadaActualizado) {
                    next(new NotFoundException(estadoCursadaId));
                }
                else {
                    response.send(estadoCursadaActualizado);
                }
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Problemas interno'));
            }
        });
        this.obtenerInformeInasistenciaPorDia = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            let fecha = new Date(moment.utc(request.body.fecha).format('YYYY-MM-DD'));
            let anio = new Date(moment.utc(request.body.fecha).format('YYYY'));
            try {
                // const ciclolectivos = await this.ciclolectivo.find().sort('_id');
                // const index = ciclolectivos.findIndex((x) => Number(x.anio) === Number(anio));
                // const cicloLectivo = ciclolectivos[index]; // se podria hacer en una sola consulta pero ni ganas
                // Unir asistencias con plantillas con curso
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
                        },
                    },
                    {
                        $lookup: {
                            from: 'estadocursadas',
                            localField: 'alumno.estadoCursadas',
                            foreignField: '_id',
                            as: 'alumno.estadoCursadas',
                        },
                    },
                    {
                        $match: {
                            fecha,
                            presente: false,
                        },
                    },
                    {
                        $sort: {
                            nombreCompleto: 1,
                        },
                    },
                ];
                const planillasTalleres = yield this.asistencia.aggregate(opciones);
                if (!planillasTalleres || planillasTalleres.length < 1) {
                    response.send({ planillasTalleres: [] });
                }
                else {
                    response.send({ planillasTalleres });
                }
                // Buscar los alumnos por estadoCursada
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Problemas  interno'));
            }
        });
        this.obtenerInformeAlumnosPorPlanilla = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const planillaId = request.params.id;
            try {
                const opcionesP = [
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
                const planilla = yield this.planillaTaller.aggregate(opcionesP);
                if (!planilla) {
                    next(new NotFoundException());
                }
                else {
                    let match = {
                        'estadoCursadas.activo': true,
                        'estadoCursadas.cicloLectivo._id': ObjectId(planilla[0].cicloLectivo),
                        'estadoCursadas.curso.curso': Number(planilla[0].curso.curso),
                        'estadoCursadas.curso.division': Number(planilla[0].curso.division),
                        'estadoCursadas.curso.comision': planilla[0].curso.comision,
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
                                nombreCompleto: 1,
                            },
                        },
                    ];
                    // Busco todos los alumnos por ciclo y
                    const alumnosAggregate = yield this.alumno.aggregate(opciones);
                    response.send({ alumnos: alumnosAggregate });
                }
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Problemas  interno'));
            }
        });
        this.guardarMasivo = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const alumnos = request.body;
            try {
                const ciclosLectivos = yield this.ciclolectivo.find();
                const alumnosSaved = yield this.alumno.insertMany(alumnos);
                if (alumnosSaved && alumnosSaved.length > 0) {
                    const alumnosConEstados = yield Promise.all(alumnos.map((x) => __awaiter(this, void 0, void 0, function* () {
                        console.log(x);
                        const { curso, division, comision, cicloLectivo, condicion } = x;
                        if (!curso || !division || !cicloLectivo) {
                            return x;
                        }
                        const match = {
                            curso,
                            comision,
                            division,
                        };
                        const nuevo = {
                            curso,
                            comision,
                            division,
                            activo: true,
                        };
                        const nuevoCiclo = ciclosLectivos.find((c) => Number(c.anio) === Number(cicloLectivo));
                        const cursoEncontrado = yield this.curso.findOneAndUpdate(match, nuevo, {
                            upsert: true,
                            new: true,
                            setDefaultsOnInsert: true,
                        });
                        const now = new Date();
                        const hoy = new Date(moment(now).format('YYYY-MM-DD'));
                        const estadoCursada = { curso: cursoEncontrado, condicion, cicloLectivo: nuevoCiclo, fechaCreacion: hoy, activo: true };
                        const createdEstadoCursada = new this.estadoCursada(Object.assign({}, estadoCursada));
                        try {
                            const savedEstadoCursada = yield createdEstadoCursada.save();
                            const index = alumnosSaved.findIndex((a) => Number(a.dni) === Number(x.dni));
                            if (index !== -1) {
                                if (!alumnosSaved[index].estadoCursada) {
                                    alumnosSaved[index].estadoCursadas = [savedEstadoCursada];
                                }
                                else {
                                    alumnosSaved[index].estadoCursadas.push(savedEstadoCursada);
                                }
                                return yield this.alumno.findByIdAndUpdate(ObjectId(alumnosSaved[index]._id), alumnosSaved[index], { new: true });
                            }
                        }
                        catch (e4) {
                            console.log('[ERROR Creando Estado Cursada], ', e4);
                            next(new HttpException(500, 'Problemas interno'));
                        }
                    })));
                    response.send({ status: 200, alumnos: alumnosConEstados });
                }
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Ocurrió un error interno'));
            }
        });
        this.disponibleLegajo = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const legajo = escapeStringRegexp(request.params.legajo);
            try {
                const alumno = yield this.alumno.findOne({ legajo });
                if (alumno) {
                    response.send(false);
                }
                else {
                    response.send(true);
                }
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Ocurrió un error interno'));
            }
        });
        this.toggleEstadoAlumno = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = escapeStringRegexp(request.params.id);
            const activo = request.body.activo;
            try {
                const alumnoEditado = yield this.alumno.findByIdAndUpdate(ObjectId(id), { activo }, { new: true });
                if (alumnoEditado) {
                    response.status(200).send({ success: true });
                }
                else {
                    next(new NotFoundException(id));
                }
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Ocurrió un error interno'));
            }
        });
        this.disponibleDni = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const dni = escapeStringRegexp(request.params.dni);
            try {
                dni;
                const alumno = yield this.alumno.findOne({ dni });
                if (alumno) {
                    response.send(false);
                }
                else {
                    response.send(true);
                }
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Ocurrió un error interno'));
            }
        });
        this.informarAusencia = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const { observacion, nombreAdulto, fechaInasitencia, faltas, nombreAlumno, emailAdulto } = request.body;
            //     Hola { usuario.NAME },
            // Le informamos que el dia de la fecha {usuario.fecha} el/la alumno/a {usuario.nombreCompleto} no se ha presentado al establecimiento, obteniendo un total de {usuario.faltas} falta/s.
            // Atte. La Administración
            // Enviar Email
            const { SENDINBLUE_API, ENTORNO, MI_EMAIL } = process.env;
            const url = 'https://api.sendinblue.com/v3/smtp/email';
            const options = {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'api-key': SENDINBLUE_API,
                },
                body: JSON.stringify({
                    sender: {
                        name: 'Notificación de Ausencia - CET 30',
                        email: 'no-reply@propet.com',
                    },
                    to: [
                        {
                            email: ENTORNO === 'desarrollo' ? MI_EMAIL : emailAdulto,
                            name: nombreAdulto,
                        },
                    ],
                    subject: 'Notificación de Ausencia',
                    params: {
                        nombreAdulto: nombreAdulto ? nombreAdulto : '',
                        fechaInasitencia,
                        faltas,
                        nombreAlumno,
                        observacion,
                    },
                    templateId: 3,
                }),
            };
            const headers = { headers: options.headers };
            try {
                const resultado = yield axios.post(url, options.body, headers);
                response.status(200).send({ success: true });
            }
            catch (error) {
                console.log('[ERROR]', error);
                response.status(200).send({ success: false });
            }
        });
        /**
         * Los alumnos pasan al siguiente ciclo.
         * 1. Busco todos los alumnos del ciclo anterior, curso y divisiones seleccionadas por el usuario.
         * 2. Si existe en el nuevo ciclo deberia pisarlo sino lo inserta
         * @param request
         * @param response
         * @param next
         * @returns
         */
        this.actualizarAlNuevoCiclo = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const hoy = new Date(moment(now).format('YYYY-MM-DD'));
            const { curso, divisiones, cicloAnterior, ciclo } = request.body;
            // Obtengo todos los cursos por curso y division. <NO
            // Busco todos los alumnos por curso y division y ciclo.
            // Por cada alumno busco el estadocursada con el ciclo enviado si existe pasa a la lista de alumnoNoActualizado <NO
            // Por cada alumno buscamos el estadocursada con findOneAndUpdate (upsert, new) para que lo inserte si no existe
            let match = {
                'estadoCursadas.activo': true,
                'estadoCursadas.cicloLectivo._id': ObjectId(cicloAnterior._id),
                'estadoCursadas.curso.curso': Number(curso),
                'estadoCursadas.curso.division': { $in: divisiones },
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
            // Busco todos los alumnos por ciclo y
            const alumnosNoActualizados = [];
            const alumnosAggregate = yield this.alumno.aggregate(opciones);
            if (alumnosAggregate) {
                const alumnosActualizados = yield Promise.all(
                // Por cada alumno
                alumnosAggregate.map((x, index) => __awaiter(this, void 0, void 0, function* () {
                    // Veo si existe la cursada
                    const indice = yield x.estadoCursadas.findIndex((x) => {
                        return x.cicloLectivo.anio === ciclo.anio;
                    });
                    const estadosCursadasAGuardar = {
                        curso: x.estadoCursadas[0].curso,
                        cicloLectivo: ciclo,
                        condicion: 'REGULAR',
                        fechaCreacion: hoy,
                        activo: true,
                    };
                    if (indice === -1) {
                        //
                        // No existe el ciclo entonces estamos seguro de insertarlo
                        const created = new this.estadoCursada({
                            curso: x.estadoCursadas[0].curso,
                            cicloLectivo: ciclo,
                            condicion: 'REGULAR',
                            fechaCreacion: hoy,
                            activo: true,
                        });
                        const savedEstado = yield created.save();
                        x.estadoCursadas.push(savedEstado);
                        const alumnoActualizado = yield this.alumno.findByIdAndUpdate(x._id, {
                            $set: {
                                estadoCursadas: x.estadoCursadas,
                            },
                        }, 
                        // { $push: { estadoCursadas: savedEstado } },
                        // { $addToSet: { estadoCursadas: savedEstado } },
                        { upsert: true, new: true });
                        return alumnoActualizado;
                    }
                    else {
                        alumnosNoActualizados.push(x);
                    }
                })));
                return response.send({ alumnosActualizados: alumnosActualizados.filter((x) => x), alumnosNoActualizados });
            }
            else {
                next(new NotFoundException());
            }
        });
        /**
         *
         * @param request
         * @param response
         * @param next
         */
        this.obtenerAlumnosPorCursoEspecifico = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const { curso, comision, division, cicloLectivo } = request.body;
            let match = {
                'estadoCursadas.activo': true,
                'estadoCursadas.cicloLectivo._id': ObjectId(cicloLectivo._id),
                'estadoCursadas.curso.comision': comision,
                'estadoCursadas.curso.curso': Number(curso),
                'estadoCursadas.curso.division': Number(division),
                activo: true,
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
                        preserveNullAndEmptyArrays: true,
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
            const alumnosAggregate = yield this.alumno.aggregate(opciones);
            if (alumnosAggregate) {
                response.send(alumnosAggregate);
            }
            else {
                next(new NotFoundException());
            }
        });
        /**
         *
         * @param request
         * @param response
         * @param next
         */
        this.obtenerAlumnosPorCursoDivisionesCiclo = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const { curso, divisiones, cicloLectivo } = request.body;
            let match = {
                'estadoCursadas.activo': true,
                'estadoCursadas.cicloLectivo._id': ObjectId(cicloLectivo._id),
                'estadoCursadas.curso.curso': Number(curso),
                'estadoCursadas.curso.division': { $in: divisiones },
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
                        _id: -1,
                    },
                },
            ];
            const alumnosAggregate = yield this.alumno.aggregate(opciones);
            if (alumnosAggregate) {
                response.send(alumnosAggregate);
            }
            else {
                next(new NotFoundException());
            }
        });
        /**
         *
         * @param request
         * @param response
         * @param next
         */
        this.obtenerAlumnosPorCursoDivisionCiclo = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const { curso, division, ciclo } = request.body;
            let match = {
                'estadoCursadas.curso.curso': Number(curso),
                'estadoCursadas.curso.division': Number(division),
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
                        _id: -1,
                    },
                },
            ];
            const alumnosAggregate = yield this.alumno.aggregate(opciones);
            if (alumnosAggregate) {
                response.send(alumnosAggregate);
            }
            else {
                next(new NotFoundException());
            }
        });
        this.obtenerAlumnosPorCursoCiclo = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const { curso, comision, division, ciclo } = request.body;
            let match = {
                'estadoCursadas.curso.curso': Number(curso),
                'estadoCursadas.curso.comision': comision,
                'estadoCursadas.curso.division': Number(division),
                'estadoCursadas.cicloLectivo.anio': Number(ciclo),
            };
            if (!comision) {
                match = {
                    'estadoCursadas.curso.curso': Number(curso),
                    'estadoCursadas.curso.division': Number(division),
                    'estadoCursadas.cicloLectivo.anio': Number(ciclo),
                };
            }
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
                        _id: -1,
                    },
                },
            ];
            const alumnosAggregate = yield this.alumno.aggregate(opciones);
            if (alumnosAggregate) {
                response.send(alumnosAggregate);
            }
            else {
                next(new NotFoundException());
            }
        });
        this.obtenerAlumnosPorCurso = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const { curso, comision, division } = request.body;
            let match = {
                'estadoCursadas.curso.curso': curso,
                'estadoCursadas.curso.comision': comision,
                'estadoCursadas.curso.division': division,
            };
            if (!comision) {
                match = {
                    'estadoCursadas.curso.curso': curso,
                    'estadoCursadas.curso.division': division,
                };
            }
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
            const alumnosAggregate = yield this.alumno.aggregate(opciones);
            if (alumnosAggregate) {
                response.send(alumnosAggregate);
            }
            else {
                next(new NotFoundException());
            }
        });
        this.getFichaAlumnos = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                let { cicloLectivo, division, curso } = request.body;
                let match = {
                    'estadoCursadas.activo': true,
                    'estadoCursadas.cicloLectivo': ObjectId(cicloLectivo._id),
                    'estadoCursadas.curso.curso': Number(curso),
                    'estadoCursadas.curso.division': Number(division),
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
                const alumnos = yield this.alumno.aggregate(opciones);
                // .find()
                // .find({ 'comisiones.cicloLectivo': 2019 })
                // .find( {
                //   comisiones: { $all: [
                //                  { "$elemMatch" : { cicloLectivo: 2020, division: { $gt: 0} } },
                //                ] }
                // })
                // .find({ comisiones: { $in: [{ 'comisiones.cicloLectivo': 2020 }] } })
                // .find({
                //   "comisiones.cicloLectivo": cicloLectivo, //cicloLectivo,
                //   "comisiones.division": division, //division,
                //   "comisiones.curso": curso, //curso,
                // })
                // .sort({ _id: -1 })
                // .populate({
                //   path: 'comisiones',
                //   model: 'Comisione',
                //   select: 'cicloLectivo division curso',
                // });
                // .populate("estadoComisiones");
                if (alumnos) {
                    response.send(alumnos);
                }
                else {
                    next(new NotFoundException());
                }
            }
            catch (e) {
                console.log('[ERROR]', e);
                next(new HttpException(400, 'Parametros Incorrectos'));
            }
        });
        this.comprobarEstadoCursadaParaEditar = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const opciones = [
                    {
                        $match: {
                            estadoCursadas: ObjectId(id),
                        },
                    },
                ];
                const alumnos = yield this.alumno.aggregate(opciones); //.populate('author', '-password') populate con imagen
                if (alumnos && alumnos.length > 0) {
                    response.send(false); // Disponible? false
                }
                else {
                    response.send(true); // Disponible? true
                }
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Ocurrió un problema interno'));
            }
        });
        this.getAllAlumnos = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const alumnos = yield this.alumno.find({ activo: true }).sort({ _id: -1 }); //.populate('author', '-password') populate con imagen
                response.send(alumnos);
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Ocurrió un problema interno'));
            }
        });
        this.obtenerTodosInactivos = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const alumnos = yield this.alumno.find({ activo: false }).sort({ _id: -1 }); //.populate('author', '-password') populate con imagen
                response.send(alumnos);
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Ocurrió un problema interno'));
            }
        });
        this.obtenerTodos = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const alumnos = yield this.alumno.find({ activo: true }).sort({ _id: -1 }); //.populate('author', '-password') populate con imagen
                response.send(alumnos);
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Ocurrió un problema interno'));
            }
        });
        this.obtenerAlumnoPorId = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const alumno = yield this.alumno.findById(id).populate('comisiones');
                if (alumno) {
                    response.send(alumno);
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
        this.eliminarColeccion = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            yield ConnectionService.getConnection()
                .db.listCollections({ name: 'alumnos' })
                .next((err, collinfo) => {
                if (collinfo) {
                    // The collection exists
                    alumnoModel.collection.drop();
                }
            });
            yield ConnectionService.getConnection()
                .db.listCollections({ name: 'estadocursadas' })
                .next((err, collinfo) => {
                if (collinfo) {
                    // The collection exists
                    estadoCursadaModel.collection.drop();
                }
            });
            yield ConnectionService.getConnection()
                .db.listCollections({ name: 'cursos' })
                .next((err, collinfo) => {
                if (collinfo) {
                    // The collection exists
                    cursoModel.collection.drop();
                }
            });
            response.send('Colecciones eliminadas');
        });
        this.migrar = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const arregloNoInsertados = [];
                const now = new Date();
                const hoy = new Date(moment(now).format('YYYY-MM-DD'));
                const alumnos = yield this.alumnoOriginal.find();
                const ciclosLectivos = yield this.ciclolectivo.find();
                // {},
                // 'dni ApellidoyNombre fecha_nacimiento sexo nacionalidad telefonos mail fecha_ingreso procedencia_colegio_primario procedencia_colegio_secundario fecha_de_baja motivo_de_baja domicilio nombre_y_apellido_padre telefono_padre mail_padre nombre_y_apellido_madre telefono_madre mail_madre nombre_y_apellido_tutor1 telefono_tutor1 mail_tutor1 nombre_y_apellido_tutor2 telefono_tutor2 mail_tutor2 nombre_y_apellido_tutor3 telefono_tutor3 mail_tutor3 cantidad_integrantes_grupo_familiar SeguimientoETAP NombreyApellidoTae MailTae ArchivoDiagnostico'
                // .select('dni ApellidoyNombre fecha_nacimiento sexo nacionalidad telefonos mail fecha_ingreso procedencia_colegio_primario procedencia_colegio_secundario fecha_de_baja motivo_de_baja domicilio nombre_y_apellido_padre telefono_padre mail_padre nombre_y_apellido_madre telefono_madre mail_madre nombre_y_apellido_tutor1 telefono_tutor1 mail_tutor1 nombre_y_apellido_tutor2 telefono_tutor2 mail_tutor2 nombre_y_apellido_tutor3 telefono_tutor3 mail_tutor3 cantidad_integrantes_grupo_familiar SeguimientoETAP NombreyApellidoTae MailTae ArchivoDiagnostico'); //.populate('author', '-password') populate con imagen
                const alumnosRefactorizados = yield Promise.all(alumnos.map((x, index) => __awaiter(this, void 0, void 0, function* () {
                    const padre = {
                        tipoAdulto: 'PADRE',
                        activo: true,
                        fechaCreacion: hoy,
                        nombreCompleto: x.nombre_y_apellido_padre,
                        telefono: x.telefono_padre,
                        email: x.mail_padre,
                    };
                    const madre = {
                        tipoAdulto: 'MADRE',
                        activo: true,
                        fechaCreacion: hoy,
                        nombreCompleto: x.nombre_y_apellido_madre,
                        telefono: x.telefono_madre,
                        email: x.mail_madre,
                    };
                    const tutor1 = {
                        tipoAdulto: 'TUTOR',
                        activo: true,
                        fechaCreacion: hoy,
                        nombreCompleto: x.nombre_y_apellido_tutor1,
                        telefono: x.telefono_tutor1,
                        email: x.mail_tutor1,
                    };
                    const tutor2 = {
                        tipoAdulto: 'TUTOR',
                        activo: true,
                        fechaCreacion: hoy,
                        nombreCompleto: x.nombre_y_apellido_tutor2,
                        telefono: x.telefono_tutor2,
                        email: x.mail_tutor2,
                    };
                    const adultos = [padre, madre, tutor1, tutor2];
                    let telefono = null;
                    let celular = null;
                    let obsTelefono = null;
                    if (x.telefonos && x.telefonos.toString().length > 0) {
                        const tel = x.telefonos.replace(' ', '').split('-');
                        if (tel && tel.length == 2) {
                            // 29951760044-2995176036
                            if (tel[0].length > 2) {
                                //!299
                                telefono = tel[0].toUpperCase();
                                celular = tel[1].toUpperCase();
                            }
                            else {
                                // ===299
                                telefono = tel[0] + tel[1];
                            }
                        }
                        else {
                            const tel = x.telefonos.replace(' ', '').split('/');
                            if (tel[0] && tel[1]) {
                                telefono = tel[0].trim().toUpperCase();
                                celular = tel[1].trim().toUpperCase();
                            }
                            else {
                                telefono = x.telefonos.toUpperCase();
                            }
                        }
                    }
                    let dniMod = null;
                    let tipoDniMod = null;
                    if (x.dni) {
                        if (x.dni.includes('-')) {
                            const d = x.dni.split('-');
                            tipoDniMod = d[0] ? d[0].trim() : null;
                            dniMod = d[1] ? d[1].trim() : null;
                            // if (d && d.length > 1) {
                            //   dniMod = d[0].trim();
                            //   tipoDniMod = d[1].trim();
                            // } else {
                            //   dniMod = x.dni;
                            // }
                        }
                        else {
                            dniMod = x.dni;
                        }
                    }
                    // Recupero las comisiones para guardarla
                    let estadoCursadas = [];
                    try {
                        //  Recorro las comisiones originales
                        const comisionesOriginales = yield this.comisionOriginal.find({
                            id_alumnos: Number(x.id_alumno),
                        });
                        if (comisionesOriginales.length < 1) {
                            // TODO: estos no deberian venir en 0. Chequear migracion
                            console.log(x.id_alumno, 'este alumno no tiene cursads===========> no existen', comisionesOriginales.length);
                        }
                        estadoCursadas = yield Promise.all(comisionesOriginales.map((x, index2) => __awaiter(this, void 0, void 0, function* () {
                            // Por cada comision buscar si existe el curso por comision, curso, division
                            try {
                                if (!x.ciclo_lectivo || x.ciclo_lectivo === 0) {
                                    return null;
                                }
                                const nuevoCiclo = ciclosLectivos.find((c) => Number(c.anio) === Number(x.ciclo_lectivo));
                                if (x) {
                                    let match = {
                                        division: x.Division,
                                        comision: x.comision,
                                        curso: x.Tcurso,
                                    };
                                    // Si no tiene comisione entonces no es taller
                                    if (!x.comision || x.comision.trim().length < 1) {
                                        match = {
                                            division: x.Division,
                                            curso: x.Tcurso,
                                        };
                                    }
                                    try {
                                        const nuevo = {
                                            division: x.Division,
                                            comision: x.comision ? x.comision : null,
                                            curso: x.Tcurso,
                                            // cicloLectivo: [nuevoCiclo],
                                            fechaCreacion: hoy,
                                            activo: true,
                                        };
                                        const savedCurso = yield this.curso.findOneAndUpdate(match, nuevo, {
                                            upsert: true,
                                            new: true,
                                            setDefaultsOnInsert: true,
                                        });
                                        // crear estadocursada
                                        const createdEstadoCursada = new this.estadoCursada({
                                            estadoCursadaNro: 100 + index2,
                                            curso: Object.assign(Object.assign({}, savedCurso), { comision: savedCurso.comision ? savedCurso.comision : 'Sin Registrar' }),
                                            condicion: x.Condicion ? x.Condicion.toUpperCase() : 'Sin Registrar',
                                            cicloLectivo: nuevoCiclo,
                                            fechaCreacion: hoy,
                                            activo: true,
                                        });
                                        try {
                                            const savedEstadoComision = yield createdEstadoCursada.save();
                                            return savedEstadoComision;
                                        }
                                        catch (e4) {
                                            console.log('e4, ', e4);
                                        }
                                    }
                                    catch (e4) {
                                        console.log('find, ', e4);
                                    }
                                }
                                else {
                                    console.log('CXX, ', x);
                                }
                            }
                            catch (errorUp) {
                                console.log('errorUp', errorUp);
                            }
                        })));
                    }
                    catch (ero) {
                        if (!ero.errmsg) {
                        }
                    }
                    if (!x.ApellidoyNombre) {
                        return null;
                    }
                    const retorno = {
                        estadoCursadas: estadoCursadas,
                        alumnoId: x.id_alumno,
                        legajo: x.id_alumno,
                        // alumnoNro: index + 100,
                        adultos,
                        dni: dniMod ? dniMod : null,
                        tipoDni: tipoDniMod,
                        nombreCompleto: x.ApellidoyNombre,
                        fechaNacimiento: x.fecha_nacimiento,
                        observaciones: '',
                        observacionTelefono: '',
                        sexo: x.sexo.trim().length === 0
                            ? 'Sin Registrar'
                            : x.sexo.toUpperCase() === 'MASCULINO' || x.sexo.toUpperCase() === 'M'
                                ? 'MASCULINO'
                                : 'FEMENINO',
                        nacionalidad: x.nacionalidad ? x.nacionalidad.toUpperCase() : 'ARGENTINA',
                        telefono,
                        celular,
                        email: x.mail ? x.mail : null,
                        fechaIngreso: x.fecha_ingreso ? x.fecha_ingreso : 'Sin Registrar',
                        procedenciaColegioPrimario: x.procedencia_colegio_primario ? x.procedencia_colegio_primario : 'Sin Registrar',
                        procedenciaColegioSecundario: x.procedencia_colegio_secundario ? x.procedencia_colegio_secundario : 'Sin Registrar',
                        fechaDeBaja: x.fecha_de_baja,
                        motivoDeBaja: x.motivo_de_baja ? x.motivo_de_baja : null,
                        domicilio: x.domicilio ? x.domicilio : 'Sin Registrar',
                        cantidadIntegranteGrupoFamiliar: x.cantidad_integrantes_grupo_familiar,
                        seguimientoEtap: x.SeguimientoETAP,
                        nombreCompletoTae: x.NombreyApellidoTae,
                        emailTae: x.MailTae,
                        archivoDiagnostico: x.ArchivoDiagnostico,
                        fechaCreacion: hoy,
                        activo: true,
                    };
                    return retorno;
                })));
                try {
                    const filtrados = alumnosRefactorizados.filter((x) => {
                        return x !== null && typeof x !== 'undefined';
                    });
                    const savedAlumnos = yield this.alumno.insertMany(filtrados);
                    response.send({
                        savedAlumnos,
                        cantidad: savedAlumnos.length,
                    });
                }
                catch (e) {
                    // [ 'errors', '_message', 'message', 'name' ]
                    console.log('[ERROR 1]', e);
                    next(new HttpException(500, 'Problemas al insertar los registros'));
                }
            }
            catch (e2) {
                console.log('[ERROR 2]', e2);
                next(new HttpException(400, 'Parametros Incorrectos'));
            }
        });
        // private getAllAlumnosPag = async (request: Request, response: Response, next: NextFunction) => {
        //   const parametros: IQueryAlumnoPag = request.query;
        //   const criterios = request.query.query
        //     ? JSON.parse(request.query.query)
        //     : {};
        //   await this.alumno.paginate(
        //     {},
        //     {
        //       page: Number(parametros.page),
        //       limit: Number(parametros.limit),
        //       sort: JSON.parse(parametros.sort || null),
        //     },
        //     (err: any, result: any) => {
        //       if (err) {
        //         console.log("[ERROR]", err);
        //       }
        //       // result.docs
        //       // result.totalDocs = 100
        //       // result.limit = 10
        //       // result.page = 1
        //       // result.totalPages = 10
        //       // result.hasNextPage = true
        //       // result.nextPage = 2
        //       // result.hasPrevPage = false
        //       // result.prevPage = null
        //       // result.pagingCounter = 1
        //       response.send(result);
        //     }
        //   );
        //   // const  count = request.query.count || 5;
        //   // const  page = request.query.page || 1;
        //   //   const alumnos = await this.alumno.find().populate('imagenes'); //.populate('author', '-password') populate con imagen
        // };
        this.getAlumnoById = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            let match = {
                _id: ObjectId(id),
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
                        preserveNullAndEmptyArrays: true,
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
                        preserveNullAndEmptyArrays: true,
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
                const alumno = yield this.alumno.aggregate(opciones);
                // Si no tiene cursadas, lo guarda como un objeto vacia {}
                if (alumno && alumno.length > 0) {
                    if (alumno[0].estadoCursadas && alumno[0].estadoCursadas.length > 0 && Object.keys(alumno[0].estadoCursadas[0]).length === 0) {
                        alumno[0].estadoCursadas = [];
                    }
                    response.send(alumno[0]);
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
        this.modifyAlumno = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            const alumnoData = request.body;
            try {
                if (alumnoData.estadoCursadas && alumnoData.estadoCursadas.length > 0) {
                    alumnoData.estadoCursadas = yield Promise.all(alumnoData.estadoCursadas.map((x) => __awaiter(this, void 0, void 0, function* () {
                        const cursoCheck = x.curso;
                        const curso = yield this.curso.findOneAndUpdate({
                            curso: Number(x.curso.curso),
                            comision: x.curso.comision,
                            division: Number(x.curso.division),
                        }, x.curso, { upsert: true, new: true });
                        console.log('curso', curso);
                        x.curso = curso;
                        if (x._id) {
                            console.log('con id', x);
                            const now = new Date();
                            const hoy = new Date(moment(now).format('YYYY-MM-DD'));
                            x.fechaModificacion = hoy;
                            return yield this.estadoCursada.findByIdAndUpdate(x._id, x, { upsert: true, new: true });
                        }
                        else {
                            const now = new Date();
                            const hoy = new Date(moment(now).format('YYYY-MM-DD'));
                            try {
                                const createdEstadoCursada = new this.estadoCursada({
                                    curso,
                                    condicion: x.condicion,
                                    cicloLectivo: x.cicloLectivo,
                                    fechaModificacion: hoy,
                                    activo: x.activo,
                                    fechaCreacion: hoy,
                                });
                                const saved = yield createdEstadoCursada.save();
                                console.log('sin id', saved, saved._id);
                                return saved;
                            }
                            catch (e) {
                                console.log('[ERROR GUARDANDO ESTADO CURSADA NUEVO]', e);
                                next(new HttpException(400, 'Error interno'));
                            }
                        }
                    })));
                }
                try {
                    console.log('=============================');
                    console.log('alumnoData', alumnoData);
                    console.log('=============================');
                    const alumno = yield this.alumno.findByIdAndUpdate(id, alumnoData, {
                        new: true,
                    });
                    if (alumno) {
                        response.send(alumno);
                    }
                    else {
                        next(new NotFoundException(id));
                    }
                }
                catch (e) {
                    console.log('[ERROR GUARDANDO ALUMNO]', e);
                    next(new HttpException(400, 'Error interno'));
                }
            }
            catch (e) {
                console.log('[ERROR]', e);
                next(new HttpException(400, 'Parametros Incorrectos'));
            }
        });
        this.createAlumno = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            // Agregar datos
            const alumnoData = request.body;
            const createdAlumno = new this.alumno(Object.assign({}, alumnoData));
            try {
                const savedAlumno = yield createdAlumno.save();
                response.send(savedAlumno);
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Error Interno'));
            }
        });
        this.deleteAlumno = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const successResponse = yield this.alumno.findByIdAndDelete(id);
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
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post(`${this.path}/upload-diagnostico/:id`, multerMiddleware.single('diagnostico'), this.uploadDiagnostico);
        // Using the  route.all in such a way applies the middleware only to the route
        // handlers in the chain that match the  `${this.path}/*` route, including  POST /alumnos.
        this.router
            .all(`${this.path}/*`, passport.authenticate('jwt', { session: false }))
            .get(`${this.path}/migrar`, this.migrar)
            .get(`${this.path}/todos`, this.obtenerTodos)
            .get(`${this.path}/todos-inactivos`, this.obtenerTodosInactivos)
            .get(`${this.path}/eliminar-coleccion`, this.eliminarColeccion)
            .get(`${this.path}/comprobar-estado-cursada/:id`, this.comprobarEstadoCursadaParaEditar)
            .get(`${this.path}/habilitados`, this.getAllAlumnos)
            .post(`${this.path}/ficha`, this.getFichaAlumnos)
            .patch(`${this.path}/:id`, validationMiddleware(CreateAlumnoDto, true), this.modifyAlumno)
            .get(`${this.path}/:id`, this.getAlumnoById)
            .delete(`${this.path}/:id`, this.deleteAlumno)
            .get(`${this.path}/disponible-legajo/:legajo`, this.disponibleLegajo)
            .get(`${this.path}/disponible-dni/:dni`, this.disponibleDni)
            .post(`${this.path}/toggle-estado/:id`, this.toggleEstadoAlumno)
            .post(`${this.path}/por-curso`, this.obtenerAlumnosPorCurso)
            .post(`${this.path}/por-curso-ciclo`, this.obtenerAlumnosPorCursoCiclo)
            .post(`${this.path}/por-curso-division-ciclo`, this.obtenerAlumnosPorCursoDivisionCiclo)
            .post(`${this.path}/por-curso-divisiones-ciclo`, this.obtenerAlumnosPorCursoDivisionesCiclo)
            .post(`${this.path}/por-curso-especifico`, this.obtenerAlumnosPorCursoEspecifico)
            .post(`${this.path}`, this.actualizarAlNuevoCiclo)
            .post(`${this.path}/informar-ausencia`, this.informarAusencia)
            .post(`${this.path}/agregar-estado-cursada/:id`, this.agregarEstadoCursada)
            .post(`${this.path}/actualizar-estado-cursada/:id`, this.actualizarEstadoCursada)
            .post(`${this.path}/enviar-email-masivo`, this.enviarEmailMasivo)
            .post(`${this.path}/informe-inasistencia-por-dia`, this.obtenerInformeInasistenciaPorDia)
            .get(`${this.path}/informe-por-planilla/:id`, this.obtenerInformeAlumnosPorPlanilla)
            .put(`${this.path}/guardar-masivo`, this.guardarMasivo)
            .put(this.path, validationMiddleware(CreateAlumnoDto), 
        // checkPermisos(rolesEnum.ADMIN), // elimintar. test
        this.createAlumno);
    }
}
export default AlumnoController;
//# sourceMappingURL=alumno.controller.js.map