import multer from 'multer';
import path from 'path';
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, path.join(`${__dirname}/../public/imagenes`));
    },
    filename: (req, file, callback) => {
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
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg') {
        cb(null, true);
    }
    else {
        cb(null, false);
    }
};
const multerMiddleware = multer({
    storage,
    fileFilter,
    limits: {
        // Setting Image Size Limit to 2MBs
        fileSize: 2000000,
    },
});
export default multerMiddleware;
//# sourceMappingURL=upload.middleware.js.map