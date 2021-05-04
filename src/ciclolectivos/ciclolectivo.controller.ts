import HttpException from '../exceptions/HttpException';
import r, { Request, Response, NextFunction } from 'express';
import Controller from '../interfaces/controller.interface';
import ciclolectivoModel from './ciclolectivo.model';
import alumnoModel from '../alumnos/alumno.model';
import moment from 'moment';
const { Router } = r;
class CicloLectivoController implements Controller {
  public path = '/ciclolectivos';
  public router = Router();
  private ciclolectivo = ciclolectivoModel;
  private alumno = alumnoModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(
      `${this.path}/crear-manual`,
      this.crearManual // se usa en parametros y ficha-alumnos
    );

    this.router.get(`${this.path}`, this.listar);
    this.router.get(`${this.path}/actual`, this.actual);
  }
  private actual = async (request: Request, response: Response, next: NextFunction) => {
    const now = new Date();
    const hoy: string = moment(now).format('YYYY');
    try {
      const ciclolectivo = await this.ciclolectivo.findOne({ anio: Number(hoy) }).sort('_id');
      response.send(ciclolectivo);
    } catch (error) {
      console.log('[ERROR]', error);
      next(new HttpException(500, 'Error Interno'));
    }
  };

  private listar = async (request: Request, response: Response) => {
    const ciclolectivos = await this.ciclolectivo.find().sort('_id');

    response.send(ciclolectivos);
  };

  private crearManual = async (request: Request, response: Response) => {
    const ciclos = [
      { anio: 2018 },
      { anio: 2019 },
      { anio: 2020 },
      { anio: 2021 },
      { anio: 2022 },
      { anio: 2023 },
      { anio: 2024 },
      { anio: 2025 },
      { anio: 2026 },
      { anio: 2027 },
      { anio: 2028 },
      { anio: 2029 },
      { anio: 2030 },
      { anio: 2031 },
      { anio: 2032 },
      { anio: 2033 },
      { anio: 2034 },
      { anio: 2035 },
    ];
    const createdCicloLectivo = this.ciclolectivo.insertMany(ciclos);
    response.send(createdCicloLectivo);
  };
}

export default CicloLectivoController;
