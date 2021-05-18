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
    ref: 'CicloLectivo',
    required: false,
  },
  comisionA: { type: Number, required: false },
  comisionB: { type: Number, required: false },
  comisionC: { type: Number, required: false },
  comisionD: { type: Number, required: false },
  comisionE: { type: Number, required: false },
  comisionF: { type: Number, required: false },
  comisionG: { type: Number, required: false },
  comisionH: { type: Number, required: false },

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
