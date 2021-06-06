import HttpException from './HttpException';
class UserWithThatEmailAlreadyExistsException extends HttpException {
    constructor(email) {
        super(400, `El usuario con el email ${email} ya se encuentra registrado`);
    }
}
export default UserWithThatEmailAlreadyExistsException;
//# sourceMappingURL=UserWithThatEmailAlreadyExistsException.js.map