import IComision from '../../comisiones/comision.interface';
import * as mongoose from 'mongoose';
interface IEstadoComision extends mongoose.Document {
  // _id: string;
  estadoComisionNro?: number;
  comision: IComision;
  condicion: string;

  fechaCreacion: Date;
  fechaModificacion?: Date;
  activo: boolean;
}

export default IEstadoComision;
