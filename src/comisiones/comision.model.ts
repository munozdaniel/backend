import * as mongoose from 'mongoose';
import IAsignatura from './comision.interface';
import mongoosePaginate from 'mongoose-paginate';
// import AutoincrementFieldService from '../services/AutoincrementFieldService';
import AutoincrementService from '../services/AutoincrementService';

export const comisionSchema = new mongoose.Schema({
  // _id: {type:String, required:true},
  comisionNro: { type: Number },
  _id: { type: String },
  comision: { type: String, required: true, uppercase: true },
  alumnoId: { type: String, required: true },
  cicloLectivo: { type: Number, required: true },
  curso: { type: Number, required: true },
  division: { type: Number, required: true },
  condicion: { type: String, required: true, uppercase: true },

  fechaCreacion: { type: Date, default: Date.now },
  fechaModificacion: { type: Date },
  activo: { type: Boolean, default: true },
});

// Modelo
comisionSchema.plugin(mongoosePaginate);
const comisionModel = mongoose.model<IAsignatura>('Comisione', comisionSchema);
comisionModel.paginate();
// Hooks
comisionSchema.plugin(AutoincrementService.getAutoIncrement(), {
  inc_field: 'comisionNro',
  start_seq: 100,
});
// comisionSchema.plugin(AutoincrementFieldService.getAutoIncrement().plugin, { model: 'Asignatura', field: 'comisionNro' });

// comisionSchema.pre('save', function (this: IAsignatura, next: any) {
//   const now = new Date();
//   if (!this.fechaCreacion) {
//     this.fechaCreacion = now;
//   }
//   next();
// });
comisionSchema.pre('update', function (this: IAsignatura, next: any) {
  const now = new Date();
  this.fechaModificacion = now;
  next();
});
export default comisionModel;
