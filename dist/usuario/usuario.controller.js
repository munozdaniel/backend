var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Router } from 'express';
import UserNotFoundException from '../exceptions/UserNotFoundException';
import usuarioModel from './usuario.model';
import HttpException from '../exceptions/HttpException';
import escapeStringRegexp from 'escape-string-regexp';
import NotFoundException from '../exceptions/NotFoundException';
import passport from 'passport';
import axios from 'axios';
class UsuarioController {
    constructor() {
        this.path = '/usuarios';
        this.router = Router();
        this.usuario = usuarioModel;
        this.obtenerUsuarios = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const usuario = yield this.usuario.find({ activo: true }).populate('profesor');
                if (usuario) {
                    response.send(usuario);
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
        this.obtenerUsuariosInactivos = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const usuario = yield this.usuario.find({ activo: false });
                if (usuario) {
                    response.send(usuario);
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
        this.asignarProfesor = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            const profesor = request.body.profesor;
            try {
                const usuario = yield this.usuario.findByIdAndUpdate(id, { profesor }, { new: true });
                if (usuario) {
                    response.send({ status: 200, usuario });
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
        this.cambiarRol = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            const rol = escapeStringRegexp(request.body.rol);
            const roles = ['PROFESOR', 'ADMIN', 'DIRECTOR', 'JEFETALLER', 'PRECEPTOR'];
            const index = roles.findIndex((x) => rol === x);
            if (index === -1) {
                next(new HttpException(400, 'El rol que desea agregar no se encuentra disponible'));
            }
            try {
                const usuario = yield this.usuario.findByIdAndUpdate(id, { rol: rol }, { new: true });
                if (usuario) {
                    response.send({ status: 200, usuario });
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
        this.activarUsuario = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const usuario = yield this.usuario.findByIdAndUpdate(id, { activo: true }, { new: true });
                if (usuario) {
                    response.send(usuario);
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
        // -----
        // ---------
        this.cambiarPassword = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            console.log('cambiarPassword', request.body);
            const { usuarioId, actual, password } = request.body;
            const usuarioEncontrado = yield this.usuario.findById(usuarioId);
            // const usuarioPassportModel: any = usuarioModel;
            usuarioEncontrado.changePassword(actual, password, (err, user) => __awaiter(this, void 0, void 0, function* () {
                if (err || !user) {
                    return response.status(400).json({ error: 'Ocurrió un error al actualizar la contraseña' });
                }
                try {
                    // TODO:
                    // await this.enviarEmailConNuevoPassword(usuarioEncontrado, password);
                    // response.status(200).send({ usuario: user });
                    next(new HttpException(400, 'INCOMPLETO'));
                }
                catch (error) {
                    console.log('[ERROR]', error);
                    next(new HttpException(400, 'No se pudo enviar el correo'));
                }
            }));
        });
        // -----
        this.test = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            response.send({ success: true, code: 200, message: 'YEahh baby' });
        });
        this.enviarLink = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const email = request.params.email;
            const usuario = yield this.usuario.findOne({ email });
            if (!usuario) {
                return response.status(401).send({ usuario: null, success: false });
            }
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
                        name: 'Recuperar Contraseña - CET 30',
                        email: 'no-reply@propet.com',
                    },
                    to: [
                        {
                            email: email,
                            name: usuario.apellido + ',' + usuario.nombre,
                        },
                    ],
                    subject: 'Recuperar Contraseña',
                    params: {
                        link: ENTORNO === 'desarrollo'
                            ? `http://localhost:4200/auth/change/${usuario._id}`
                            : `http://app.cet30.edu.ar/auth/change/${usuario._id}`,
                    },
                    templateId: 2,
                }),
            };
            const headers = { headers: options.headers };
            try {
                const resultado = yield axios.post(url, options.body, headers);
                response.status(200).send({ usuario, success: true });
            }
            catch (error) {
                console.log('[ERROR]', error);
                response.status(200).send({ usuario, success: false });
            }
        });
        this.obtenerUsuarioPorId = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            const userQuery = yield this.usuario.findById(id);
            if (request.query.withPosts === 'true') {
                userQuery.populate('posts').exec();
            }
            const user = yield userQuery;
            if (user) {
                response.send(user);
            }
            else {
                next(new UserNotFoundException(id));
            }
        });
        this.obtenerUsuarioPorIdCompleto = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            const userQuery = this.usuario.findById(id);
            if (request.query.withPosts === 'true') {
                userQuery.populate('tarjeta').exec();
            }
            const user = yield userQuery;
            if (user) {
                response.send(user);
            }
            else {
                next(new UserNotFoundException(id));
            }
        });
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get(`${this.path}/test`, this.test);
        this.router.get(`${this.path}/:id`, passport.authenticate('jwt', { session: false }), this.obtenerUsuarioPorId);
        this.router.get(`${this.path}/link/:email`, passport.authenticate('jwt', { session: false }), this.enviarLink);
        this.router.get(`${this.path}/completo/:id`, passport.authenticate('jwt', { session: false }), this.obtenerUsuarioPorIdCompleto);
        this.router.post(`${this.path}/change-password`, passport.authenticate('jwt', { session: false }), 
        // passport.authenticate('jwt', { session: false }),
        this.cambiarPassword);
        this.router.post(`${this.path}/change-role/:id`, passport.authenticate('jwt', { session: false }), 
        // passport.authenticate('jwt', { session: false }),
        this.cambiarRol);
        this.router.post(`${this.path}/asignar-profesor/:id`, passport.authenticate('jwt', { session: false }), 
        // passport.authenticate('jwt', { session: false }),
        this.asignarProfesor);
        this.router.get(`${this.path}`, passport.authenticate('jwt', { session: false }), 
        // passport.authenticate('jwt', { session: false }),
        this.obtenerUsuarios);
        this.router.get(`${this.path}`, passport.authenticate('jwt', { session: false }), 
        // passport.authenticate('jwt', { session: false }),
        this.obtenerUsuariosInactivos);
        this.router.get(`${this.path}/activar/:id`, passport.authenticate('jwt', { session: false }), 
        // passport.authenticate('jwt', { session: false }),
        this.activarUsuario);
    }
    // -----
    enviarEmailConNuevoPassword(user, contrasena) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}
export default UsuarioController;
//# sourceMappingURL=usuario.controller.js.map