import { NextFunction, Request, Response } from 'express';
import HttpException from '../exceptions/HttpException';

export function errorMiddleware(error: HttpException, request: Request, response: Response, next: NextFunction) {
  const status = error.status || 500;
  const message = error.message || 'Ocurrió un problema interno';
  response.status(status).send({
    message,
    status,
  });
}
