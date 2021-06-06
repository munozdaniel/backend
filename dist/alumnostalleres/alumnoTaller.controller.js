var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import mongoose from 'mongoose';
import HttpException from '../exceptions/HttpException';
import { Router } from 'express';
import alumnoTallerModel from './alumnoTaller.model';
import alumnoModel from '../alumnos/alumno.model';
import planillaTallerModel from '../planillaTaller/planillaTaller.model';
import passport from 'passport';
const ObjectId = mongoose.Types.ObjectId;
class AlumnoTallerController {
    constructor() {
        this.path = '/alumno-taller';
        this.router = Router();
        this.alumnoTaller = alumnoTallerModel;
        this.alumno = alumnoModel;
        this.planillaTaller = planillaTallerModel;
        this.obtenerAlumnosTallerPorCursoEspecificoSP = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const { curso, comision, division, cicloLectivo } = request.body;
            let match = {
                'estadoCursadas.activo': true,
                'estadoCursadas.cicloLectivo._id': ObjectId(cicloLectivo._id),
                'estadoCursadas.curso.comision': comision,
                'estadoCursadas.curso.curso': Number(curso),
                'estadoCursadas.curso.division': Number(division),
                activo: true,
            };
            // obtenemos los alumnos
            const opciones = [
                {
                    $lookup: {
                        from: 'estadocursadas',
                        localField: 'estadoCursadas',
                        foreignField: '_id',
                        as: 'estadoCursadas',
                    },
                },
                {
                    $unwind: {
                        path: '$estadoCursadas',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: 'ciclolectivos',
                        localField: 'estadoCursadas.cicloLectivo',
                        foreignField: '_id',
                        as: 'estadoCursadas.cicloLectivo',
                    },
                },
                {
                    $unwind: {
                        path: '$estadoCursadas.cicloLectivo',
                    },
                },
                {
                    $lookup: {
                        from: 'cursos',
                        localField: 'estadoCursadas.curso',
                        foreignField: '_id',
                        as: 'estadoCursadas.curso',
                    },
                },
                {
                    $unwind: {
                        path: '$estadoCursadas.curso',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $match: match,
                },
                {
                    $sort: {
                        _id: -1,
                    },
                },
            ];
            const alumnosTaller = yield this.alumno.aggregate(opciones);
            if (alumnosTaller && alumnosTaller.length > 0) {
                const alumnosRetorno = yield Promise.all(alumnosTaller.map((x) => {
                    return {
                        selected: false,
                        alumno: x,
                        planillaTaller: null,
                    };
                }));
                return response.status(200).send(alumnosRetorno);
            }
            else {
                response.send([]);
            }
        });
        this.obtenerAlumnosTallerPorCursoEspecifico = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const { planillaTaller, curso, comision, division, cicloLectivo } = request.body;
            let match = {
                'estadoCursadas.activo': true,
                'estadoCursadas.cicloLectivo._id': ObjectId(cicloLectivo._id),
                // 'estadoCursadas.curso.comision': comision,
                'estadoCursadas.curso.curso': Number(curso),
                'estadoCursadas.curso.division': Number(division),
                activo: true,
            };
            // obtenemos los alumnos
            const opciones = [
                {
                    $lookup: {
                        from: 'estadocursadas',
                        localField: 'estadoCursadas',
                        foreignField: '_id',
                        as: 'estadoCursadas',
                    },
                },
                {
                    $unwind: {
                        path: '$estadoCursadas',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: 'ciclolectivos',
                        localField: 'estadoCursadas.cicloLectivo',
                        foreignField: '_id',
                        as: 'estadoCursadas.cicloLectivo',
                    },
                },
                {
                    $unwind: {
                        path: '$estadoCursadas.cicloLectivo',
                    },
                },
                {
                    $lookup: {
                        from: 'cursos',
                        localField: 'estadoCursadas.curso',
                        foreignField: '_id',
                        as: 'estadoCursadas.curso',
                    },
                },
                {
                    $unwind: {
                        path: '$estadoCursadas.curso',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $match: match,
                },
                {
                    $sort: {
                        _id: -1,
                    },
                },
            ];
            const alumnosTaller = yield this.alumno.aggregate(opciones);
            if (alumnosTaller && alumnosTaller.length > 0) {
                const alumnosPorPlanilla = yield this.alumnoTaller.find({ planillaTaller: ObjectId(planillaTaller._id) });
                if (!alumnosPorPlanilla || alumnosPorPlanilla.length < 1) {
                    const alumnosRetorno = yield Promise.all(alumnosTaller.map((x) => {
                        return {
                            selected: false,
                            alumno: x,
                            planillaTaller,
                        };
                    }));
                    return response.status(200).send(alumnosRetorno);
                }
                else {
                    const alumnosRetorno = yield Promise.all(alumnosTaller.map((x) => {
                        const index = alumnosPorPlanilla.findIndex((i, ind) => {
                            return i.alumno.toString() === x._id.toString();
                        });
                        if (index === -1) {
                            return {
                                selected: false,
                                alumno: x,
                                planillaTaller,
                            };
                        }
                        else {
                            return {
                                selected: true,
                                alumno: x,
                                planillaTaller,
                            };
                        }
                    }));
                    return response.status(200).send(alumnosRetorno);
                }
            }
            else {
                response.send([]);
            }
        });
        this.agregarAlumnosALaPlanilla = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const planillaId = request.params.id;
            const alumnosTaller = request.body;
            try {
                const alumnosPorPlanilla = yield this.alumnoTaller.find({ planillaTaller: ObjectId(planillaId) });
                // YA HAY ALUMNOSTALLER
                if (alumnosPorPlanilla && alumnosPorPlanilla.length > 0) {
                    // recorremos los alumnos que ya tenemos insertado para ver si los borramos
                    const alumnosEliminados = yield Promise.all(alumnosPorPlanilla.map((x) => __awaiter(this, void 0, void 0, function* () {
                        const index = alumnosTaller.findIndex((i) => i.alumno.toString() === x.alumno.toString());
                        if (index === -1) {
                            // Si el alumnotaller no existe en alumnos entonces lo borramos
                            try {
                                yield this.alumnoTaller.findOneAndDelete({
                                    alumno: ObjectId(x.alumno._id.toString()),
                                    planillaTaller: ObjectId(planillaId.toString()),
                                });
                            }
                            catch (errorDelete) {
                                console.log('[ERROR DELETE]', errorDelete);
                                next(new HttpException(500, 'Problemas  interno'));
                            }
                        }
                        else {
                            // si ya existe no hacemos nada
                        }
                    })));
                    // recorremos los alumnosTaller que vienen por parametro para ver si insertamos alguno
                    const alumnosAgregados = yield Promise.all(alumnosTaller.map((x) => __awaiter(this, void 0, void 0, function* () {
                        const index = alumnosPorPlanilla.findIndex((i) => i.alumno.toString() === x.alumno.toString());
                        if (index === -1) {
                            // Insertamos
                            const createdAlumnoT = new this.alumnoTaller(Object.assign({}, x));
                            try {
                                const savedAlumno = yield createdAlumnoT.save();
                            }
                            catch (errorAdd) {
                                console.log('[ERROR ADD]', errorAdd);
                                next(new HttpException(500, 'Problemas  interno'));
                            }
                        }
                        else {
                            // si ya existe no hacemos nada
                        }
                    })));
                    if ((alumnosAgregados && alumnosAgregados.length > 0) || (alumnosEliminados && alumnosEliminados.length > 0)) {
                        const planillaActualizada = yield this.planillaTaller.findByIdAndUpdate(planillaId, { personalizada: true }, { new: true });
                        return response.status(200).send({
                            planillaTaller: planillaActualizada,
                            success: true,
                            message: 'La planilla taller ha sido actualizada con los alumnos seleccionados',
                        });
                    }
                    else {
                        return response.status(200).send({ success: true, message: 'No se modificaron los registros' });
                    }
                }
                else {
                    // NO HAY ALUMNOSTALLER Y LOS INSERTO A TODOS
                    const registrosGuardados = yield Promise.all(alumnosTaller.map((x) => __awaiter(this, void 0, void 0, function* () {
                        // Insertamos
                        const createdAlumnoT = new this.alumnoTaller(Object.assign({}, x));
                        const savedAlumno = yield createdAlumnoT.save();
                    })));
                    if (registrosGuardados && registrosGuardados.length > 0) {
                        const planillaActualizada = yield this.planillaTaller.findByIdAndUpdate(planillaId, { personalizada: true }, { new: true });
                        return response.status(200).send({
                            planillaTaller: planillaActualizada,
                            success: true,
                            message: 'La planilla taller ha sido actualizada con los alumnos seleccionados',
                        });
                    }
                    else {
                        return response.status(200).send({ success: true, message: 'No se guardaron datos porque no se seleccionaron alumnos' });
                    }
                }
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Problemas  interno'));
            }
        });
        this.obtenerAlumnosPorPlanillaPersonalizadaSP = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const alumnosTaller = yield this.alumno.find({ activo: true });
                const alumnosRetorno = yield Promise.all(alumnosTaller.map((x) => {
                    return {
                        selected: false,
                        alumno: x,
                        planillaTaller: null,
                    };
                }));
                return response.status(200).send(alumnosRetorno);
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Problemas  interno'));
            }
        });
        this.obtenerAlumnosPorPlanillaPersonalizada = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const planillaId = request.params.id;
            try {
                const planillaTaller = yield this.planillaTaller.findById(planillaId);
                const alumnosTaller = yield this.alumno.find({ activo: true });
                const alumnosPorPlanilla = yield this.alumnoTaller.find({ planillaTaller: ObjectId(planillaId) });
                if (!alumnosPorPlanilla || alumnosPorPlanilla.length < 1) {
                    const alumnosRetorno = yield Promise.all(alumnosTaller.map((x) => {
                        return {
                            selected: false,
                            alumno: x,
                            planillaTaller,
                        };
                    }));
                    return response.status(200).send(alumnosRetorno);
                }
                else {
                    const alumnosRetorno = yield Promise.all(alumnosTaller.map((x) => {
                        const index = alumnosPorPlanilla.findIndex((i, ind) => {
                            return i.alumno.toString() === x._id.toString();
                        });
                        if (index === -1) {
                            return {
                                selected: false,
                                alumno: x,
                                planillaTaller,
                            };
                        }
                        else {
                            return {
                                selected: true,
                                alumno: x,
                                planillaTaller,
                            };
                        }
                    }));
                    return response.status(200).send(alumnosRetorno);
                }
            }
            catch (error) {
                console.log('[ERROR]', error);
                next(new HttpException(500, 'Problemas  interno'));
            }
        });
        this.initializeRoutes();
    }
    initializeRoutes() {
        console.log('AlumnoTallerController/initializeRoutes');
        this.router
            .all(`${this.path}/*`, passport.authenticate('jwt', { session: false }))
            .get(`${this.path}/planilla-personalizada/:id`, this.obtenerAlumnosPorPlanillaPersonalizada)
            .get(`${this.path}/planilla-personalizada-sp`, this.obtenerAlumnosPorPlanillaPersonalizadaSP)
            .post(`${this.path}/por-curso-especifico`, this.obtenerAlumnosTallerPorCursoEspecifico)
            .post(`${this.path}/por-curso-especifico-sp`, this.obtenerAlumnosTallerPorCursoEspecificoSP)
            .put(`${this.path}/:id`, this.agregarAlumnosALaPlanilla);
    }
}
export default AlumnoTallerController;
//# sourceMappingURL=alumnoTaller.controller.js.map