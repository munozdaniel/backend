import * as mongoose from 'mongoose';
import ITema from './tema.interface';
import mongoosePaginate from 'mongoose-paginate-v2';
const Schema = mongoose.Schema;
import { autoIncrement } from 'mongoose-plugin-autoinc';

export const temaSchema = new mongoose.Schema({
  temaNro: { type: Number, unique: true, required: false },
  planillaTaller: {
    type: Schema.Types.ObjectId,
    ref: 'PlanillaTallere',
    required: true,
  },
  fecha: { type: Date },
  temaDelDia: { type: String },
  tipoDesarrollo: { type: String },
  temasProximaClase: { type: String },
  nroClase: { type: Number },
  unidad: { type: Number },
  caracterClase: { type: String },
  observacionJefe: { type: String },

  fechaCreacion: { type: Date, default: Date.now },
  fechaModificacion: { type: Date },
  activo: { type: Boolean, default: true },
});

// Modelo
temaSchema.plugin(mongoosePaginate);
// <ITema>
temaSchema.plugin(autoIncrement, {
  model: 'Tema',
  field: 'temaNro',
});
const temaModel = mongoose.model('Tema', temaSchema);
// temaModel.paginate();
// Hooks
// temaSchema.plugin(AutoincrementService.getAutoIncrement(), {
//   inc_field: "temaNro",
//   start_seq: 100,
// });
// temaSchema.plugin(AutoincrementFieldService.getAutoIncrement().plugin, { model: 'Tema', field: 'temaNro' });

// temaSchema.pre('save', function (this: ITema, next: any) {
//   const now = new Date();
//   if (!this.fechaCreacion) {
//     this.fechaCreacion = now;
//   }
//   next();
// });
temaSchema.pre('update', function (this: ITema, next: any) {
  const now = new Date();
  this.fechaModificacion = now;
  next();
});
export default temaModel;
