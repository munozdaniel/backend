import * as dotenv from 'dotenv';
import App from './app';
import AuthenticationController from './authentication/authentication.controller';

import validateEnv from './utils/validateEnv';
import UsuarioController from './usuario/usuario.controller';
import AlumnoController from './alumnos/alumno.controller';
import AsignaturaController from './asignaturas/asignatura.controller';
import ProfesorController from './profesores/profesor.controller';
import PlanillaTallerController from './planillaTaller/planillaTaller.controller';
import SeguimientoAlumnoController from './seguimientoAlumnos/seguimientoAlumno.controller';
import TemaController from './temas/tema.controller';
import AsistenciaController from './asistencias/asistencia.controller';
import CalificacionController from './calificaciones/calificacion.controller';
import CicloLectivoController from './ciclolectivos/ciclolectivo.controller';
import CalendarioController from './calendario/calendario.controller';
import AlumnoTallerController from './alumnostalleres/alumnoTaller.controller';
import TemaPendienteController from './temaspendientes/temaPendiente.controller';
import ExamenController from './examen/examen.controller';

validateEnv();
dotenv.config();

const app = new App([
  // Autenticacion
  new AuthenticationController(),
  // Test
  // Escuela
  new UsuarioController(),
  new AlumnoController(),
  new AsignaturaController(),
  new ProfesorController(),
  new PlanillaTallerController(),
  new SeguimientoAlumnoController(),
  new TemaController(),
  new AsistenciaController(),
  new CalificacionController(),
  new CicloLectivoController(),
  new CalendarioController(),
  new AlumnoTallerController(),
  new TemaPendienteController(),
  new ExamenController(),
]);

app.listen();
