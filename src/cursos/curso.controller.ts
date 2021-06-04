import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import NotFoundException from '../exceptions/NotFoundException';
import Controller from '../interfaces/controller.interface';
import validationMiddleware from '../middleware/validation.middleware';
import CreateCursoDto from './curso.dto';
import Curso from './curso.interface';
import cursoModel from './curso.model';
import escapeStringRegexp from 'escape-string-regexp';
import ICurso from './curso.interface';
import comisionOriginalModel from './comisionOriginal.model';
import alumnoModel from '../alumnos/alumno.model';
import comisionUnicaModel from './comisionUnica.model';
import moment from 'moment';
import passport from 'passport';
class CursoController implements Controller {
  public path = '/cursos';
  public router = Router();
  private curso = cursoModel;
  private comisionOriginal = comisionOriginalModel;
  private comisionSql = comisionUnicaModel;
  private alumno = alumnoModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    console.log('CursoController/initializeRoutes');
    this.router.get(`${this.path}/migrar-unicas`, passport.authenticate('jwt', { session: false }), this.migrarCursoesUnicas);
    this.router.get(`${this.path}/migrar`, passport.authenticate('jwt', { session: false }), this.migrarCursoes);
    // this.router.get(`${this.path}/migraralumnos`, this.migrarAlumnos);
    this.router.post(
      `${this.path}/parametros`,
      passport.authenticate('jwt', { session: false }),
      this.buscarCursoesPorCicloLectivo // se usa en parametros y ficha-alumnos
    );

    this.router.get(`${this.path}/originales`, passport.authenticate('jwt', { session: false }), this.verCursoesOriginales);
    this.router.get(`${this.path}`, passport.authenticate('jwt', { session: false }), this.getAllCursos);
    this.router.get(`${this.path}/habilitados`, passport.authenticate('jwt', { session: false }), this.getAllCursoesHabilitadas);
    this.router.get(`${this.path}/:id`, passport.authenticate('jwt', { session: false }), this.getCursoByAlumnoId);
    // this.router.get(`${this.path}/paginado`, this.getAllCursosPag);

