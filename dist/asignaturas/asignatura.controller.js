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
import CreateAsignaturaDto from './asignatura.dto';
import asignaturaModel from './asignatura.model';
import asignaturaOriginalModel from './asignaturaOriginal.model';
import cursoModel from '../cursos/curso.model';
import passport from 'passport';
import moment from 'moment';
class AsignaturaController {
    constructor() {
        this.path = '/asignaturas';
        this.router = Router();
        this.curso = cursoModel;
        this.asignatura = asignaturaModel;
        this.asignaturaOriginal = asignaturaOriginalModel;
        this.test = (request, response) => __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const hoy = new Date(moment(now).format('YYYY-MM-DD'));
            const asignaturaData = {
                detalle: 'detalle',
                tipoAsignatura: 'ALGO',
                tipoCiclo: 'ALGO',
                tipoFormacion: 'ALGO',
                curso: 1,
                meses: 4,
                horasCatedraAnuales: 4,
                horasCatedraSemanales: 2,
                activo: true,
                fechaCreacion: hoy,
            };
            try {
                const createdAsignatura = new this.asignatura(Object.assign({}, asignaturaData));
                const saved = yield createdAsignatura.save();
                // await savedProfesor.populate('author', '-password').execPopulate();
                response.send(saved);
            }
            catch (error) {
                console.log('ERROR', error);
                response.send(error.message);
            }
        });
        this.getAllAsignaturas = (request, response) => __awaiter(this, void 0, void 0, function* () {
            const asignaturas = yield this.asignatura.find().sort('_id'); //.populate('author', '-password') populate con imagen
            response.send(asignaturas);
        });
        this.getAllAsignaturasHabilitadas = (request, response) => __awaiter(this, void 0, void 0, function* () {
            const asignaturas = yield this.asignatura.find({ activo: true }).sort('_id'); //.populate('author', '-password') populate con imagen
            response.send(asignaturas);
        });
        this.obtenerAsignaturaPorId = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const asignatura = yield this.asignatura.findById(id);
                if (asignatura) {
                    response.send(asignatura);
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
        this.migrar = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const asignaturas = yield this.asignaturaOriginal.find();
                const now = new Date();
                const hoy = new Date(moment(now).format('YYYY-MM-DD'));
                const asignaturasRefactorizados = yield Promise.all(asignaturas.map((x, index) => __awaiter(this, void 0, void 0, function* () {
                    // const cursos = await this.curso.find({ curso: Number(x.Tcurso) });
                    if (!x.DetalleAsignatura || x.DetalleAsignatura.length < 1) {
                        return null;
                    }
                    const unaAsignatura = {
                        // _id: x._id,
                        // asignaturaNro: 100 + index,
                        detalle: x.DetalleAsignatura,
                        tipoAsignatura: x.TipoAsignatura ? (x.TipoAsignatura === 'Materia' ? 'Aula' : x.TipoAsignatura) : null,
                        tipoCiclo: x.TipoCiclo.toUpperCase(),
                        tipoFormacion: x.Tipodeformacion,
                        curso: Number(x.Tcurso),
                        meses: Number(x.Meses),
                        horasCatedraAnuales: x.HorasCatedraAnuales ? Number(x.HorasCatedraAnuales) : 0,
                        horasCatedraSemanales: x.HorasCatedraSemanales ? Number(x.HorasCatedraSemanales) : 0,
                        fechaCreacion: hoy,
                        activo: true,
                        IdAsignarutas: x.IdAsignarutas,
                    };
                    return unaAsignatura;
                })));
                try {
                    const filtrados = asignaturasRefactorizados.filter((x) => {
                        return x !== null && typeof x !== 'undefined';
                    });
                    const savedAsignaturas = yield this.asignatura.insertMany(filtrados);
                    response.send({
                        savedAsignaturas,
                    });
                }
                catch (e) {
                    console.log('ERROR', e);
                    next(new HttpException(500, 'Ocurrió un error al guardar las asignaturas'));
                }
            }
            catch (e2) {
                console.log('ERROR', e2);
                next(new HttpException(400, 'Parametros Incorrectos'));
            }
        });
        this.getAsignaturaById = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const asignatura = yield this.asignatura.findById(id).populate('imagenes');
                if (asignatura) {
                    response.send(asignatura);
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
        this.modifyAsignatura = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            const asignaturaData = request.body;
            try {
                const asignatura = yield this.asignatura.findByIdAndUpdate(id, asignaturaData, {
                    new: true,
                });
                if (asignatura) {
                    response.send(asignatura);
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
        this.createAsignatura = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            // Agregar datos
            const asignaturaData = request.body;
            const createdAsignatura = new this.asignatura(Object.assign({}, asignaturaData));
            const savedAsignatura = yield createdAsignatura.save();
            // await savedAsignatura.populate('author', '-password').execPopulate();
            response.send(savedAsignatura);
        });
        this.createAsignaturaComplete = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            // Agregar foto
            // Agregar datos
            const asignaturaData = request.body;
            const createdAsignatura = new this.asignatura(Object.assign({}, asignaturaData));
            const savedAsignatura = yield createdAsignatura.save();
            //     const imagen: ImagenDto = {
            //       descripcion:''
            // posicion:.posicion,
            // src:''
            //     }
            // await savedAsignatura.populate('author', '-password').execPopulate();
            response.send(savedAsignatura);
        });
        this.deleteAsignatura = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const successResponse = yield this.asignatura.findByIdAndDelete(id);
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
        this.deshabilitarAsignatura = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const successResponse = yield this.asignatura.findByIdAndUpdate(id, {
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
        this.habilitarAsignatura = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const successResponse = yield this.asignatura.findByIdAndUpdate(id, {
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
        this.router.get(`${this.path}/migrar`, this.migrar);
        this.router.get(`${this.path}/test`, this.test);
        this.router.get(`${this.path}`, passport.authenticate('jwt', { session: false }), this.getAllAsignaturas);
        this.router.get(`${this.path}/habilitados`, passport.authenticate('jwt', { session: false }), this.getAllAsignaturasHabilitadas);
        // this.router.get(`${this.path}/paginado`, this.getAllAsignaturasPag);
        // Using the  route.all in such a way applies the middleware only to the route
        // handlers in the chain that match the  `${this.path}/*` route, including  POST /asignaturas.
        this.router
            .all(`${this.path}/*`, passport.authenticate('jwt', { session: false }))
            .patch(`${this.path}/:id`, validationMiddleware(CreateAsignaturaDto, true), this.modifyAsignatura)
            .get(`${this.path}/:id`, this.obtenerAsignaturaPorId)
            .delete(`${this.path}/:id`, this.deleteAsignatura)
            .put(`${this.path}/deshabilitar/:id`, this.deshabilitarAsignatura)
            .put(`${this.path}/habilitar/:id`, this.habilitarAsignatura)
            .put(this.path, validationMiddleware(CreateAsignaturaDto), 
        // checkPermisos(rolesEnum.ADMIN), // elimintar. test
        this.createAsignatura);
    }
}
export default AsignaturaController;
//# sourceMappingURL=asignatura.controller.js.map