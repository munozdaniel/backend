import { Router, Request, Response, NextFunction } from 'express';
import Controller from '../interfaces/controller.interface';
import UserNotFoundException from '../exceptions/UserNotFoundException';
import usuarioModel from './usuario.model';
import HttpException from '../exceptions/HttpException';
import escapeStringRegexp from 'escape-string-regexp';
import NotFoundException from '../exceptions/NotFoundException';
import passport from 'passport';
import axios, { AxiosRequestConfig } from 'axios';

class UsuarioController implements Controller {
  public path = '/usuarios';
  public router = Router();
  private usuario = usuarioModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/test`, this.test);
    this.router.get(`${this.path}/:id`, passport.authenticate('jwt', { session: false }), this.obtenerUsuarioPorId);
    this.router.get(`${this.path}/link/:email`, passport.authenticate('jwt', { session: false }), this.enviarLink);
    this.router.get(`${this.path}/completo/:id`, passport.authenticate('jwt', { session: false }), this.obtenerUsuarioPorIdCompleto);
    this.router.post(
      `${this.path}/change-password`,
      passport.authenticate('jwt', { session: false }),
      // passport.authenticate('jwt', { session: false }),
      this.cambiarPassword
    );
    this.router.post(
      `${this.path}/change-role/:id`,
      passport.authenticate('jwt', { session: false }),
      // passport.authenticate('jwt', { session: false }),
      this.cambiarRol
    );
    this.router.post(
      `${this.path}/asignar-profesor/:id`,
      passport.authenticate('jwt', { session: false }),
      // passport.authenticate('jwt', { session: false }),
      this.asignarProfesor
    );
    this.router.get(
      `${this.path}`,
      passport.authenticate('jwt', { session: false }),
      // passport.authenticate('jwt', { session: false }),
      this.obtenerUsuarios
    );
    this.router.get(
      `${this.path}`,
      passport.authenticate('jwt', { session: false }),
      // passport.authenticate('jwt', { session: false }),
      this.obtenerUsuariosInactivos
    );
    this.router.get(
      `${this.path}/activar/:id`,
      passport.authenticate('jwt', { session: false }),
      // passport.authenticate('jwt', { session: false }),
      this.activarUsuario
    );
  }
  private obtenerUsuarios = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const usuario = await this.usuario.find({ activo: true }).populate('profesor');
      if (usuario) {
        response.send(usuario);
      } else {
        next(new NotFoundException());
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Ocurrió un error interno'));
    }
  };
  private obtenerUsuariosInactivos = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const usuario = await this.usuario.find({ activo: false });
      if (usuario) {
        response.send(usuario);
      } else {
        next(new NotFoundException());
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Ocurrió un error interno'));
    }
  };
  private asignarProfesor = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    const profesor: any = request.body.profesor;

    try {
      const usuario = await this.usuario.findByIdAndUpdate(id, { profesor }, { new: true });
      if (usuario) {
        response.send({ status: 200, usuario });
      } else {
        next(new NotFoundException());
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Ocurrió un error interno'));
    }
  };
  private cambiarRol = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    const rol: any = escapeStringRegexp(request.body.rol);
    const roles = ['PROFESOR', 'ADMIN', 'DIRECTOR', 'JEFETALLER', 'PRECEPTOR'];
    const index = roles.findIndex((x) => rol === x);
    if (index === -1) {
      next(new HttpException(400, 'El rol que desea agregar no se encuentra disponible'));
    }
    try {
      const usuario = await this.usuario.findByIdAndUpdate(id, { rol: rol }, { new: true });
      if (usuario) {
        response.send({ status: 200, usuario });
      } else {
        next(new NotFoundException());
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Ocurrió un error interno'));
    }
  };
  private activarUsuario = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const usuario = await this.usuario.findByIdAndUpdate(id, { activo: true }, { new: true });
      if (usuario) {
        response.send(usuario);
      } else {
        next(new NotFoundException());
      }
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Ocurrió un error interno'));
    }
  };
  // -----
  // ---------
  private cambiarPassword = async (request: Request, response: Response, next: NextFunction) => {
    console.log('cambiarPassword', request.body);
    const { usuarioId, actual, password } = request.body;
    const usuarioEncontrado: any = await this.usuario.findById(usuarioId);
    // const usuarioPassportModel: any = usuarioModel;
    usuarioEncontrado.changePassword(actual, password, async (err: any, user: any) => {
      if (err || !user) {
        return response.status(400).json({ error: 'Ocurrió un error al actualizar la contraseña' });
      }
      try {
        // TODO:
        // await this.enviarEmailConNuevoPassword(usuarioEncontrado, password);
        // response.status(200).send({ usuario: user });
        next(new HttpException(400, 'INCOMPLETO'));
      } catch (error) {
        console.log('[ERROR]', error);
        next(new HttpException(400, 'No se pudo enviar el correo'));
      }
    });
  };
  // -----
  private async enviarEmailConNuevoPassword(user: any, contrasena: string) {}
  // -----

  private test = async (request: Request, response: Response, next: NextFunction) => {
    response.send({ success: true, code: 200, message: 'YEahh baby' });
  };
  private enviarLink = async (request: Request, response: Response, next: NextFunction) => {
    const email = request.params.email;
    const usuario = await this.usuario.findOne({ email });
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
          link:
            ENTORNO === 'desarrollo'
              ? `http://localhost:4200/auth/change/${usuario._id}`
              : `http://app.cet30.edu.ar/auth/change/${usuario._id}`,
        },
        templateId: 2,
        // textContent:
        //   "Please confirm your email address by clicking on the link https://text.domain.com",
      }),
    };

    const headers: AxiosRequestConfig = { headers: options.headers };
    try {
      const resultado = await axios.post(url, options.body, headers);
      response.status(200).send({ usuario, success: true });
    } catch (error) {
      console.log('[ERROR]', error);
      response.status(200).send({ usuario, success: false });
    }
  };
  private obtenerUsuarioPorId = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    const userQuery: any = await this.usuario.findById(id);
    if (request.query.withPosts === 'true') {
      userQuery.populate('posts').exec();
    }
    const user = await userQuery;
    if (user) {
      response.send(user);
    } else {
      next(new UserNotFoundException(id));
    }
  };

  private obtenerUsuarioPorIdCompleto = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    const userQuery = this.usuario.findById(id);
    if (request.query.withPosts === 'true') {
      userQuery.populate('tarjeta').exec();
    }
    const user = await userQuery;
    if (user) {
      response.send(user);
    } else {
      next(new UserNotFoundException(id));
    }
  };
}

export default UsuarioController;
