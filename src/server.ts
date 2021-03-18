import 'dotenv/config';
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

validateEnv();

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
]);

app.listen();
