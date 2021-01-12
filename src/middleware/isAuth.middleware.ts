import NotAuthorizedException from '../exceptions/NotAuthorizedException';
import { NextFunction, Response } from 'express';

async function isAuthMiddleware(
  request: any,
  response: Response,
  next: NextFunction
) {
  if (request.isAuthenticated()) {
    return next();
  }
  return next(new NotAuthorizedException());
}

export default authMiddleware;
