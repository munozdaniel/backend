import { Router, Request, Response, NextFunction } from 'express';
import Controller from '../interfaces/controller.interface';
import UserNotFoundException from '../exceptions/UserNotFoundException';
import passport from 'passport';
import usuarioModel from './usuario.model';
// email
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { google } from 'googleapis';
// tslint:disable-next-line: no-var-requires
const hbs = require('nodemailer-express-handlebars');
import path from 'path';

//
import HttpException from '../exceptions/HttpException';
class UsuarioController implements Controller {
  public path = '/usuarios';
  public router = Router();
  private usuario = usuarioModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/test`, this.test);
    this.router.get(
      `${this.path}/:id`,
      passport.authenticate('jwt', { session: false }),
      this.obtenerUsuarioPorId
    );
    this.router.get(
      `${this.path}/completo/:id`,
      passport.authenticate('jwt', { session: false }),
      this.obtenerUsuarioPorIdCompleto
    );
    this.router.post(
      `${this.path}/change-password`,
      passport.authenticate('jwt', { session: false }),
      this.cambiarPassword
    );
  }
  // -----
  // ---------
  private cambiarPassword = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    console.log('cambiarPassword', request.body);
    const { usuarioId, actual, password } = request.body;
    const usuarioEncontrado: any = await this.usuario.findById(usuarioId);
    // const usuarioPassportModel: any = usuarioModel;
    usuarioEncontrado.changePassword(
      actual,
      password,
      async (err: any, user: any) => {
        console.log(err,'<<<<<<<');
        if (err || !user) {
          return response
            .status(400)
            .json({ error: 'Ocurrió un error al actualizar la contraseña' });
        }
        try {
          await this.enviarEmailConNuevoPassword(usuarioEncontrado, password);
          response.status(200).send({ usuario: user });
        } catch (error) {
          console.log('[ERROR]', error);
          next(new HttpException(400, 'No se pudo enviar el correo'));
        }
      }
    );
  };
  // -----
  private async enviarEmailConNuevoPassword(user: any, contrasena: string) {
    const {
      CLIENT_ID_OAUTH2,
      CLIENT_SECRET_OAUTH2,
      REDIRECT_URI_OAUTH2,
      REFRESH_TOKEN_OAUTH2,
      CORREO,
      URL_FRONT,
    } = process.env;
    const oAuth2Client = new google.auth.OAuth2(
      CLIENT_ID_OAUTH2,
      CLIENT_SECRET_OAUTH2,
      REDIRECT_URI_OAUTH2
    );
    oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN_OAUTH2 });
    try {
      const accessToken: any = await oAuth2Client.getAccessToken();
      // enviar email
      const transporterOptiones: SMTPTransport.Options = {
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: CORREO,
          clientId: CLIENT_ID_OAUTH2,
          clientSecret: CLIENT_SECRET_OAUTH2,
          refreshToken: REFRESH_TOKEN_OAUTH2,
          accessToken,
        },
      };
      const transporter = nodemailer.createTransport(transporterOptiones);
      transporter.use(
        'compile',
        hbs({
          viewEngine: {
            partialsDir: path.join(__dirname, '../views/partials'),
            layoutsDir: path.join(__dirname, '../views/layouts'),
            defaultLayout: 'cambioContrasena', // name of main template
          },
          // viewEngine:  'express-handlebars',
          viewPath: path.join(__dirname, '../views/layouts/'),
          //  viewPath: './public/correo-template/',
          // extName: '.hbs',
        })
      );
      const mailOptions = {
        from: `PROPET - Tienda de Mascotas  `,
        to: user.email, // Cambia esta parte por el destinatario usuarioCreado.email
        subject: 'Cambio de contraseña',
        template: 'cambioContrasena',
        context: {
          email: user.email,
          contrasena,
        },
        attachments: [
          {
            filename: 'logo.png',
            path:  __dirname +'/../public/logo/logo.png',
            cid: 'unique@cid', //same cid value as in the html img src
          },
        ],
      };
      // send mail with defined transport object
      const resultado = await transporter.sendMail(
        mailOptions,
        (err, info: SMTPTransport.SentMessageInfo) => {
          if (err) {
            console.log(err);
            return;
          }
          console.log('Message sent: %s', info.messageId);
          // Preview only available when sending through an Ethereal account
          console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

          // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
          // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
        }
      );
      // retornar valores
      return resultado;
    } catch (error) {
      console.log('[ERROR]', error);
      return null;
    }
  }
  // -----

  private test = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    response.send({ success: true, code: 200, message: 'YEahh baby' });
  };
  private obtenerUsuarioPorId = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
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

  private obtenerUsuarioPorIdCompleto = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
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
