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
import CreateProfesorDto from './profesor.dto';
import profesorModel from './profesor.model';
import profesorOriginalModel from './profesorOriginal.model';
import moment from 'moment';
import passport from 'passport';
class ProfesorController {
    constructor() {
        this.path = '/profesores';
        this.router = Router();
        this.profesorOriginal = profesorOriginalModel;
        this.test = (request, response) => __awaiter(this, void 0, void 0, function* () {
            const profesorData = {
                activo: true,
                nombreCompleto: 'Orlando Sotelo',
                telefono: '123123',
                celular: null,
                email: '',
                formacion: '',
                titulo: '',
                fechaCreacion: new Date(),
            };
            try {
                const createdProfesor = new this.profesor(Object.assign({}, profesorData));
                const savedProfesor = yield createdProfesor.save();
                // await savedProfesor.populate('author', '-password').execPopulate();
                response.send(savedProfesor);
            }
            catch (error) {
                console.log('ERROR', error);
                response.send(error.message);
            }
        });
        this.getAllProfesors = (request, response) => __awaiter(this, void 0, void 0, function* () {
            const profesores = yield this.profesor.find().sort('_id'); //.populate('author', '-password') populate con imagen
            response.send(profesores);
        });
        this.getAllProfesoresHabilitadas = (request, response) => __awaiter(this, void 0, void 0, function* () {
            const profesores = yield this.profesor.find({ activo: true }).sort('_id'); //.populate('author', '-password') populate con imagen
            response.send(profesores);
        });
        this.obtenerProfesorPorId = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const profesor = yield this.profesor.findById(id);
                if (profesor) {
                    response.send(profesor);
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
                const now = new Date();
                const hoy = new Date(moment(now).format('YYYY-MM-DD'));
                const profesores = yield this.profesorOriginal.find();
                const profesoresRefactorizados = profesores.map((x, index) => {
                    const unaProfesor = {
                        // _id: x._id,
                        id_profesores: x.id_profesores,
                        // profesorNro: 100 + index,
                        nombreCompleto: x.nombre_y_apellido,
                        telefono: x.telefono,
                        celular: null,
                        email: x.mail,
                        formacion: x.formacion,
                        titulo: x.tipo_de_titulacion,
                        fechaCreacion: hoy,
                        activo: true,
                    };
                    return unaProfesor;
                });
                try {
                    const savedProfesors = yield this.profesor.insertMany(profesoresRefactorizados);
                    response.send({
                        savedProfesors,
                    });
                }
                catch (e) {
                    console.log('ERROR', e);
                    next(new HttpException(500, 'Ocurrió un error al guardar las profesores'));
                }
            }
            catch (e2) {
                console.log('ERROR', e2);
                next(new HttpException(400, 'Parametros Incorrectos'));
            }
        });
        this.getProfesorById = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const profesor = yield this.profesor.findById(id).populate('imagenes');
                if (profesor) {
                    response.send(profesor);
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
        this.modifyProfesor = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            const profesorData = request.body;
            try {
                const profesor = yield this.profesor.findByIdAndUpdate(id, profesorData, {
                    new: true,
                });
                if (profesor) {
                    response.send(profesor);
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
        this.createProfesor = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            // Agregar datos
            const profesorData = request.body;
            const createdProfesor = new this.profesor(Object.assign({}, profesorData));
            const savedProfesor = yield createdProfesor.save();
            // await savedProfesor.populate('author', '-password').execPopulate();
            response.send(savedProfesor);
        });
        this.deleteProfesor = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const successResponse = yield this.profesor.findByIdAndDelete(id);
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
        this.deshabilitarProfesor = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const successResponse = yield this.profesor.findByIdAndUpdate(id, {
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
        this.habilitarProfesor = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const successResponse = yield this.profesor.findByIdAndUpdate(id, {
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
        this.profesor = profesorModel;
        this.initializeRoutes();
    }
    initializeRoutes() {
        console.log('ProfesorController/initializeRoutes');
        this.router.get(`${this.path}/test2`, this.getAllProfesors);
        this.router.get(`${this.path}/test`, this.test);
        this.router.get(`${this.path}/migrar`, this.migrar);
        this.router.get(`${this.path}/habilitados`, passport.authenticate('jwt', { session: false }), this.getAllProfesoresHabilitadas);
        this.router.get(`${this.path}/:id`, passport.authenticate('jwt', { session: false }), this.getProfesorById);
        // this.router.get(`${this.path}/paginado`, this.getAllProfesorsPag);
        // Using the  route.all in such a way applies the middleware only to the route
        // handlers in the chain that match the  `${this.path}/*` route, including  POST /profesores.
        this.router
            .all(`${this.path}/*`, passport.authenticate('jwt', { session: false }))
            .patch(`${this.path}/:id`, validationMiddleware(CreateProfesorDto, true), this.modifyProfesor)
            .get(`${this.path}/:id`, this.obtenerProfesorPorId)
            .delete(`${this.path}/:id`, this.deleteProfesor)
            .put(`${this.path}/deshabilitar/:id`, this.deshabilitarProfesor)
            .put(`${this.path}/habilitar/:id`, this.habilitarProfesor)
            .put(this.path, validationMiddleware(CreateProfesorDto), 
        // checkPermisos(rolesEnum.ADMIN), // elimintar. test
        this.createProfesor);
    }
}
export default ProfesorController;
//# sourceMappingURL=profesor.controller.js.map