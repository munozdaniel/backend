var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import HttpException from '../exceptions/HttpException';
import { Router } from 'express';
import NotFoundException from '../exceptions/NotFoundException';
import validationMiddleware from '../middleware/validation.middleware';
import CreateCursoDto from './curso.dto';
import cursoModel from './curso.model';
import comisionOriginalModel from './comisionOriginal.model';
import alumnoModel from '../alumnos/alumno.model';
import comisionUnicaModel from './comisionUnica.model';
import moment from 'moment';
import passport from 'passport';
class CursoController {
    constructor() {
        this.path = '/cursos';
        this.router = Router();
        this.curso = cursoModel;
        this.comisionOriginal = comisionOriginalModel;
        this.comisionSql = comisionUnicaModel;
        this.alumno = alumnoModel;
        this.buscarCursoesPorCicloLectivo = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const now = new Date();
                const hoy = new Date(moment(now).format('YYYY-MM-DD'));
                const curso = request.body.curso;
                const unaCurso = yield this.curso.findOne({
                    // cicloLectivo: curso.cicloLectivo,
                    comision: curso.comision,
                    division: Number(curso.division),
                    curso: Number(curso.curso),
                    activo: curso.activo,
                });
                // .populate(" alumno"); //.populate('author', '-password') populate con imagen
                if (unaCurso) {
                    response.send(unaCurso);
                }
                else {
                    curso.fechaCreacion = hoy;
                    const cursoData = curso;
                    const createdCurso = new this.curso(Object.assign({}, cursoData));
                    const savedCurso = yield createdCurso.save();
                    // await savedCurso.populate('author', '-password').execPopulate();
                    response.send(savedCurso);
                }
            }
            catch (e) {
                console.log('[ERROR]', e);
                next(new HttpException(400, 'Parametros Incorrectos'));
            }
        });
        this.getAllCursos = (request, response) => __awaiter(this, void 0, void 0, function* () {
            const cursos = yield this.curso.find().sort('_id').populate('alumno'); //.populate('author', '-password') populate con imagen
            response.send(cursos);
        });
        this.verCursoesOriginales = (request, response) => __awaiter(this, void 0, void 0, function* () {
            const cursos = yield this.comisionOriginal.find().sort('_id'); //.populate('author', '-password') populate con imagen
            response.send(cursos);
        });
        this.getAllCursoesHabilitadas = (request, response) => __awaiter(this, void 0, void 0, function* () {
            const cursos = yield this.curso.find({ activo: true }).sort({ _id: -1 }); //.populate('author', '-password') populate con imagen
            response.send(cursos);
        });
        this.obtenerCursoPorId = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const curso = yield this.curso.findById(id);
                if (curso) {
                    response.send(curso);
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
        this.getCursoByAlumnoId = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const curso = yield this.curso.findById({ alumnoId: id });
                if (curso) {
                    response.send(curso);
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
        this.migrarCursoesUnicas = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const now = new Date();
                const hoy = new Date(moment(now).format('YYYY-MM-DD'));
                const cursos = yield this.comisionSql.find();
                const cursosRefactorizados = yield Promise.all(cursos.map((x, index) => __awaiter(this, void 0, void 0, function* () {
                    const unaCurso = {
                        // _id: x._id,
                        // alumnoId: x.id_alumnos,
                        cursoNro: 100 + index,
                        comision: x.comision ? x.comision.toUpperCase() : 'Sin Registrar',
                        cicloLectivo: x.ciclo_lectivo ? Number(x.ciclo_lectivo) : null,
                        curso: x.Tcurso ? Number(x.Tcurso) : null,
                        division: x.Division ? Number(x.Division) : null,
                        // condicion: x.Condicion
                        //   ? x.Condicion.toUpperCase()
                        //   : 'Sin Registrar',
                        fechaCreacion: hoy,
                        activo: true,
                    };
                    return unaCurso;
                })));
                try {
                    const savedCursos = yield this.curso.insertMany(cursosRefactorizados);
                    response.send({
                        savedCursos,
                    });
                }
                catch (e) {
                    console.log('ERROR', e);
                    next(new HttpException(500, 'Ocurrió un error al guardar las cursos'));
                }
            }
            catch (e2) {
                console.log('ERROR', e2);
                next(new HttpException(400, 'Parametros Incorrectos'));
            }
        });
        this.migrarCursoes = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const now = new Date();
                const hoy = new Date(moment(now).format('YYYY-MM-DD'));
                const cursos = yield this.comisionOriginal.find();
                const cursosRefactorizados = yield Promise.all(cursos.map((x, index) => __awaiter(this, void 0, void 0, function* () {
                    if (!x.Tcurso) {
                    }
                    let alo = null;
                    try {
                        alo = yield this.alumno.find({ alumnoId: x.id_alumnos });
                    }
                    catch (ero) {
                        console.log('ero', ero);
                    }
                    const unaCurso = {
                        // _id: x._id,
                        // alumnoId: x.id_alumnos,
                        alumno: alo,
                        cursoNro: 100 + index,
                        comision: x.comision ? x.comision.toUpperCase() : 'Sin Registrar',
                        cicloLectivo: x.ciclo_lectivo ? Number(x.ciclo_lectivo) : null,
                        curso: x.Tcurso ? Number(x.Tcurso) : null,
                        division: x.Division ? Number(x.Division) : null,
                        condicion: x.Condicion ? x.Condicion.toUpperCase() : 'Sin Registrar',
                        fechaCreacion: hoy,
                        activo: true,
                    };
                    return unaCurso;
                })));
                try {
                    const savedCursos = yield this.curso.insertMany(cursosRefactorizados);
                    response.send({
                        savedCursos,
                    });
                }
                catch (e) {
                    console.log('ERROR', e);
                    next(new HttpException(500, 'Ocurrió un error al guardar las cursos'));
                }
            }
            catch (e2) {
                console.log('ERROR', e2);
                next(new HttpException(400, 'Parametros Incorrectos'));
            }
        });
        this.getCursoById = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const curso = yield this.curso.findById(id).populate('imagenes');
                if (curso) {
                    response.send(curso);
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
        this.modifyCurso = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            const cursoData = request.body;
            try {
                const curso = yield this.curso.findByIdAndUpdate(id, cursoData, {
                    new: true,
                });
                if (curso) {
                    response.send(curso);
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
        this.createCurso = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            // Agregar datos
            const cursoData = request.body;
            const createdCurso = new this.curso(Object.assign({}, cursoData));
            const savedCurso = yield createdCurso.save();
            // await savedCurso.populate('author', '-password').execPopulate();
            response.send(savedCurso);
        });
        this.createCursoComplete = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            // Agregar foto
            // Agregar datos
            const cursoData = request.body;
            const createdCurso = new this.curso(Object.assign({}, cursoData));
            const savedCurso = yield createdCurso.save();
            //     const imagen: ImagenDto = {
            //       descripcion:''
            // posicion:.posicion,
            // src:''
            //     }
            // await savedCurso.populate('author', '-password').execPopulate();
            response.send(savedCurso);
        });
        this.deleteCurso = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            console.log('deleteCurso');
            const id = request.params.id;
            try {
                const successResponse = yield this.curso.findByIdAndDelete(id);
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
        this.deshabilitarCurso = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const successResponse = yield this.curso.findByIdAndUpdate(id, {
                    activo: false,
                });
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
        this.habilitarCurso = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const successResponse = yield this.curso.findByIdAndUpdate(id, {
                    activo: true,
                });
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
        console.log('CursoController/initializeRoutes');
        this.router.get(`${this.path}/migrar-unicas`, passport.authenticate('jwt', { session: false }), this.migrarCursoesUnicas);
        this.router.get(`${this.path}/migrar`, passport.authenticate('jwt', { session: false }), this.migrarCursoes);
        // this.router.get(`${this.path}/migraralumnos`, this.migrarAlumnos);
        this.router.post(`${this.path}/parametros`, passport.authenticate('jwt', { session: false }), this.buscarCursoesPorCicloLectivo // se usa en parametros y ficha-alumnos
        );
        this.router.get(`${this.path}/originales`, passport.authenticate('jwt', { session: false }), this.verCursoesOriginales);
        this.router.get(`${this.path}`, passport.authenticate('jwt', { session: false }), this.getAllCursos);
        this.router.get(`${this.path}/habilitados`, passport.authenticate('jwt', { session: false }), this.getAllCursoesHabilitadas);
        this.router.get(`${this.path}/:id`, passport.authenticate('jwt', { session: false }), this.getCursoByAlumnoId);
        // this.router.get(`${this.path}/paginado`, this.getAllCursosPag);
        // Using the  route.all in such a way applies the middleware only to the route
        // handlers in the chain that match the  `${this.path}/*` route, including  POST /cursos.
        this.router
            .all(`${this.path}/*`)
            .patch(`${this.path}/:id`, validationMiddleware(CreateCursoDto, true), this.modifyCurso)
            .get(`${this.path}/:id`, this.obtenerCursoPorId)
            .delete(`${this.path}/:id`, this.deleteCurso)
            .put(`${this.path}/deshabilitar/:id`, this.deshabilitarCurso)
            .put(`${this.path}/habilitar/:id`, this.habilitarCurso)
            .put(this.path, validationMiddleware(CreateCursoDto), 
        // checkPermisos(rolesEnum.ADMIN), // elimintar. test
        this.createCurso);
    }
}
export default CursoController;
//# sourceMappingURL=curso.controller.js.map