    // Using the  route.all in such a way applies the middleware only to the route
    // handlers in the chain that match the  `${this.path}/*` route, including  POST /cursos.
    this.router
      .all(`${this.path}/*`)
      .patch(`${this.path}/:id`, validationMiddleware(CreateCursoDto, true), this.modifyCurso)
      .get(`${this.path}/:id`, this.obtenerCursoPorId)
      .delete(`${this.path}/:id`, this.deleteCurso)
      .put(`${this.path}/deshabilitar/:id`, this.deshabilitarCurso)
      .put(`${this.path}/habilitar/:id`, this.habilitarCurso)
      .put(
        this.path,
        validationMiddleware(CreateCursoDto),
        // checkPermisos(rolesEnum.ADMIN), // elimintar. test
        this.createCurso
      );
  }

  private buscarCursoesPorCicloLectivo = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const now = new Date();
      const hoy = new Date(moment(now).format('YYYY-MM-DD'));
      const curso: ICurso = request.body.curso;
      const unaCurso = await this.curso.findOne({
        // cicloLectivo: curso.cicloLectivo,
        comision: curso.comision,
        division: Number(curso.division),
        curso: Number(curso.curso),
        activo: curso.activo,
      });
      // .populate(" alumno"); //.populate('author', '-password') populate con imagen
      if (unaCurso) {
        response.send(unaCurso);
      } else {
        curso.fechaCreacion = hoy;
        const cursoData: CreateCursoDto = curso as any;
        const createdCurso = new this.curso({
          ...cursoData,
        });
        const savedCurso = await createdCurso.save();
        // await savedCurso.populate('author', '-password').execPopulate();
        response.send(savedCurso);
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
  private getAllCursos = async (request: Request, response: Response) => {
    const cursos = await this.curso.find().sort('_id').populate('alumno'); //.populate('author', '-password') populate con imagen

    response.send(cursos);
  };
  private verCursoesOriginales = async (request: Request, response: Response) => {
    const cursos = await this.comisionOriginal.find().sort('_id'); //.populate('author', '-password') populate con imagen

    response.send(cursos);
  };
  private getAllCursoesHabilitadas = async (request: Request, response: Response) => {
    const cursos = await this.curso.find({ activo: true }).sort({ _id: -1 }); //.populate('author', '-password') populate con imagen

    response.send(cursos);
  };
  private obtenerCursoPorId = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const curso = await this.curso.findById(id);
      if (curso) {
        response.send(curso);
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
  private getCursoByAlumnoId = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const curso = await this.curso.findById({ alumnoId: id });
      if (curso) {
        response.send(curso);
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
  private migrarCursoesUnicas = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const now = new Date();
      const hoy = new Date(moment(now).format('YYYY-MM-DD'));
      const cursos: any = await this.comisionSql.find();

      const cursosRefactorizados: ICurso[] = await Promise.all(
        cursos.map(async (x: any, index: number) => {
          const unaCurso: ICurso & any = {
            // _id: x._id,
            // alumnoId: x.id_alumnos,
            cursoNro: 100 + index,
            comision: x.comision ? x.comision.toUpperCase() : 'Sin Registrar',
            cicloLectivo: x.ciclo_lectivo ? Number(x.ciclo_lectivo) : null,
            curso: x.Tcurso ? Number(x.Tcurso) : null,
            division: x.Division ? Number(x.Division) : null,
            // condicion: x.Condicion
            //   ? x.Condicion.toUpperCase()
            //   : 'Sin Registrar',

            fechaCreacion: hoy,
            activo: true,
          };

          return unaCurso;
        })
      );

      try {
        const savedCursos = await this.curso.insertMany(cursosRefactorizados);
        response.send({
          savedCursos,
        });
      } catch (e) {
        console.log('ERROR', e);
        next(new HttpException(500, 'Ocurrió un error al guardar las cursos'));
      }
    } catch (e2) {
      console.log('ERROR', e2);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
  private migrarCursoes = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const now = new Date();
      const hoy = new Date(moment(now).format('YYYY-MM-DD'));
      const cursos: any = await this.comisionOriginal.find();

      const cursosRefactorizados: ICurso[] = await Promise.all(
        cursos.map(async (x: any, index: number) => {
          if (!x.Tcurso) {
          }
          let alo = null;
          try {
            alo = await this.alumno.find({ alumnoId: x.id_alumnos });
          } catch (ero) {
            console.log('ero', ero);
          }
          const unaCurso: ICurso & any = {
            // _id: x._id,
            // alumnoId: x.id_alumnos,
            alumno: alo,
            cursoNro: 100 + index,
            comision: x.comision ? x.comision.toUpperCase() : 'Sin Registrar',
            cicloLectivo: x.ciclo_lectivo ? Number(x.ciclo_lectivo) : null,
            curso: x.Tcurso ? Number(x.Tcurso) : null,
            division: x.Division ? Number(x.Division) : null,
            condicion: x.Condicion ? x.Condicion.toUpperCase() : 'Sin Registrar',

            fechaCreacion: hoy,
            activo: true,
          };

          return unaCurso;
        })
      );

      try {
        const savedCursos = await this.curso.insertMany(cursosRefactorizados);
        response.send({
          savedCursos,
        });
      } catch (e) {
        console.log('ERROR', e);
        next(new HttpException(500, 'Ocurrió un error al guardar las cursos'));
      }
    } catch (e2) {
      console.log('ERROR', e2);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private getCursoById = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const curso = await this.curso.findById(id).populate('imagenes');
      if (curso) {
        response.send(curso);
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private modifyCurso = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    const cursoData: Curso = request.body;
    try {
      const curso = await this.curso.findByIdAndUpdate(id, cursoData, {
        new: true,
      });

      if (curso) {
        response.send(curso);
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private createCurso = async (request: Request, response: Response, next: NextFunction) => {
    // Agregar datos
    const cursoData: CreateCursoDto = request.body;
    const createdCurso = new this.curso({
      ...cursoData,
      // author: request.user ? request.user._id : null,
    });
    const savedCurso = await createdCurso.save();
    // await savedCurso.populate('author', '-password').execPopulate();
    response.send(savedCurso);
  };
  private createCursoComplete = async (request: Request, response: Response, next: NextFunction) => {
    // Agregar foto
    // Agregar datos
    const cursoData: CreateCursoDto = request.body;
    const createdCurso = new this.curso({
      ...cursoData,
      // author: request.user ? request.user._id : null,
    });
    const savedCurso = await createdCurso.save();
    //     const imagen: ImagenDto = {
    //       descripcion:''
    // posicion:.posicion,
    // src:''
    //     }
    // await savedCurso.populate('author', '-password').execPopulate();
    response.send(savedCurso);
  };
  private deleteCurso = async (request: Request, response: Response, next: NextFunction) => {
    console.log('deleteCurso');
    const id = request.params.id;
    try {
      const successResponse = await this.curso.findByIdAndDelete(id);
      if (successResponse) {
        response.send({
          status: 200,
          success: true,
          message: 'Operación Exitosa',
        });
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
  private deshabilitarCurso = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const successResponse = await this.curso.findByIdAndUpdate(id, {
        activo: false,
      });
      if (successResponse) {
        response.send({
          status: 200,
          success: true,
          message: 'Operación Exitosa',
        });
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
  private habilitarCurso = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const successResponse = await this.curso.findByIdAndUpdate(id, {
        activo: true,
      });
      if (successResponse) {
        response.send({
          status: 200,
          success: true,
          message: 'Operación Exitosa',
        });
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
}

export default CursoController;
