import 'dotenv/config';
import App from './app';
// import AuthenticationController from './authentication/authentication.controller';

import validateEnv from './utils/validateEnv';
import UsuarioController from './usuario/usuario.controller';

validateEnv();

const app = new App([
  // Autenticacion
  // new AuthenticationController(),
  // Test
  // Escuela
    new UsuarioController(),


]);

app.listen();
