import HttpException from '../exceptions/HttpException';
import { Request, Response, NextFunction, Router } from 'express';
import NotFoundException from '../exceptions/NotFoundException';
import Controller from '../interfaces/controller.interface';
import validationMiddleware from '../middleware/validation.middleware';
import CreateProductoDto from './producto.dto';
import Producto from './producto.interface';
import productoModel from './producto.model';
import passport from 'passport';
import { IQueryProductoPag } from '../utils/interfaces/iQueryProductoPag';
import escapeStringRegexp from 'escape-string-regexp';
import { Query } from 'mongoose';
class ProductoController implements Controller {
  public path = '/productos';
  public router = Router();
  private producto = productoModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    console.log('ProductoController/initializeRoutes');
    // we want everyone to be able to see our productos, guests included. We can apply the middleware for a specific handler
    this.router.get(this.path, this.getAllProductos);
    this.router.get(`${this.path}/paginado`, this.getAllProductosPag);
    this.router.get(`${this.path}/paginadoFav`, this.getAllProductosPag);
    this.router.get(
      `${this.path}/destacados`,
      // checkPermisos(rolesEnum.ADMIN), // elimintar. test
      this.getAllProductosDestacados
    );
    this.router.get(`${this.path}/:id`, this.getProductoById);

    // Using the  route.all in such a way applies the middleware only to the route
    // handlers in the chain that match the  `${this.path}/*` route, including  POST /productos.
    this.router
      .all(`${this.path}/*`, passport.authenticate('jwt', { session: false }))
      .patch(
        `${this.path}/:id`,
        validationMiddleware(CreateProductoDto, true),
        this.modifyProducto
      )
      .delete(`${this.path}/:id`, this.deleteProducto)
      .put(
        this.path,
        validationMiddleware(CreateProductoDto),
        // checkPermisos(rolesEnum.ADMIN), // elimintar. test
        this.createProducto
      );
  }

  private getAllProductos = async (request: Request, response: Response) => {
    const productos = await this.producto.find().populate('imagenes'); //.populate('author', '-password') populate con imagen

    response.send(productos);
  };

  private getAllProductosPag = async (request: Request, response: Response) => {
    // console.log('====================================================');
    // console.log('request body', request.body);
    console.log('request ', request.query);
    // console.log('escapeStringRegexp ', escapeStringRegexp(request.query));
    const parametros: IQueryProductoPag = request.query;

    const criterios = request.query.query
      ? JSON.parse(request.query.query)
      : {};
    const query: { [k: string]: any } = {};
    for (const [key, value] of Object.entries(criterios)) {
      switch (key.toLocaleLowerCase()) {
        case 'titulo':
          if (value) {
            query.titulo = {
              $regex: new RegExp(
                '^' + escapeStringRegexp(value.toString()).toLowerCase(),
                'i'
              ),
            };
          }
          break;
        case 'marca':
          if (value) {
            const marcas: string[] = value as string[];
            if (marcas.length > 0) {
              query.marca = { $in: marcas };
            }
          }
          break;
        case 'tamano':
          if (value) {
            query.tamano = value;
          }
          break;
        case 'edad':
          if (value) {
            query.edad = value;
          }
          break;
        default:
          break;
      }
      // console.log(key + ' ' + value); // "titulo AAAA"

      // if (key.toLocaleLowerCase() === 'marca' && value) {
      //   const marcas: string[] = value as string[];
      //   if (marcas.length > 0) {
      //     query.marca = { $in: marcas };
      //   }
      // }
      // if (key.toLocaleLowerCase() === 'tamano' && value) {
      //   query.tamano = value;
      // }
    }
    const count = request.query.count || 5;
    const page = request.query.page || 1;
    console.log('query ', query);

    this.producto.paginate(
      query,
      {
        page: Number(parametros.page),
        limit: Number(parametros.limit),
        sort: JSON.parse(parametros.sort || null),
        populate: ['imagenes', 'categorias'],
      },
      (err: any, result: any) => {
        // console.log('>>>',  result);
        // result.docs
        // result.total
        // result.limit - 10
        // result.page - 3
        // result.pages
        response.send(result);
      }
    );
    // const  count = request.query.count || 5;
    // const  page = request.query.page || 1;
    //   const productos = await this.producto.find().populate('imagenes'); //.populate('author', '-password') populate con imagen
  };

  private getAllProductosDestacados = async (
    request: Request,
    response: Response
  ) => {
    const productos = await this.producto
      .find({ esDestacado: true })
      .populate('imagenes'); //.populate('author', '-password') populate con imagen

    response.send(productos);
  };

  private getProductoById = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const id = request.params.id;
    try {
      const producto = await this.producto.findById(id).populate('imagenes');
      if (producto) {
        response.send(producto);
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private modifyProducto = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const id = request.params.id;
    const productoData: Producto = request.body;
    try {
      const producto = await this.producto.findByIdAndUpdate(id, productoData, {
        new: true,
      });

      if (producto) {
        response.send(producto);
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };

  private createProducto = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    // Agregar datos
    const productoData: CreateProductoDto = request.body;
    const createdProducto = new this.producto({
      ...productoData,
      // author: request.user ? request.user._id : null,
    });
    const savedProducto = await createdProducto.save();
    // await savedProducto.populate('author', '-password').execPopulate();
    response.send(savedProducto);
  };
  private createProductoComplete = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    // Agregar foto
    console.log('datos archio', request.file.filename);
    console.log('datos body', request.body);
    // Agregar datos
    const productoData: CreateProductoDto = request.body;
    const createdProducto = new this.producto({
      ...productoData,
      // author: request.user ? request.user._id : null,
    });
    const savedProducto = await createdProducto.save();
    //     const imagen: ImagenDto = {
    //       descripcion:''
    // posicion:.posicion,
    // src:''
    //     }
    // await savedProducto.populate('author', '-password').execPopulate();
    response.send(savedProducto);
  };
  private deleteProducto = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    console.log('deleteProducto');
    const id = request.params.id;
    try {
      const successResponse = await this.producto.findByIdAndDelete(id);
      if (successResponse) {
        response.send({
          status: 200,
          success: true,
          message: 'Operación Exitosa',
        });
      } else {
        next(new NotFoundException(id));
      }
    } catch (e) {
      console.log('[ERROR]', e);
      next(new HttpException(400, 'Parametros Incorrectos'));
    }
  };
}

export default ProductoController;
