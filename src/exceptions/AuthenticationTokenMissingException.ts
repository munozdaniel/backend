import HttpException from './HttpException';

class AuthenticationTokenMissingException extends HttpException {
  constructor() {
    super(401, 'Autenticación caducada');
  }
}

export default AuthenticationTokenMissingException;
