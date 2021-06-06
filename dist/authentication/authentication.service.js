var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import UserWithThatEmailAlreadyExistsException from '../exceptions/UserWithThatEmailAlreadyExistsException';
import userModel from './../user/user.model';
class AuthenticationService {
    constructor() {
        this.user = userModel;
    }
    register(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield this.user.findOne({ email: userData.email })) {
                throw new UserWithThatEmailAlreadyExistsException(userData.email);
            }
            const hashedPassword = yield bcrypt.hash(userData.password, 10);
            const user = yield this.user.create(Object.assign(Object.assign({}, userData), { password: hashedPassword }));
            const tokenData = this.createToken(user);
            const cookie = this.createCookie(tokenData);
            return {
                cookie,
                user,
            };
        });
    }
    createCookie(tokenData) {
        return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn}`;
    }
    createToken(user) {
        const expiresIn = 60 * 60; // an hour
        const secret = process.env.JWT_SECRET;
        const dataStoredInToken = {
            _id: user._id,
        };
        return {
            expiresIn,
            usuarioNombre: user.fullName,
            token: jwt.sign(dataStoredInToken, secret, { expiresIn }),
        };
    }
}
export default AuthenticationService;
//# sourceMappingURL=authentication.service.js.map