var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Router } from 'express';
import NotAuthorizedException from '../exceptions/NotAuthorizedException';
import postModel from '../post/post.model';
import userModel from './user.model';
import UserNotFoundException from '../exceptions/UserNotFoundException';
import passport from 'passport';
class UserController {
    constructor() {
        this.path = '/users';
        this.router = Router();
        this.post = postModel;
        this.user = userModel;
        this.getUserById = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            const userQuery = this.user.findById(id);
            if (request.query.withPosts === 'true') {
                userQuery.populate('posts').exec();
            }
            const user = yield userQuery;
            if (user) {
                response.send(user);
            }
            else {
                next(new UserNotFoundException(id));
            }
        });
        this.getAllPostsOfUser = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const userId = request.params.id;
            const userIdRequest = request.user ? request.user._id.toString() : '';
            if (userId === userIdRequest) {
                const posts = yield this.post.find({ author: userId });
                response.send(posts);
            }
            next(new NotAuthorizedException());
        });
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get(`${this.path}/:id`, passport.authenticate('jwt', { session: false }), this.getUserById);
        // this.router.get(
        //   `${this.path}/:id/posts`,
        //   authMiddleware,
        //   this.getAllPostsOfUser
        // );
    }
}
export default UserController;
//# sourceMappingURL=user.controller.js.map