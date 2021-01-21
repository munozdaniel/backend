import IAdulto from '../adulto/adulto.interface';
import * as mongoose from 'mongoose';
interface IComision extends mongoose.Document {
  _id: string;
  comisionNro:number;
  comision:string;
  alumnoId?: string;
  cicloLectivo: number;
  curso:number;
  division:number;
  condicion:string;

  fechaCreacion: Date;
  fechaModificacion?: Date;
  activo: boolean;
}

export default IComision;
