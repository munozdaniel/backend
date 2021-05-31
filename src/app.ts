import cookieParser from 'cookie-parser';
import express from 'express';
import mongoose from 'mongoose';
import Controller from './interfaces/controller.interface';
import { errorMiddleware } from './middleware/error.middleware';

import cors from 'cors';
import path from 'path';
import ConnectionService from './services/Connection';
// import alumnoModel from './alumnos/alumno.model';
// import estadoCursadaModel from './alumnos/estadoCursada/estadoCursada.model';
// import cursoModel from './cursos/curso.model';
import passport from 'passport';
import passportJWT from 'passport-jwt';
import passportLocal from 'passport-local';
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const LocalStrategy = passportLocal.Strategy;
import { config } from './passport/config';
import usuarioModel from './usuario/usuario.model';
import methodOverride from 'method-override';
import bodyParser from 'body-parser';
// Config
const API_URL = '*';
class App {
  public app: express.Application;
  constructor(controllers: Controller[]) {
    this.app = express();

    this.configurarCors();
    this.connectToTheDatabase();
    // Apply strategy to passport
    this.estrategiaPassport();
    this.initializeMiddlewares();
    this.initializeControllers(controllers);
    this.initializeErrorHandling();
  }

  public configurarCors() {
    this.app.use(methodOverride('X-HTTP-Method-Override'));
    this.app.use((req, res, next) => {
      const origin = req.headers.origin === 'http://localhost:8083/api/' ? 'http://localhost:8083/api/' : 'http://66.97.41.7:3000';
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,PATCH,DELETE');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      // res.header('Access-Control-Allow-Credentials', 'true');
      next();
    });
    this.app.use(cors());
  }
  public estrategiaPassport() {
    this.app.use(passport.initialize());
    // se hace la siguiente asignacion para que reconozca los metodos del plugin en el model
    const usuarioPassportModel: any = usuarioModel;
    passport.use(
      new LocalStrategy(
        {
          usernameField: 'email',
          passwordField: 'password',
          passReqToCallback: false,
          session: false,
        },
        usuarioPassportModel.authenticate() // typescript no reconce las funciones del plugin asignado
        // usuarioPassportModel.createStrategy() // typescript no reconce las funciones del plugin asignado
      )
    );
    passport.serializeUser(usuarioPassportModel.serializeUser()); // typescript no reconce las funciones del plugin asignado
    passport.deserializeUser(usuarioPassportModel.deserializeUser()); // typescript no reconce las funciones del plugin asignado
    passport.use(
      new JWTStrategy(
        {
          jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
          secretOrKey: config.passport.secret,
        },
        (jwtPayload, cb) => {
          console.log('jwtPayload, ', jwtPayload);
          // find the user in db if needed.
          // This functionality may be omitted if you store everything you'll need in JWT payload.
          return usuarioModel
            .findById(jwtPayload.usuarioId)
            .then((user) => {
              return cb(null, user);
            })
            .catch((err) => {
              console.log('[ERROR]', err);
              return cb(err);
            });
        }
      )
    );
  }
  public listen() {
    this.app.listen(process.env.PORT, () => {
      console.log(`App listening on the port ${process.env.PORT}`);
    });
  }

  public getServer() {
    return this.app;
  }

  private initializeMiddlewares() {
    this.app.use(bodyParser.json({ limit: '10mb' }));
    this.app.use(cookieParser());
    const { ENTORNO } = process.env;

    if (ENTORNO !== 'desarrollo') {
      const __dirname = path.resolve(path.dirname(''));
    }
    this.app.use('/public', express.static(__dirname + '/public'));
    this.app.set('view engine', '.hbs');
    this.app.set('views', path.join(__dirname, 'views'));
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }

  private initializeControllers(controllers: Controller[]) {
    controllers.forEach((controller) => {
      this.app.use('/api/', controller.router);
    });
  }

  private async connectToTheDatabase() {
    const { MONGO_USER, MONGO_PASSWORD, MONGO_PATH } = process.env;

    // var url = 'mongodb://propet:propet321@localhost:27017/escuela';
    const url = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}${MONGO_PATH}`;
    console.log('CADENA', url);
    try {
      await mongoose
        .connect(url, {
          //  mongoose.connect('mongodb://127.0.0.1:27017/propet', {
          useUnifiedTopology: true,
          useNewUrlParser: true,
          useFindAndModify: false,
          useCreateIndex: true,
          // user: `${MONGO_USER}`, // IMPORTANT TO HAVE IT HERE AND NOT IN CONNECTION STRING
          // pass: `${MONGO_PASSWORD}`, // IMPORTANT TO HAVE IT HERE AND NOT IN CONNECTION STRING
          // dbName: 'database-name', // IMPORTANT TO HAVE IT HERE AND NOT IN CONNECTION STRING
        })
        .then(() => {
          console.log('Database connected.');
        })
        .catch((err) => {
          console.log('MongoDB connection error. Please make sure MongoDB is running.\n' + err);
          process.exit(1);
        });
      // mongoose.connection.readyState => 0: disconnected - 1: connected - 2: connecting - 3: disconnecting
      console.log(mongoose.connection.readyState);
      ConnectionService.setConnection(mongoose);
      //   mongoose.set('useCreateIndex', true); // elimina los deprecration warnings
      // this.AutoIncrement.initialize(mongoose.connection);
    } catch (err) {
      console.log('[ERROR DE CONEXION]', err);
      process.exit(1);
    }
  }
}

export default App;
