import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req: Express.Request, file: Express.Multer.File, callback: (error: Error | null, destination: string) => void) => {
    const { ENTORNO } = process.env;
    if (ENTORNO === 'desarrollo') {
      callback(null, path.join(`${__dirname}/../public/imagenes`));
    } else {
      const __dirname = path.resolve(path.dirname(''));
      callback(null, path.join(`${__dirname}/public/imagenes`));
    }
  },

  filename: (req: any, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) => {
    // const match = ['image/png', 'image/jpeg'];

    // if (match.indexOf(file.mimetype) === -1) {
    //   const message = `${file.originalname} is invalid. Only accept png/jpeg.`;
    //   return callback(new Error(message), null);
    // }
    // const filename = `${req.params.id}.${path.extname(
    //   file.originalname
    // )}`;
    // El archivo se va a guardar con el nombre que provenga - fecha .extension...
    const filename = `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
    callback(null, filename);
  },
});
const fileFilter = (req: any, file: { mimetype: string }, cb: (arg0: any, arg1: boolean) => void) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const multerMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    // Setting Image Size Limit to 2MBs
    fileSize: 10000000,
  },
});
export default multerMiddleware;
