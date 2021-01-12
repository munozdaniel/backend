import HttpException from './HttpException';

class NotFoundException extends HttpException {
  constructor(id?: string) {
    super(404, 'El registro buscado no se encontró');
  }
}

export default NotFoundException;
