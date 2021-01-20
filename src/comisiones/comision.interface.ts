import IAdulto from '../adulto/adulto.interface';
import * as mongoose from 'mongoose';
interface IComision extends mongoose.Document {
  _id: string;
  comision:string;
  alumnoId?: string;
  cicloLectivo?: string;
  curso:string;
  division:string;
  condicion:string;

  fechaCreacion: Date;
  fechaModificacion?: Date;
  activo: boolean;
}

export default IComision;
