import HttpException from './HttpException';

class NotFoundException extends HttpException {
  constructor(id = 'buscado') {
    super(404, 'El registro ' + id + ' no se encontró');
  }
}

export default NotFoundException;
