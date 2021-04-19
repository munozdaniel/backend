import NotAuthorizedException from '../exceptions/NotAuthorizedException';
import NotFoundException from '../exceptions/NotFoundException';
import { NextFunction, Request, Response } from 'express';
import { IUsuario } from 'usuario/usuario.interface';
import AuthenticationTokenMissingException from '../exceptions/AuthenticationTokenMissingException';
/**
 *
 * Si llamamos checkIsInRolecon 1 argumento, ROLES.ADMIN solo los administradores podrán acceder a esa página.
 * Si llamamos checkIsInRolecon 1 argumento, ROLES.CLIENTE solo los clientes podrán acceder a esa página.
 * Si llamamos checkIsInRolecon 2 argumentos, ROLES.ADMIN, ROLES.CLIENTE tanto los
 * administradores como los clientes podrán acceder a esa página (pero no los usuarios sin un rol).
 *  */
const checkPermisos = (...roles: string[]) => (
  request: Request,
  response: Response,
  next: NextFunction
) => {

  const usuario: any = request.user;

  if (!usuario) {
    // El usuario no existe
    next(new AuthenticationTokenMissingException());

    // return response.redirect('/login');
  } else {
    const hasRole = roles.find((role: string) => usuario.rol === role);
    if (!hasRole) {
      // No tiene los roles solicitados
      next(new NotAuthorizedException());

      // return response.redirect('/login');
    }
  }

  return next();
};
export default checkPermisos;
