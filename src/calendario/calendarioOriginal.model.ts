import mongoose from 'mongoose';

import ICalendarioOriginal from './calendarioOriginal.interface';

export const calendarioOriginalSchema = new mongoose.Schema({
  _id: { type: Number },
  id_calendario: { type: Number },
  fechas: { type: String },
  ciclo_lectivo: { type: Number },
  A: { type: Number },
  B: { type: Number },
  C: { type: Number },
  D: { type: Number },
  E: { type: Number },
  F: { type: Number },
  G: { type: Number },
  H: { type: Number },
});

// Modelo
const calendarioOriginalModel = mongoose.model<ICalendarioOriginal>('calendario_por_ciclo_lectivo', calendarioOriginalSchema);

export default calendarioOriginalModel;
