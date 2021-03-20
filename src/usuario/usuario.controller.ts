import { Router, Request, Response, NextFunction } from 'express';
import Controller from '../interfaces/controller.interface';
import UserNotFoundException from '../exceptions/UserNotFoundException';
import usuarioModel from './usuario.model';
import HttpException from '../exceptions/HttpException';
import escapeStringRegexp from 'escape-string-regexp';
import NotFoundException from '../exceptions/NotFoundException';

class UsuarioController implements Controller {
  public path = '/usuarios';
  public router = Router();
  private usuario = usuarioModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/test`, this.test);
    this.router.get(`${this.path}/:id`, this.obtenerUsuarioPorId);
    this.router.get(`${this.path}/completo/:id`, this.obtenerUsuarioPorIdCompleto);
    this.router.post(
      `${this.path}/change-password`,
      // passport.authenticate('jwt', { session: false }),
      this.cambiarPassword
    );
    this.router.post(
      `${this.path}/change-role/:id`,
      // passport.authenticate('jwt', { session: false }),
      this.cambiarRol
    );
    this.router.get(
      `${this.path}`,
      // passport.authenticate('jwt', { session: false }),
      this.obtenerUsuarios
    );
    this.router.get(
      `${this.path}`,
      // passport.authenticate('jwt', { session: false }),
      this.obtenerUsuariosInactivos
    );
    this.router.get(
      `${this.path}/activar/:id`,
      // passport.authenticate('jwt', { session: false }),
      this.activarUsuario
    );
  }
  private obtenerUsuarios = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const usuario = await this.usuario.find({ activo: true });
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
