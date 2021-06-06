import HttpException from './HttpException';
class NotAuthorizedException extends HttpException {
    constructor() {
        super(403, 'Permisos insuficientes');
    }
}
export default NotAuthorizedException;
//# sourceMappingURL=NotAuthorizedException.js.map