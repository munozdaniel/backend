import mongoose from 'mongoose';

import { autoIncrement } from 'mongoose-plugin-autoinc';
import ICalendario from './calendario.interface';

const Schema = mongoose.Schema;

export const calendarioSchema = new mongoose.Schema({
  calendarioNro: { type: Number, unique: true, required: false },
  id_calendario: { type: Number, required: false }, // para migrar
  fecha: { type: Date },
  cicloLectivo: {
    type: Schema.Types.ObjectId,
    ref: 'EstadoCursada',
    required: false,
  },
  comisionA: { type: Number, required: true },
  comisionB: { type: Number, required: true },
  comisionC: { type: Number, required: true },
  comisionD: { type: Number, required: true },
  comisionE: { type: Number, required: true },
  comisionF: { type: Number, required: true },
  comisionG: { type: Number, required: true },
  comisionH: { type: Number, required: true },

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

calendarioSchema.pre<any>('update', function (this: ICalendario, next: any) {
  const now = new Date();
  next();
});
export default calendarioModel;
