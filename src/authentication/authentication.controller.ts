import { Request, Response, NextFunction, Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../passport/config';
import Controller from '../interfaces/controller.interface';
import validationMiddleware from '../middleware/validation.middleware';
import AuthenticationService from './authentication.service';
import LogInDto from './logIn.dto';
import usuarioModel from '../usuario/usuario.model';
import UsuarioDto from '../usuario/usuario.dto';
import UserWithThatEmailAlreadyExistsException from '../exceptions/UserWithThatEmailAlreadyExistsException';
import passport from 'passport';
import HttpException from '../exceptions/HttpException';
import axios, { AxiosRequestConfig } from 'axios';
import { refreshTokensMemoria } from '../app';

class AuthenticationController implements Controller {
  public path = '/auth';
  public router = Router();
  public authenticationService = new AuthenticationService();
  private usuario = usuarioModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/test`, this.test);
    this.router.post(`${this.path}/registrar`, validationMiddleware(UsuarioDto), this.registration);
    this.router.post(`${this.path}/refresh-token`, passport.authenticate('jwt', { session: false }), this.refresh);
    this.router.post(`${this.path}/login`, validationMiddleware(LogInDto), this.loggingIn);
    this.router.post(`${this.path}/forgot-password`, this.forgotPassword);
    this.router.post(`${this.path}/set-lost-password`, this.setNuevoPassword);
    this.router.post(`${this.path}/logout`, this.loggingOut);
  }
  // -----
  private refresh = async (request: Request, response: Response, next: NextFunction) => {
    // var email = request.body.email;
    var refreshToken = request.body.refreshToken;
    if (!refreshToken) {
      return response.status(401).send({ message: 'Inicie la sesión nuevamente' });
    }
    if (!refreshTokensMemoria.existRefreshToken(refreshToken)) {
      return response.status(403).send({ message: 'Inicie la sesión nuevamente [2]' });
    }
    jwt.verify(refreshToken, config.passport.refreshTokenSecret, async (err: any, usuario: any) => {
      if (err) {
        return response.sendStatus(403);
      }
      const accessToken = jwt.sign({ usuarioId: usuario.usuarioId, email: usuario.email }, config.passport.secret, { expiresIn: '60m' });
      const usuarioRecuperado = await this.usuario.findById(usuario.usuarioId);
      const retorno = {
        accessToken: accessToken,
        refreshToken: refreshToken,
        nombre: usuarioRecuperado.nombre,
        apellido: usuarioRecuperado.apellido,
        email: usuarioRecuperado.email,
        _id: usuarioRecuperado._id,

        profesor: usuarioRecuperado.profesor,
        rol: usuarioRecuperado.rol,
      };
      return response.status(200).send(retorno);
    });
  };
  // -----
  private forgotPassword = async (request: Request, response: Response, next: NextFunction) => {
    const { email } = request.body;
    this.usuario.findOne({ email }, async (err: any, user: any) => {
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
      } catch (error) {
        console.log('[ERROR]', error);
        next(new HttpException(400, 'Ocurrió un error'));
      }
    });
  };
  // ---------
  private setNuevoPassword = async (request: Request, response: Response, next: NextFunction) => {
    const usuarioPassportModel: any = usuarioModel;
    usuarioPassportModel.setPassword(request.body.password, function (err: any, user: any) {
      if (err || !user) {
        return response.status(400).json({ error: 'Ocurrió un error al recuperar la contraseña' });
      }
      response.status(200).send({ usuario: user });
    });
  };

  // ---------

  // ----------
  private registration = async (request: Request, response: Response, next: NextFunction) => {
    const userData: UsuarioDto = request.body;
    if (await this.usuario.findOne({ email: userData.email })) {
      next(new UserWithThatEmailAlreadyExistsException(userData.email));
    } else {
      // Los datos del usuario son validos
      const usuarioPassportModel: any = usuarioModel;
      usuarioPassportModel.register(new usuarioModel({ ...userData }), userData.password, async (err: any, usuarioCreado: any) => {
        if (err) {
          return response.status(500).send(err);
        }
        // retornar valores
        // retornar valores
        passport.authenticate('local', {
          session: false,
        })(request, response, async () => {
          const userToReturn = { ...usuarioCreado.toJSON() };
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
                email: 'no-reply@cet30.edu.ar',
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
              // textContent:
              //   "Please confirm your email address by clicking on the link https://text.domain.com",
            }),
          };

          const headers: AxiosRequestConfig = { headers: options.headers };
          try {
            const resultado = await axios.post(url, options.body, headers);
            // Los datos que necesita el front
            // email: string;
            // role: string;
            // originalUserName: string;
            // accessToken: string;
            // refreshToken: string;
            // agregado para recuperar el token
            const token = jwt.sign({ usuarioId: userToReturn._id, email: userToReturn.email }, config.passport.secret, {
              expiresIn: '120m',
            });
            const refreshToken = jwt.sign({ usuarioId: userToReturn._id, email: userToReturn.email }, config.passport.refreshTokenSecret);

            refreshTokensMemoria.addRefreshTokens({
              email: userToReturn.email,
              token: token,
              refreshToken: refreshToken,
            });
            response.json({
              accessToken: token,
              refreshToken: refreshToken,
              nombre: userToReturn.nombre,
              apellido: userToReturn.apellido,
              email: userToReturn.email,
              _id: userToReturn._id,
              // profesor:userToReturn.profesor // no se pone el rol ni el profesor porque al registrar no se asignan

              // favorito,
              // success: true,
              // message: "Authentication successful",
              // carritoCantidad: carrito ? carrito.productosCarrito.length : 0,
            });
          } catch (error) {
            console.log('[ERROR]', error);
            response.status(200).send({ usuario: userToReturn, email: false });
          }
        });
      });
    }
  };

  private loggingIn = async (request: Request, response: Response, next: NextFunction) => {
    const logInData: LogInDto = request.body;
    passport.authenticate('local', (err, usuario, info) => {
      if (err) {
        response.json({ success: false, message: err });
      } else {
        if (!usuario) {
          // next(new WrongCredentialsException());
          response.json({
            success: false,
            message: 'Contraseña o email incorrecto',
          });
        } else {
          request.login(usuario, async (error) => {
            if (error) {
              response.json({ success: false, message: error });
            } else {
              const token = jwt.sign({ usuarioId: usuario._id, email: usuario.email }, config.passport.secret, { expiresIn: '2h' });
              const refreshToken = jwt.sign({ usuarioId: usuario._id, email: usuario.email }, config.passport.refreshTokenSecret);

              refreshTokensMemoria.addRefreshTokens({
                email: usuario.email,
                token: token,
                refreshToken: refreshToken,
              });
              console.log('usuario antes, ', usuario);
              // const u = await this.usuario.findById(usuario._id);
              response.json({
                accessToken: token,
                refreshToken: refreshToken,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                _id: usuario._id,
                success: true,
                rol: usuario.rol,
                profesor: usuario.profesor,
                // favorito,
                // success: true,
                // message: "Authentication successful",
                // carritoCantidad: carrito ? carrito.productosCarrito.length : 0,
              });
            }
          });
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
  };

  private loggingOut = (request: Request, response: Response) => {
    response.setHeader('Set-Cookie', ['Authorization=;Max-age=0']);
    response.send(200);
  };
  private test = async (request: Request, response: Response, next: NextFunction) => {
    const usuarios = await this.usuario.find();
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
          email: 'no-reply@cet30.edu.ar',
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
        // textContent:
        //   "Please confirm your email address by clicking on the link https://text.domain.com",
      }),
    };
    const headers: AxiosRequestConfig = { headers: options.headers };
    try {
      const resultado = await axios.post(url, options.body, headers);
      response.status(200).send({ usuario: user });
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(400, 'No se pudo enviar el email'));
    }
  };
}

export default AuthenticationController;
