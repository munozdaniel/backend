import HttpException from './HttpException';

class WrongCredentialsException extends HttpException {
  constructor() {
    super(401, 'La contraseña o el email son incorrectos');
  }
}

export default WrongCredentialsException;
