import { Request, Response, NextFunction, Router } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from '../passport/config';
import Controller from '../interfaces/controller.interface';
import validationMiddleware from '../middleware/validation.middleware';
import AuthenticationService from './authentication.service';
import LogInDto from './logIn.dto';
import usuarioModel from '../usuario/usuario.model';
import UsuarioDto from '../usuario/usuario.dto';
import UserWithThatEmailAlreadyExistsException from '../exceptions/UserWithThatEmailAlreadyExistsException';
import passport from 'passport';
import favoritoModel from '../favorito/favorito.model';
import carritoModel from '../carrito/carrito.model';
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { google } from 'googleapis';
import HttpException from '../exceptions/HttpException';

class AuthenticationController implements Controller {
  public path = '/auth';
  public router = Router();
  public authenticationService = new AuthenticationService();
  private usuario = usuarioModel;
  private favorito = favoritoModel;
  private carrito = carritoModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/test`, this.test);
    this.router.post(
      `${this.path}/registrar`,
      validationMiddleware(UsuarioDto),
      this.registration
    );
    this.router.post(
      `${this.path}/login`,
      validationMiddleware(LogInDto),
      this.loggingIn
    );
    this.router.post(`${this.path}/forgot-password`, this.forgotPassword);
    this.router.post(`${this.path}/set-lost-password`, this.setNuevoPassword);
    this.router.post(`${this.path}/logout`, this.loggingOut);
  }
  // -----
  private forgotPassword = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const { email } = request.body;
    this.usuario.findOne({ email }, async (err, user) => {
      if (err || !user) {
        return response
          .status(400)
          .json({ error: 'El usuario con el email ingresado no existe' });
      }
      // Envio el email con un link y ahi se redirecciona para que setee la nueva contraseña
      // Con passport-mongoose-local recuperamos la contraseña
      try {
        const resultado: any = await this.enviarEmail(email);
        if (resultado) {
          response.status(200).send({ usuario: user });
        } else {
          next(new HttpException(400, 'No se pudo enviar el email'));
        }
      } catch (error) {
        console.log('[ERROR]', error);
        next(new HttpException(400, 'Ocurrió un error'));
      }
    });
  };
  // ---------
  private setNuevoPassword = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const usuarioPassportModel: any = usuarioModel;
    usuarioPassportModel.setPassword(
      request.body.password,
      function (err: any, user: any) {
        if (err || !user) {
          return response
            .status(400)
            .json({ error: 'Ocurrió un error al recuperar la contraseña' });
        }
        response.status(200).send({ usuario: user });
      }
    );
  };
 
  // ---------
  private async enviarEmail(email: string) {
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
          user: email,
          clientId: CLIENT_ID_OAUTH2,
          clientSecret: CLIENT_SECRET_OAUTH2,
          refreshToken: REFRESH_TOKEN_OAUTH2,
          accessToken,
        },
      };
      const transporter = nodemailer.createTransport(transporterOptiones);
      const mailOptions = {
        from: `PROPET - Tienda de Mascotas  `,
        to: CORREO, // Cambia esta parte por el destinatario usuarioCreado.email
        subject: 'Reestablecer contraseña',
        html: `
            <h3> Haga click en el siguiente link para reestablecer una nueva contraseña</h3>
              <br/>
              <a href="${URL_FRONT}/autenticacion/set-lost-password"> >> Click Aqui <<</a>
            
