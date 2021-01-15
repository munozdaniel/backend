import 'dotenv/config';
import App from './app';
// import AuthenticationController from './authentication/authentication.controller';

import validateEnv from './utils/validateEnv';
import UsuarioController from './usuario/usuario.controller';
import AlumnoController from './alumnos/alumno.controller';
import AlumnoOriginalController from './alumnos/alumnoOriginal.controller';

validateEnv();

const app = new App([
  // Autenticacion
  // new AuthenticationController(),
  // Test
  // Escuela
  new UsuarioController(),
  new AlumnoController(),
  new AlumnoOriginalController(),
]);

app.listen();
