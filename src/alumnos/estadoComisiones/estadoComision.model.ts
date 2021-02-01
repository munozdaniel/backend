import * as mongoose from 'mongoose';
import IEstadoComision from './estadoComision.interface';
import mongoosePaginate from 'mongoose-paginate';
import AutoincrementService from '../../services/AutoincrementService';
const Schema = mongoose.Schema;

export const estadoComisionSchema = new mongoose.Schema({
  estadoComisionNro: { type: Number, default: 100, required: true },
  comision: {
    type: Schema.Types.ObjectId,
    ref: 'Comision',
    required: true,
  },
  condicion: {
    type: String,
    required: true,
    uppercase: true,
    default: 'SIN REGISTRAR',
  },
  fechaCreacion: { type: Date, default: Date.now },
  fechaModificacion: { type: Date },
  activo: { type: Boolean, default: true },
});

// Modelo
estadoComisionSchema.plugin(mongoosePaginate);
const estadoComisionModel = mongoose.model<IEstadoComision>(
  'EstadoComisione',
  estadoComisionSchema
);
estadoComisionModel.paginate();
// Hooks
estadoComisionSchema.plugin(AutoincrementService.getAutoIncrement(), {
  inc_field: 'estadoComisionNro',
  start_seq: 100,
});

// estadoComisionSchema.pre('save', function (this: IEstadoComision, next: any) {
//   const now = new Date();
//   if (!this.fechaCreacion) {
//     this.fechaCreacion = now;
//   }
//   next();
// });
estadoComisionSchema.pre('update', function (this: IEstadoComision, next: any) {
  const now = new Date();
  this.fechaModificacion = now;
  next();
});
export default estadoComisionModel;
