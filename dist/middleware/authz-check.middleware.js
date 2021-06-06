import NotAuthorizedException from '../exceptions/NotAuthorizedException';
const adminCheck = (request, response, next) => {
    const { NAMESPACE } = process.env;
    const roles = request.user[NAMESPACE] || [];
    if (roles.indexOf('admin') > -1 || roles.indexOf('SuperAdministrador') > -1) {
        next();
    }
    else {
        return next(new NotAuthorizedException());
    }
};
export default adminCheck;
//# sourceMappingURL=authz-check.middleware.js.map