            `,
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
  // ----------
  private registration = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const userData: UsuarioDto = request.body;
    console.log('userData', userData);
    if (await this.usuario.findOne({ email: userData.email })) {
      next(new UserWithThatEmailAlreadyExistsException(userData.email));
    } else {
      // Los datos del usuario son validos
      const usuarioPassportModel: any = usuarioModel;
      usuarioPassportModel.register(
        new usuarioModel({ ...userData }),
        userData.password,
        async (err: any, usuarioCreado: any) => {
          console.log(err, 'usuarioCreado', usuarioCreado);
          if (err) {
            return response.status(500).send(err);
          }
          // retornar valores
          passport.authenticate('local', {
            session: false,
          })(request, response, () => {
            const userToReturn = { ...usuarioCreado.toJSON() };

            response.status(200).send({ usuario: userToReturn });
          });
          // const {
          //   CLIENT_ID_OAUTH2,
          //   CLIENT_SECRET_OAUTH2,
          //   REDIRECT_URI_OAUTH2,
          //   REFRESH_TOKEN_OAUTH2,
          // } = process.env;
          // const oAuth2Client = new google.auth.OAuth2(
          //   CLIENT_ID_OAUTH2,
          //   CLIENT_SECRET_OAUTH2,
          //   REDIRECT_URI_OAUTH2
          // );
          // oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN_OAUTH2 });
          // try {
          //   const accessToken: any = await oAuth2Client.getAccessToken();
          //   // enviar email
          //   const transporterOptiones: SMTPTransport.Options = {
          //     service: 'gmail',
          //     auth: {
          //       type: 'OAuth2',
          //       user: 'munozda87@gmail.com',
          //       clientId: CLIENT_ID_OAUTH2,
          //       clientSecret: CLIENT_SECRET_OAUTH2,
          //       refreshToken: REFRESH_TOKEN_OAUTH2,
          //       accessToken,
          //     },
          //   };
          //   const transporter = nodemailer.createTransport(transporterOptiones);
          //   const mailOptions = {
          //     from: `PROPET - Tienda de Mascotas  `,
          //     to: usuarioCreado.email, // Cambia esta parte por el destinatario usuarioCreado.email
          //     subject: `Registro exitoso `,
          //     html: `
          //         <h3> ${usuarioCreado.nombre} has finalizado tu registro con éxito.</h3>
          //         <h4>Estamos felices de que nos acompañes en Propet. Recuerda que para ingresar al sistema debes usar el email y tu contraseña.</h4>
          //         <hr>
          //         <h4>Datos</h4>
          //         <strong>E-mail:</strong>${usuarioCreado.email}  <br/>
          //         <strong>Contraseña:</strong> ${userData.password}<br/>

          //         `,
          //   };
          //   // send mail with defined transport object
          //   const resultado = await transporter.sendMail(
          //     mailOptions,
          //     (err, info: SMTPTransport.SentMessageInfo) => {
          //       if (err) {
          //         console.log(err);
          //         return;
          //       }
          //       console.log('Message sent: %s', info.messageId);
          //       // Preview only available when sending through an Ethereal account
          //       console.log(
          //         'Preview URL: %s',
          //         nodemailer.getTestMessageUrl(info)
          //       );

          //       // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
          //       // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
          //     }
          //   );
          //   // retornar valores
          //   passport.authenticate('local', {
          //     session: false,
          //   })(request, response, () => {
          //     const userToReturn = { ...usuarioCreado.toJSON() };

          //     response.status(200).send({ usuario: userToReturn });
          //   });
          // } catch (error) {
          //   console.log('[ERROR]', error);
          //   response.status(500).send({ error });
          // }
        }
      );
    }
  };

  private loggingIn = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
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
              const token = jwt.sign(
                { usuarioId: usuario._id, email: usuario.email },
                config.passport.secret,
                { expiresIn: '24h' }
              );
              delete usuario.hash;
              delete usuario.salt;
              const favorito = await this.favorito.findOne({
                usuarioId: usuario._id,
              });
              const carrito = await this.carrito
                .findOne({
                  usuarioId: usuario._id,
                })
                .populate(
                  'productos',
                  '_id titulo imagenes marca precio precioOferta stock'
                );
              console.log('carrito', carrito);

              //.populate('author', '-password') populate con imagen
              response.json({
                token,
                usuario,
                favorito,
                success: true,
                message: 'Authentication successful',
                carritoCantidad: carrito ? carrito.productosCarrito.length : 0,
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
  private test = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const {
      CLIENT_ID_OAUTH2,
      CLIENT_SECRET_OAUTH2,
      REDIRECT_URI_OAUTH2,
      REFRESH_TOKEN_OAUTH2,
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
          user: 'munozda87@gmail.com',
          clientId: CLIENT_ID_OAUTH2,
          clientSecret: CLIENT_SECRET_OAUTH2,
          refreshToken: REFRESH_TOKEN_OAUTH2,
          accessToken,
        },
      };
      const transporter = nodemailer.createTransport(transporterOptiones);
      const mailOptions = {
        from: `PROPET - Tienda de Mascotas  `,
        to: 'munozda87@hotmail.com', // Cambia esta parte por el destinatario usuarioCreado.email
        subject: 'Registro exitoso',
        html: `
            <h3>  has finalizado tu registro con éxito.</h3>
            <h4>Estamos felices de que nos acompañes en Propet.</h4>
            <hr>
            <h4>Datos Personales</h4>
            <strong>Nombre:</strong>  <br/>
            <strong>E-mail:</strong>  <br/>
            <strong>Password:</strong> <br/>
            
            `,
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
      response.status(200).send({ usuario: 'userToReturn', resultado });
    } catch (error) {
      console.log('[ERROR]', error);
      response.status(500).send({ error });
    }
  };
}

export default AuthenticationController;
