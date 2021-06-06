var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import HttpException from '../exceptions/HttpException';
import { Router } from 'express';
import PostNotFoundException from '../exceptions/PostNotFoundException';
import validationMiddleware from '../middleware/validation.middleware';
import CreatePostDto from './post.dto';
import postModel from './post.model';
class PostController {
    constructor() {
        this.path = '/posts';
        this.router = Router();
        this.post = postModel;
        this.getAllPosts = (request, response) => __awaiter(this, void 0, void 0, function* () {
            console.log('all');
            const posts = yield this.post.find().populate('author', '-password');
            response.send(posts);
        });
        this.getPostById = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const post = yield this.post.findById(id);
                if (post) {
                    response.send(post);
                }
                else {
                    next(new PostNotFoundException(id));
                }
            }
            catch (e) {
                console.log('[ERROR]', e);
                next(new HttpException(400, 'Parametros Incorrectos'));
            }
        });
        this.modifyPost = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            const postData = request.body;
            try {
                const post = yield this.post.findByIdAndUpdate(id, postData, {
                    new: true,
                });
                if (post) {
                    response.send(post);
                }
                else {
                    next(new PostNotFoundException(id));
                }
            }
            catch (e) {
                console.log('[ERROR]', e);
                next(new HttpException(400, 'Parametros Incorrectos'));
            }
        });
        this.createPost = (request, response) => __awaiter(this, void 0, void 0, function* () {
            const postData = request.body;
            const createdPost = new this.post(Object.assign(Object.assign({}, postData), { author: request.user ? request.user._id : null }));
            const savedPost = yield createdPost.save();
            yield savedPost.populate('author', '-password').execPopulate();
            response.send(savedPost);
        });
        this.deletePost = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            const id = request.params.id;
            try {
                const successResponse = yield this.post.findByIdAndDelete(id);
                if (successResponse) {
                    response.send(200);
                }
                else {
                    next(new PostNotFoundException(id));
                }
            }
            catch (e) {
                console.log('[ERROR]', e);
                next(new HttpException(400, 'Parametros Incorrectos'));
            }
        });
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Publicos
        this.router.get(this.path, this.getAllPosts);
        this.router.get(`${this.path}/:id`, this.getPostById);
        //
        // Privados
        this.router
            // .all(`${this.path}/*`, authMiddleware)
            .patch(`${this.path}/:id`, validationMiddleware(CreatePostDto, true), this.modifyPost)
            .delete(`${this.path}/:id`, this.deletePost);
        // .post(
        //   this.path,
        //   authMiddleware,
        //   validationMiddleware(CreatePostDto),
        //   this.createPost
        // );
    }
}
export default PostController;
//# sourceMappingURL=post.controller.js.map