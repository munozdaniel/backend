import HttpException from '../exceptions/HttpException';
import r, { Request, Response, NextFunction } from 'express';
import PostNotFoundException from '../exceptions/PostNotFoundException';
import Controller from '../interfaces/controller.interface';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import authMiddleware from '../middleware/auth.middleware';
import validationMiddleware from '../middleware/validation.middleware';
import CreatePostDto from './post.dto';
import Post from './post.interface';
import postModel from './post.model';
const { Router } = r;

class PostController implements Controller {
  public path = '/posts';
  public router = Router();
  private post = postModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
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

  private getAllPosts = async (request: Request, response: Response) => {
    console.log('all');
    const posts = await this.post.find().populate('author', '-password');
    response.send(posts);
  };

  private getPostById = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const post = await this.post.findById(id);
      if (post) {
        response.send(post);
      } else {
        next(new PostNotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private modifyPost = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    const postData: Post = request.body;
    try {
      const post = await this.post.findByIdAndUpdate(id, postData, {
        new: true,
      });
      if (post) {
        response.send(post);
      } else {
        next(new PostNotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private createPost = async (request: RequestWithUser, response: Response) => {
    const postData: CreatePostDto = request.body;
    const createdPost = new this.post({
      ...postData,
      author: request.user ? request.user._id : null,
    });

    const savedPost = await createdPost.save();
    await savedPost.populate('author', '-password').execPopulate();
    response.send(savedPost);
  };

  private deletePost = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    try {
      const successResponse = await this.post.findByIdAndDelete(id);
      if (successResponse) {
        response.send(200);
      } else {
        next(new PostNotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
}

export default PostController;
