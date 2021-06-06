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
import planillaTallerModel from './planillaTaller.model';
import escapeStringRegexp from 'escape-string-regexp';
import planillaTallerOriginalModel from './planillaTallerOriginal.model';
import alumnoModel from '../alumnos/alumno.model';
import asignaturaModel from '../asignaturas/asignatura.model';
import profesorModel from '../profesores/profesor.model';
import cursoModel from '../cursos/curso.model';
import ciclolectivoModel from '../ciclolectivos/ciclolectivo.model';
import NotFoundException from '../exceptions/NotFoundException';
import calendarioModel from '../calendario/calendario.model';
import moment from 'moment';
import passport from 'passport';
const ObjectId = mongoose.Types.ObjectId;
class PlanillaTallerController {
    constructor() {
        this.path = '/planilla-taller';
        this.router = Router();
        this.calendario = calendarioModel;
        this.planillaTaller = planillaTallerModel;
        this.asignatura = asignaturaModel;
        this.profesor = profesorModel;
        this.planillaTallerOriginal = planillaTallerOriginalModel;
        this.curso = cursoModel;
        this.alumno = alumnoModel;
        this.ciclolectivo = ciclolectivoModel;
        this.obtenerPlanillaTalleresPorCiclo = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const ciclo = request.params.ciclo;
            const profesorId = request.body.profesorId;
            let match = {
                'cicloLectivo.anio': Number(ciclo),
                activo: true,
            };
            if (profesorId) {
                match = {
                    'cicloLectivo.anio': Number(ciclo),
                    activo: true,
                    profesor: ObjectId(profesorId),
                };
            }
            const opciones = [
                {
                    $lookup: {
                        from: 'profesores',
                        localField: 'profesor',
                        foreignField: '_id',
                        as: 'profesor',
                    },
                },
                {
                    $unwind: {
                        path: '$profesor',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: 'asignaturas',
                        localField: 'asignatura',
                        foreignField: '_id',
                        as: 'asignatura',
                    },
                },
                {
                    $unwind: {
                        path: '$asignatura',
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
                        preserveNullAndEmptyArrays: true,
                    },
                },
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
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $match: match,
                },
                { $sort: { _id: -1 } },
            ];
            try {
                const planillaTallerAggregate = yield this.planillaTaller.aggregate(opciones);
                response.send(planillaTallerAggregate);
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Ocurrió un error interno'));
            }
        });
        this.obtenerPlanillaTalleresPorCicloProf = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const ciclo = request.params.ciclo;
            const profesorId = request.body.profesorId;
            let match = {
                'cicloLectivo.anio': Number(ciclo),
                activo: true,
            };
            if (profesorId) {
                match = {
                    'cicloLectivo.anio': Number(ciclo),
                    activo: true,
                    'profesor._id': ObjectId(profesorId),
                };
            }
            const opciones = [
                {
                    $lookup: {
                        from: 'profesores',
                        localField: 'profesor',
                        foreignField: '_id',
                        as: 'profesor',
                    },
                },
                {
                    $unwind: {
                        path: '$profesor',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: 'asignaturas',
                        localField: 'asignatura',
                        foreignField: '_id',
                        as: 'asignatura',
                    },
                },
                {
                    $unwind: {
                        path: '$asignatura',
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
                        preserveNullAndEmptyArrays: true,
                    },
                },
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
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $match: match,
                },
                { $sort: { _id: -1 } },
            ];
            try {
                const planillaTallerAggregate = yield this.planillaTaller.aggregate(opciones);
                response.send(planillaTallerAggregate);
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Ocurrió un error interno'));
            }
        });
        this.obtenerPlanillasPorCursoCiclo = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const { curso, comision, division, cicloLectivo } = request.body;
            const opciones = [
                {
                    $lookup: {
                        from: 'profesores',
                        localField: 'profesor',
                        foreignField: '_id',
                        as: 'profesor',
                    },
                },
                {
                    $unwind: {
                        path: '$profesor',
                    },
                },
                {
                    $lookup: {
                        from: 'asignaturas',
                        localField: 'asignatura',
                        foreignField: '_id',
                        as: 'asignatura',
                    },
                },
                {
                    $unwind: {
                        path: '$asignatura',
                    },
                },
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
                    $match: {
                        'curso.curso': Number(curso),
                        'curso.comision': comision,
                        'curso.division': Number(division),
                        'cicloLectivo._id': ObjectId(cicloLectivo._id),
                    },
                },
                { $sort: { _id: -1 } },
            ];
            const planillaTallerAggregate = yield this.planillaTaller.aggregate(opciones);
            try {
                response.send({ planillasTaller: planillaTallerAggregate });
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Error Interno'));
            }
        });
        this.actualizar = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = escapeStringRegexp(request.params.id);
            try {
                const planillaTaller = request.body;
                // Si cambia las fechas buscar el ciclo
                const cicloLectivo = yield this.ciclolectivo.findOne({ anio: planillaTaller.anio });
                // Buscar el curso por comision, division, curso
                const { curso, division, comision } = planillaTaller;
                const cursoBuscar = {
                    curso,
                    comision,
                    division,
                    activo: true,
                };
                const cursoEncontrado = yield this.curso.findOneAndUpdate({ curso: Number(curso), division: Number(division), comision }, cursoBuscar, {
                    upsert: true,
                    new: true,
                });
                planillaTaller.curso = Number(planillaTaller.curso);
                const planillaUpdate = {
                    asignatura: planillaTaller.asignatura,
                    profesor: planillaTaller.profesor,
                    curso: cursoEncontrado,
                    cicloLectivo: cicloLectivo,
                    fechaInicio: moment(planillaTaller.fechaInicio).utc().format('YYYY-MM-DD'),
                    fechaFinalizacion: moment(planillaTaller.fechaFinalizacion).utc().format('YYYY-MM-DD'),
                    observacion: planillaTaller.observacion,
                    bimestre: planillaTaller.bimestre,
                    turno: planillaTaller.turno,
                    fechaCreacion: planillaTaller.fechaCreacion,
                    diasHabilitados: planillaTaller.diasHabilitados,
                    tipoCalendario: planillaTaller.tipoCalendario,
                    fechaModificacion: new Date(),
                    personalizada: planillaTaller.personalizada,
                    activo: planillaTaller.activo,
                };
                const update = yield this.planillaTaller.findByIdAndUpdate(id, planillaUpdate, { new: true });
                if (update) {
                    return response.send(update);
                }
                else {
                    return response.send(null);
                }
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Ocurrió un problema interno'));
            }
        });
        this.agregar = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const hoy = new Date(moment(now).format('YYYY-MM-DD'));
            // Agregar datos
            // La plantilla viene incompleta, hay que buscar el cicloLectivo y el curso
            const planillaData = request.body;
            const { curso, cicloLectivo, comision, division } = request.body;
            const unCicloLectivo = yield this.ciclolectivo.findOne({ anio: Number(cicloLectivo) });
            if (!unCicloLectivo) {
                next(new NotFoundException('ciclo lectivo'));
            }
            else {
                let unCurso = yield this.curso.findOne({ comision, curso, division });
                if (!unCurso) {
                    const createdCurso = new this.curso({ comision, curso, division, activo: true, fechaCreacion: hoy });
                    unCurso = yield createdCurso.save();
                }
                const ini = new Date(moment(planillaData.fechaInicio).format('YYYY-MM-DD'));
                const fin = new Date(moment(planillaData.fechaFinalizacion).format('YYYY-MM-DD'));
                const createdPlanilla = new this.planillaTaller(Object.assign(Object.assign({}, planillaData), { fechaInicio: ini, fechaFinalizacion: fin, curso: unCurso, cicloLectivo: unCicloLectivo, fechaCreacion: hoy }));
                try {
                    const savedComision = yield createdPlanilla.save();
                    // await savedComision.populate('author', '-password').execPopulate();
                    response.send(savedComision);
                }
                catch (e) {
                    console.log('[ERROR]', e);
                    next(new HttpException(400, 'Ocurrió un error al guardar la planilla'));
                }
            }
        });
        /**
         * Calculamos el total de clases de una plamnilla
         * @param request
         * @param response
         * @param next
         */
        //   NO SE DEBERIA USAR MAS, COMPROBAR PORQUE
        this.buscarTotalAsistenciaPorPlanilla = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const planillaId = request.params.id;
            const planilla = yield this.planillaTaller.findById(planillaId).populate('curso');
            if (planilla) {
                let criterioComision = null;
                switch (planilla.curso.comision) {
                    case 'A':
                        criterioComision = { comisionA: 1 };
                        break;
                    default:
                        criterioComision = null;
                        break;
                }
                let criterio = {
                    cicloLectivo: planilla.cicloLectivo,
                    fecha: {
                        $gte: new Date(planilla.fechaInicio).toISOString(),
                        $lt: new Date(planilla.fechaFinalizacion).toISOString(),
                    },
                };
                if (criterioComision) {
                    criterio = Object.assign(Object.assign({}, criterio), criterioComision);
                }
                const calendario = yield this.calendario.find(criterio);
                if (calendario) {
                    response.send({ total: calendario.length });
                }
                else {
                    response.send({ total: 0 });
                }
            }
            else {
                return next(new NotFoundException());
            }
        });
        this.obtenerPlanillaTallerPorId = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = escapeStringRegexp(request.params.id);
            const opciones = [
                {
                    $lookup: {
                        from: 'profesores',
                        localField: 'profesor',
                        foreignField: '_id',
                        as: 'profesor',
                    },
                },
                {
                    $unwind: {
                        path: '$profesor',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: 'asignaturas',
                        localField: 'asignatura',
                        foreignField: '_id',
                        as: 'asignatura',
                    },
                },
                {
                    $unwind: {
                        path: '$asignatura',
                        preserveNullAndEmptyArrays: true,
                    },
                },
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
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $match: {
                        _id: new ObjectId(id),
                    },
                },
                { $sort: { _id: -1 } },
            ];
            const planillaTallerAggregate = yield this.planillaTaller.aggregate(opciones);
            const planillaTaller = planillaTallerAggregate && planillaTallerAggregate.length > 0 ? planillaTallerAggregate[0] : null;
            if (planillaTaller) {
                response.send(planillaTaller);
            }
            else {
                next(new HttpException(400, 'No se encontró la planilla'));
            }
        });
        this.obtenerPlanillaTallerPorIdCiclo = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = escapeStringRegexp(request.params.id);
            const ciclo = escapeStringRegexp(request.params.ciclo);
            const opciones = [
                {
                    $lookup: {
                        from: 'profesores',
                        localField: 'profesor',
                        foreignField: '_id',
                        as: 'profesor',
                    },
                },
                {
                    $unwind: {
                        path: '$profesor',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: 'asignaturas',
                        localField: 'asignatura',
                        foreignField: '_id',
                        as: 'asignatura',
                    },
                },
                {
                    $unwind: {
                        path: '$asignatura',
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
                        preserveNullAndEmptyArrays: true,
                    },
                },
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
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $match: {
                        _id: ObjectId(id),
                        'cicloLectivo.anio': Number(ciclo),
                    },
                },
                // {
                //   $project: {
                //     _id: 1,
                //     planillaTallerNro: 1,
                //     asignatura: 1,
                //     profesor: {
                //       nombreCompleto: 1,
                //     },
                //     fechaInicio: 1,
                //     fechaFinalizacion: 1,
                //     bimestre: 1,
                //     observacion: 1,
                //     curso: {
                //       comision: 1,
                //       curso: 1,
                //       division: 1,
                //       cicloLectivo: ['$curso.cicloLectivo'],
                //     },
                //   },
                // },
                {
                    $sort: {
                        _id: -1,
                    },
                },
            ];
            const planillaTallerAggregate = yield this.planillaTaller.aggregate(opciones);
            const planillaTaller = planillaTallerAggregate && planillaTallerAggregate.length > 0 ? planillaTallerAggregate[0] : null;
            if (planillaTaller) {
                response.send(planillaTaller);
            }
            else {
                next(new HttpException(400, 'No se encontró la planilla'));
            }
        });
        this.paginar = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const parametros = request.query;
            let campo = null;
            switch (parametros.sortField) {
                case 'cicloLectivo':
                    campo = 'comision.cicloLectivo';
                    break;
                case 'asignatura':
                    campo = 'asignatura.detalle';
                    break;
                case 'profesor':
                    campo = 'profesor.nombreCompleto';
                    break;
                default:
                    campo = parametros.sortField;
                    break;
            }
            // SORT ---------------
            const sort = parametros.sortField ? { [campo]: parametros.sortOrder } : null;
            // OPCIONES ---------------
            const opciones = [
                {
                    $lookup: {
                        from: 'comisiones',
                        localField: 'comision',
                        foreignField: '_id',
                        as: 'comision',
                    },
                },
                { $unwind: '$comision', preserveNullAndEmptyArrays: true },
                {
                    $lookup: {
                        from: 'profesores',
                        localField: 'profesor',
                        foreignField: '_id',
                        as: 'profesor',
                    },
                },
                { $unwind: '$profesor', preserveNullAndEmptyArrays: true },
                {
                    $lookup: {
                        from: 'asignaturas',
                        localField: 'asignatura',
                        foreignField: '_id',
                        as: 'asignatura',
                    },
                },
                { $unwind: '$asignatura', preserveNullAndEmptyArrays: true },
                {
                    $addFields: {
                        fechaInicioString: {
                            $dateToString: { format: '%d/%m/%Y', date: '$fechaInicio' },
                        },
                    },
                },
            ];
            // FILTER AGGREGATE ---------------
            let match = [];
            let project = [];
            if (parametros.filter !== '') {
                match.push({
                    'asignatura.detalle': { $regex: parametros.filter, $options: 'i' },
                });
                match.push({
                    'profesor.nombreCompleto': { $regex: parametros.filter, $options: 'i' },
                });
                match.push({ bimestre: { $regex: parametros.filter, $options: 'i' } });
                match.push({ turno: { $regex: parametros.filter, $options: 'i' } });
                match.push({ planillaTallerNroString: { $regex: parametros.filter, $options: 'i' } });
                match.push({
                    comisionCompleta: {
                        $regex: parametros.filter,
                        $options: 'i',
                    },
                });
                match.push({ observacion: { $regex: parametros.filter, $options: 'i' } });
                match.push({
                    fechaInicioString: {
                        // input: { $toString: "$comision.cicloLectivo" },
                        $regex: parametros.filter,
                        $options: 'g',
                    },
                });
                // Tiene su propio campo
                match.push({
                    cicloLectivo: {
                        // input: { $toString: "$comision.cicloLectivo" },
                        $regex: parametros.filter,
                        $options: 'g',
                    },
                });
                opciones.push({
                    $addFields: {
                        fechaInicioString: {
                            $dateToString: { format: '%d/%m/%Y', date: '$fechaInicio' },
                        },
                        cicloLectivo: { $toString: '$comision.cicloLectivo' },
                        planillaTallerNroString: { $toString: '$planillaTallerNro' },
                        comisionCompleta: {
                            $concat: [
                                '0',
                                { $toString: '$comision.curso' },
                                ' / ',
                                { $toString: '$comision.comision' },
                                ' / ',
                                '0',
                                { $toString: '$comision.division' },
                            ],
                        },
                    },
                });
                opciones.push({ $match: { $or: match } });
            }
            const aggregate = this.planillaTaller.aggregate(opciones);
            this.planillaTaller.aggregatePaginate(aggregate, {
                // populate: ["asignatura", "profesor", "comision"],
                page: Number(parametros.pageNumber),
                limit: Number(parametros.pageSize),
                sort,
            }, (err, result) => {
                if (err) {
                    console.log('[ERROR]', err);
                }
                // result.docs
                // result.total
                // result.limit - 10
                // result.page - 3
                // result.pages
                response.send(result);
            });
        });
        this.migrarPlanillaTalleres = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const now = new Date();
                const hoy = new Date(moment(now).format('YYYY-MM-DD'));
                const planillasTalleres = yield this.planillaTallerOriginal.find();
                const ciclosLectivos = yield this.ciclolectivo.find();
                const planillasTalleresRefactorizados = yield Promise.all(planillasTalleres.map((x, index) => __awaiter(this, void 0, void 0, function* () {
                    let asig = [];
                    let prof = [];
                    try {
                        asig = yield this.asignatura.findOne({
                            IdAsignarutas: x.id_asignatura,
                        });
                    }
                    catch (ero) {
                        console.log('ero', ero);
                    }
                    try {
                        prof = yield this.profesor.findOne({
                            id_profesores: x.Id_Profesor,
                        });
                    }
                    catch (ero) {
                        console.log('ero2', ero);
                    }
                    // Cursos
                    const nuevo = {
                        division: x.division,
                        comision: x.comision ? x.comision : null,
                        curso: x.Tcurso,
                        // cicloLectivo: [nuevoCiclo],
                        fechaCreacion: hoy,
                        activo: true,
                    };
                    let savedCurso = null;
                    if (x.comision && x.comision.length > 0 && x.ciclo_lectivo !== 0 && x.ciclo_lectivo !== 20) {
                        let match = {
                            division: x.division,
                            comision: x.comision,
                            curso: x.Tcurso,
                        };
                        // Si no tiene comisione entonces no es taller
                        if (!x.comision || x.comision.trim().length < 1) {
                            match = {
                                division: x.division,
                                curso: x.Tcurso,
                            };
                        }
                        savedCurso = yield this.curso.findOneAndUpdate(match, nuevo, {
                            upsert: true,
                            new: true,
                            setDefaultsOnInsert: true,
                        });
                    }
                    else {
                        return null;
                    }
                    const cl = yield ciclosLectivos.filter((d) => Number(d.anio) === Number(x.ciclo_lectivo));
                    const fechadateIni = new Date(x.FechaInicio);
                    const ini = new Date(moment(fechadateIni).format('YYYY-MM-DD'));
                    const fechadateFin = new Date(x.FechaFinalizacion);
                    const fin = new Date(moment(fechadateFin).format('YYYY-MM-DD'));
                    // const ini = new Date(moment(x.FechaInicio).format('YYYY-MM-DD'));
                    // const fin = new Date(moment(x.FechaFinalizacion).format('YYYY-MM-DD'));
                    const unaPlanillaTaller = {
                        planillaTallerNro: 100 + index,
                        planillaTallerId: x.id_planilla_de_taller,
                        asignatura: asig,
                        profesor: prof,
                        curso: savedCurso,
                        // curso: x.Tcurso,
                        // division: x.division,
                        // comision: x.comision,
                        cicloLectivo: cl[0],
                        observacion: x.Observacion,
                        fechaInicio: ini,
                        fechaFinalizacion: fin,
                        bimestre: x.Bimestre ? x.Bimestre : 'Sin Registrar',
                        fechaCreacion: hoy,
                        activo: true,
                    };
                    return unaPlanillaTaller;
                })));
                try {
                    const filtrados = planillasTalleresRefactorizados.filter((x) => {
                        return x !== null && typeof x !== 'undefined';
                    });
                    const savedPlanillaTallers = yield this.planillaTaller.insertMany(filtrados);
                    response.send({
                        savedPlanillaTallers,
                    });
                }
                catch (e) {
                    console.log('ERROR', e);
                    // response.send({
                    //   error: planillasTalleresRefactorizados,
                    // });
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
        console.log('PlanillaTallerController/initializeRoutes');
        this.router.get(`${this.path}/migrar`, this.migrarPlanillaTalleres);
        this.router.get(`${this.path}/paginar`, passport.authenticate('jwt', { session: false }), this.paginar);
        this.router.get(`${this.path}/ciclo/:ciclo`, passport.authenticate('jwt', { session: false }), this.obtenerPlanillaTalleresPorCiclo);
        this.router.post(`${this.path}/ciclo-profesor/:ciclo`, passport.authenticate('jwt', { session: false }), this.obtenerPlanillaTalleresPorCicloProf);
        this.router.get(`${this.path}/filtro/:id/:ciclo`, passport.authenticate('jwt', { session: false }), this.obtenerPlanillaTallerPorIdCiclo);
        this.router.get(`${this.path}/:id`, passport.authenticate('jwt', { session: false }), this.obtenerPlanillaTallerPorId);
        this.router.get(`${this.path}/:id/total-asistencias`, passport.authenticate('jwt', { session: false }), this.buscarTotalAsistenciaPorPlanilla);
        this.router.put(`${this.path}`, passport.authenticate('jwt', { session: false }), this.agregar);
        this.router.post(`${this.path}/por-curso-ciclo`, passport.authenticate('jwt', { session: false }), this.obtenerPlanillasPorCursoCiclo);
        this.router.patch(`${this.path}/:id`, passport.authenticate('jwt', { session: false }), this.actualizar);
    }
}
export default PlanillaTallerController;
//# sourceMappingURL=planillaTaller.controller.js.map