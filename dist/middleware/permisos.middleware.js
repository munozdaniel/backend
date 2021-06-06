import NotAuthorizedException from '../exceptions/NotAuthorizedException';
import AuthenticationTokenMissingException from '../exceptions/AuthenticationTokenMissingException';
/**
 *
 * Si llamamos checkIsInRolecon 1 argumento, ROLES.ADMIN solo los administradores podrán acceder a esa página.
 * Si llamamos checkIsInRolecon 1 argumento, ROLES.CLIENTE solo los clientes podrán acceder a esa página.
 * Si llamamos checkIsInRolecon 2 argumentos, ROLES.ADMIN, ROLES.CLIENTE tanto los
 * administradores como los clientes podrán acceder a esa página (pero no los usuarios sin un rol).
 *  */
const checkPermisos = (...roles) => (request, response, next) => {
    const usuario = request.user;
    if (!usuario) {
        // El usuario no existe
        next(new AuthenticationTokenMissingException());
        // return response.redirect('/login');
    }
    else {
        const hasRole = roles.find((role) => usuario.rol === role);
        if (!hasRole) {
            // No tiene los roles solicitados
            next(new NotAuthorizedException());
            // return response.redirect('/login');
        }
    }
    return next();
};
export default checkPermisos;
//# sourceMappingURL=permisos.middleware.js.map