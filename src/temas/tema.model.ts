import mongoose from 'mongoose';

import ITema from './tema.interface';
import mongoosePaginate from 'mongoose-paginate-v2';
const Schema = mongoose.Schema;
import { autoIncrement } from 'mongoose-plugin-autoinc';
import moment from 'moment';

export const temaSchema = new mongoose.Schema({
  temaNro: { type: Number, unique: true, required: false },
  planillaTaller: {
    type: Schema.Types.ObjectId,
    ref: 'PlanillaTallere',
    required: true,
  },
  fecha: { type: Date, required: false }, // requerido pero en migraion no
  temaDelDia: { type: String, required: false }, // requerido pero en migraion no
  tipoDesarrollo: { type: String, required: false }, // requerido pero en migraion no
  temasProximaClase: { type: String, false: false }, // requerido pero en migraion no
  nroClase: { type: Number, required: true }, // requerido pero en migraion no
  unidad: { type: Number, required: false }, // requerido pero en migraion no
  caracterClase: { type: String, required: false }, // requerido pero en migraion no
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

temaSchema.pre<any>('update', function (this: ITema, next: any) {
  const now = new Date();
  const hoy = new Date(moment(now).format('YYYY-MM-DD'));
  this.fechaModificacion = hoy;
  next();
});
export default temaModel;
