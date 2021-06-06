var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import HttpException from '../exceptions/HttpException';
import { Router } from 'express';
import ciclolectivoModel from './ciclolectivo.model';
import alumnoModel from '../alumnos/alumno.model';
import passport from 'passport';
import moment from 'moment';
class CicloLectivoController {
    constructor() {
        this.path = '/ciclolectivos';
        this.router = Router();
        this.ciclolectivo = ciclolectivoModel;
        this.alumno = alumnoModel;
        this.actual = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const hoy = moment(now).format('YYYY');
            try {
                const ciclolectivo = yield this.ciclolectivo.findOne({ anio: Number(hoy) }).sort('_id');
                response.send(ciclolectivo);
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Error Interno'));
            }
        });
        this.listar = (request, response) => __awaiter(this, void 0, void 0, function* () {
            const ciclolectivos = yield this.ciclolectivo.find().sort('_id');
            response.send(ciclolectivos);
        });
        this.crearManual = (request, response) => __awaiter(this, void 0, void 0, function* () {
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
        });
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get(`${this.path}/crear-manual`, passport.authenticate('jwt', { session: false }), this.crearManual // se usa en parametros y ficha-alumnos
        );
        this.router.get(`${this.path}`, passport.authenticate('jwt', { session: false }), this.listar);
        this.router.get(`${this.path}/actual`, passport.authenticate('jwt', { session: false }), this.actual);
    }
}
export default CicloLectivoController;
//# sourceMappingURL=ciclolectivo.controller.js.map