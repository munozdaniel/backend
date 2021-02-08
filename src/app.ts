import * as bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import express from "express";
import mongoose from "mongoose";
import Controller from "./interfaces/controller.interface";
import errorMiddleware from "./middleware/error.middleware";
import cors from "cors";
import path from "path";

const methodOverride = require("method-override");
// Config
const config = require("./utils/server/config");
const API_URL = "*";
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
    this.app.use(methodOverride("X-HTTP-Method-Override"));
    this.app.use((req, res, next) => {
      const origin =
        req.headers.origin === "http://localhost:8083/api/"
          ? "http://localhost:8083/api/"
          : "http://66.97.41.7:3000";
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET,HEAD,OPTIONS,POST,PUT,PATCH,DELETE"
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
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
    this.app.use(bodyParser.json({ limit: "10mb" }));
    this.app.use(cookieParser());
    this.app.use("/public", express.static(__dirname + "/public"));
    this.app.set("view engine", ".hbs");
    this.app.set("views", path.join(__dirname, "views"));
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }

  private initializeControllers(controllers: Controller[]) {
    controllers.forEach((controller) => {
      this.app.use("/api/", controller.router);
    });
  }

  private async connectToTheDatabase() {
    const { MONGO_USER, MONGO_PASSWORD, MONGO_PATH } = process.env;

    // var url = 'mongodb://propet:propet321@localhost:27017/escuela';
    const url = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}${MONGO_PATH}`;
    console.log("CADENA", url);
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
          console.log("Database connected.");
        })
        .catch((err) => {
          console.log(
            "MongoDB connection error. Please make sure MongoDB is running.\n" +
              err
          );
          process.exit(1);
        });
      // mongoose.connection.readyState => 0: disconnected - 1: connected - 2: connecting - 3: disconnecting
      console.log(mongoose.connection.readyState);

      //   mongoose.set('useCreateIndex', true); // elimina los deprecration warnings
      // this.AutoIncrement.initialize(mongoose.connection);
    } catch (err) {
      console.log("[ERROR DE CONEXION]", err);
      process.exit(1);
    }
  }
}

export default App;
