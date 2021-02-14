import * as mongoose from 'mongoose';
interface ICicloLectivo extends mongoose.Document {
  _id: string;
  anio: number;
}

export default ICicloLectivo;
