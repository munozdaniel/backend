import * as mongoose from 'mongoose';
import { autoIncrement } from 'mongoose-plugin-autoinc';
import ICalendario from './calendario.interface';

const Schema = mongoose.Schema;

export const calendarioSchema = new mongoose.Schema({
  calendarioNro: { type: Number, unique: true, required: false },
  id_calendario: { type: Number, required: true }, // para migrar
  fecha: { type: Date },
  cicloLectivo: {
    type: Schema.Types.ObjectId,
    ref: 'EstadoCursada',
    required: false,
  },
  a: { type: Number, required: true },
  b: { type: Number, required: true },
  c: { type: Number, required: true },
  d: { type: Number, required: true },
  e: { type: Number, required: true },
  f: { type: Number, required: true },
  g: { type: Number, required: true },
  h: { type: Number, required: true },

  fechaCreacion: { type: Date, default: Date.now },
  fechaModificacion: { type: Date },
  activo: { type: Boolean, default: true },
});

// Modelo
// <ICalendario>
calendarioSchema.plugin(autoIncrement, {
  model: 'Calendario',
  field: 'calendarioNro',
});
const calendarioModel = mongoose.model('Calendario', calendarioSchema);

calendarioSchema.pre('update', function (this: ICalendario, next: any) {
  const now = new Date();
  next();
});
export default calendarioModel;
