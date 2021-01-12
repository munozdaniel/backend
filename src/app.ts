import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import mongoose from 'mongoose';
import Controller from './interfaces/controller.interface';
import errorMiddleware from './middleware/error.middleware';
// import passport from 'passport';
import cors from 'cors';

// import { applyPassportStrategy } from './passport/passport';
// import passportJWT from 'passport-jwt';
// import passportLocal from 'passport-local';
// const JWTStrategy = passportJWT.Strategy;
// const ExtractJWT = passportJWT.ExtractJwt;
// const LocalStrategy = passportLocal.Strategy;

import AutoincrementService from './services/AutoincrementService';
import usuarioModel from './usuario/usuario.model';
import { config } from './passport/config';
import path from 'path';

const API_URL = '*';
class App {
  public app: express.Application;
  constructor(controllers: Controller[]) {
    this.app = express();

    this.configurarCors();
    this.connectToTheDatabase();
    // Apply strategy to passport
    // applyPassportStrategy(passport);
    this.initializeMiddlewares();
    this.initializeControllers(controllers);
    this.initializeErrorHandling();
  }


 
  public configurarCors() {
    this.app.use((req, res, next) => {
      const origin =
        req.headers.origin === 'http://localhost:3000'
          ? 'http://localhost:3000'
          : 'http://66.97.41.7:3000';
      res.header('Access-Control-Allow-Origin', '*');
      res.header(
        'Access-Control-Allow-Methods',
        'GET,HEAD,OPTIONS,POST,PUT,PATCH,DELETE'
      );
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
      );
      // res.header('Access-Control-Allow-Credentials', 'true');
      next();
    });
    this.app.use(cors());
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
    this.app.use('/public', express.static(__dirname + '/public'));
    this.app.set('view engine', '.hbs');
    this.app.set('views',path.join(__dirname,'views'))
   }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }

  private initializeControllers(controllers: Controller[]) {
    controllers.forEach((controller) => {
      this.app.use('/', controller.router);
    });
  }

  private connectToTheDatabase() {
    const { MONGO_USER, MONGO_PASSWORD, MONGO_PATH } = process.env;

    // var url = 'mongodb://propet:propet321@localhost:27017/propet';
    const url = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}${MONGO_PATH}`;
    console.log('CADENA', url);
    try {
      mongoose.connect(url, {
        //  mongoose.connect('mongodb://127.0.0.1:27017/propet', {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useFindAndModify: false,
      });
      mongoose.set('useCreateIndex', true); // elimina los deprecration warnings
      // this.AutoIncrement.initialize(mongoose.connection);
    } catch (err) {
      console.log('[ERROR DE CONEXION]', err);
      process.exit(1);
    }
  }
}

export default App;
