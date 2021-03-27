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
    this.router.post(`${this.path}/login`, validationMiddleware(LogInDto), this.loggingIn);
    this.router.post(`${this.path}/forgot-password`, this.forgotPassword);
    this.router.post(`${this.path}/set-lost-password`, this.setNuevoPassword);
    this.router.post(`${this.path}/logout`, this.loggingOut);
  }
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
              // textContent:
              //   "Please confirm your email address by clicking on the link https://text.domain.com",
            }),
          };

          const headers: AxiosRequestConfig = { headers: options.headers };
          try {
            const resultado = await axios.post(url, options.body, headers);
            response.status(200).send({ usuario: userToReturn, email: true });
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
              const token = jwt.sign({ usuarioId: usuario._id, email: usuario.email }, config.passport.secret, { expiresIn: '24h' });
              delete usuario.hash;
              delete usuario.salt;
              const usuarioFiltrado = {
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                rol: usuario.rol,
                picture: usuario.picture,
              };
              //.populate('author', '-password') populate con imagen
              response.json({
                token,
                ...usuarioFiltrado,
                success: true,
                message: 'Authentication successful',
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
    console.log('============>');
    const usuarios = await this.usuario.find();
    if (!usuarios || usuarios.length < 1) {
      return response.send(null);
    }
    const user = usuarios[0];
    console.log('============>', user);
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
