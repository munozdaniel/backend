import 'dotenv/config';
import App from './app';
// import AuthenticationController from './authentication/authentication.controller';

import validateEnv from './utils/validateEnv';
import UsuarioController from './usuario/usuario.controller';
import AlumnoController from './alumnos/alumno.controller';
import AsignaturaController from './asignaturas/asignatura.controller';
import ProfesorController from './profesores/profesor.controller';
import ComisionController from './comisiones/comision.controller';
import PlanillaTallerController from './planillaTaller/planillaTaller.controller';

validateEnv();

const app = new App([
  // Autenticacion
  // new AuthenticationController(),
  // Test
  // Escuela
  new UsuarioController(),
  new AlumnoController(),
  new AsignaturaController(),
  new ComisionController(),
  new ProfesorController(),
  new PlanillaTallerController()
]);

app.listen();
