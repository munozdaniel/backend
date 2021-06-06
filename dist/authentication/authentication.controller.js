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
import jwt from 'jsonwebtoken';
import { config } from '../passport/config';
import validationMiddleware from '../middleware/validation.middleware';
import AuthenticationService from './authentication.service';
import LogInDto from './logIn.dto';
import usuarioModel from '../usuario/usuario.model';
import UsuarioDto from '../usuario/usuario.dto';
import UserWithThatEmailAlreadyExistsException from '../exceptions/UserWithThatEmailAlreadyExistsException';
import passport from 'passport';
import HttpException from '../exceptions/HttpException';
import axios from 'axios';
class AuthenticationController {
    constructor() {
        this.path = '/auth';
        this.router = Router();
        this.authenticationService = new AuthenticationService();
        this.usuario = usuarioModel;
        // -----
        this.forgotPassword = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const { email } = request.body;
            this.usuario.findOne({ email }, (err, user) => __awaiter(this, void 0, void 0, function* () {
                if (err || !user) {
                    return response.status(400).json({ error: 'El usuario con el email ingresado no existe' });
                }
                // Envio el email con un link y ahi se redirecciona para que setee la nueva contraseña
                // Con passport-mongoose-local recuperamos la contraseña
                try {
                    // const resultado: any = await this.enviarEmail(email);
                    // if (resultado) {
                    //   response.status(200).send({ usuario: user });
                    // } else {
                    next(new HttpException(400, 'No se pudo enviar el email'));
                    // }
                }
                catch (error) {
                    console.log('[ERROR]', error);
                    next(new HttpException(400, 'Ocurrió un error'));
                }
            }));
        });
        // ---------
        this.setNuevoPassword = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const usuarioPassportModel = usuarioModel;
            usuarioPassportModel.setPassword(request.body.password, function (err, user) {
                if (err || !user) {
                    return response.status(400).json({ error: 'Ocurrió un error al recuperar la contraseña' });
                }
                response.status(200).send({ usuario: user });
            });
        });
        // ---------
        // ----------
        this.registration = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const userData = request.body;
            if (yield this.usuario.findOne({ email: userData.email })) {
                next(new UserWithThatEmailAlreadyExistsException(userData.email));
            }
            else {
                // Los datos del usuario son validos
                const usuarioPassportModel = usuarioModel;
                usuarioPassportModel.register(new usuarioModel(Object.assign({}, userData)), userData.password, (err, usuarioCreado) => __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        return response.status(500).send(err);
                    }
                    // retornar valores
                    // retornar valores
                    passport.authenticate('local', {
                        session: false,
                    })(request, response, () => __awaiter(this, void 0, void 0, function* () {
                        const userToReturn = Object.assign({}, usuarioCreado.toJSON());
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
                                    name: 'Registro Exitoso - CET 30',
                                    email: 'no-reply@propet.com',
                                },
                                to: [
                                    {
                                        email: ENTORNO === 'desarrollo' ? MI_EMAIL : userToReturn.email,
                                        name: userToReturn.apellido + ',' + userToReturn.nombre,
                                    },
                                ],
                                subject: 'Registro Exitoso',
                                params: {
                                    nombre: userToReturn.apellido + ', ' + userToReturn.nombre,
                                    email: userToReturn.email,
                                    contrasena: userData.password,
                                },
                                templateId: 1,
                            }),
                        };
                        const headers = { headers: options.headers };
                        try {
                            const resultado = yield axios.post(url, options.body, headers);
                            response.status(200).send({ usuario: userToReturn, email: true });
                        }
                        catch (error) {
                            console.log('[ERROR]', error);
                            response.status(200).send({ usuario: userToReturn, email: false });
                        }
                    }));
                }));
            }
        });
        this.loggingIn = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const logInData = request.body;
            passport.authenticate('local', (err, usuario, info) => {
                if (err) {
                    response.json({ success: false, message: err });
                }
                else {
                    if (!usuario) {
                        // next(new WrongCredentialsException());
                        response.json({
                            success: false,
                            message: 'Contraseña o email incorrecto',
                        });
                    }
                    else {
                        request.login(usuario, (error) => __awaiter(this, void 0, void 0, function* () {
                            if (error) {
                                response.json({ success: false, message: error });
                            }
                            else {
                                const token = jwt.sign({ usuarioId: usuario._id, email: usuario.email }, config.passport.secret, { expiresIn: '24h' });
                                delete usuario.hash;
                                delete usuario.salt;
                                const usuarioFiltrado = {
                                    nombre: usuario.nombre,
                                    apellido: usuario.apellido,
                                    email: usuario.email,
                                    rol: usuario.rol,
                                    picture: usuario.picture,
                                    profesor: usuario.profesor,
                                };
                                //.populate('author', '-password') populate con imagen
                                response.json(Object.assign(Object.assign({ token }, usuarioFiltrado), { success: true, message: 'Authentication successful' }));
                            }
                        }));
                    }
                }
            })(request, response);
            // const isPasswordMatching = await bcrypt.compare(
            //   logInData.password,
            //   usuario.get('password', null, { getters: false })
            // );
            // if (isPasswordMatching) {
            //   console.log('usuario', usuario);
            //   const token = jwt.sign(
            //     { email: logInData.email },
            //     config.passport.secret,
            //     {
            //       expiresIn: 1000000,
            //     }
            //   );
            //   const userToReturn = { ...usuario.toJSON() };
            //   delete userToReturn.hashedPassword;
            //   delete userToReturn.password;
            //   response.status(200).json({ token, usuario: userToReturn });
            // } else {
            //   next(new WrongCredentialsException());
            // }
            // } else {
            //   next(new WrongCredentialsException());
            // }
        });
        this.loggingOut = (request, response) => {
            response.setHeader('Set-Cookie', ['Authorization=;Max-age=0']);
            response.send(200);
        };
        this.test = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const usuarios = yield this.usuario.find();
            if (!usuarios || usuarios.length < 1) {
                return response.send(null);
            }
            const user = usuarios[0];
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
                        name: 'Colegio CET 30 - No responder',
                        email: 'no-reply@propet.com',
                    },
                    to: [
                        {
                            email: ENTORNO === 'desarrollo' ? MI_EMAIL : user.email,
                            name: user.apellido + ',' + user.nombre,
                        },
                    ],
                    subject: 'Recuperar contraseña',
                    params: {
                        nombre: user.nombre + ', ' + user.apellido,
                        email: user.email,
                        password: user.password,
                    },
                    templateId: 1,
                }),
            };
            const headers = { headers: options.headers };
            try {
                const resultado = yield axios.post(url, options.body, headers);
                response.status(200).send({ usuario: user });
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(400, 'No se pudo enviar el email'));
            }
        });
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get(`${this.path}/test`, this.test);
        this.router.post(`${this.path}/registrar`, validationMiddleware(UsuarioDto), this.registration);
        this.router.post(`${this.path}/login`, validationMiddleware(LogInDto), this.loggingIn);
        this.router.post(`${this.path}/forgot-password`, this.forgotPassword);
        this.router.post(`${this.path}/set-lost-password`, this.setNuevoPassword);
        this.router.post(`${this.path}/logout`, this.loggingOut);
    }
}
export default AuthenticationController;
//# sourceMappingURL=authentication.controller.js.map