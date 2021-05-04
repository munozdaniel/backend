// import { plainToClass } from 'class-transformer';
// import { validate, ValidationError } from 'class-validator';
import { RequestHandler } from 'express';
import HttpException from '../exceptions/HttpException';
import pkg, { ValidationError } from 'class-validator';
const { validate } = pkg;
import classTransformer from 'class-transformer';
const { plainToClass } = classTransformer;

function validationMiddleware<T>(type: any, skipMissingProperties = false): RequestHandler {
  return (req, res, next) => {
    validate(plainToClass(type, req.body), { skipMissingProperties }).then((errors: ValidationError[]) => {
      if (errors.length > 0) {
        // TODO: Capturar los campos que no son validos
        const message = errors.map((error: ValidationError) => Object.values(error.constraints)).join(', ');
        console.log('message', message);
        next(new HttpException(400, message));
      } else {
        next();
      }
    });
  };
}

export default validationMiddleware;
