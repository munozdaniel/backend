var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as jwt from 'jsonwebtoken';
import AuthenticationTokenMissingException from '../exceptions/AuthenticationTokenMissingException';
import WrongAuthenticationTokenException from '../exceptions/WrongAuthenticationTokenException';
import userModel from '../user/user.model';
function authMiddleware(request, response, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const cookies = request.cookies;
        if (cookies && cookies.Authorization) {
            const secret = process.env.JWT_SECRET;
            try {
                const verificationResponse = jwt.verify(cookies.Authorization, secret);
                const id = verificationResponse._id;
                const user = yield userModel.findById(id);
                if (user) {
                    request.user = user;
                    next();
                }
                else {
                    next(new WrongAuthenticationTokenException());
                }
            }
            catch (error) {
                next(new WrongAuthenticationTokenException());
            }
        }
        else {
            next(new AuthenticationTokenMissingException());
        }
    });
}
export default authMiddleware;
//# sourceMappingURL=auth.middleware.js.map