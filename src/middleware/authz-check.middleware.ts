import { NextFunction, Response } from 'express';
import NotAuthorizedException from '../exceptions/NotAuthorizedException';

const adminCheck = (request: any, response: Response, next: NextFunction) => {
  const { NAMESPACE } = process.env;
  const roles = request.user[NAMESPACE] || [];
  if (roles.indexOf('admin') > -1 || roles.indexOf('SuperAdministrador') > -1) {
    next();
  } else {
    return next(new NotAuthorizedException());
  }
};
export default adminCheck;
