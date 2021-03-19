import mongoose from 'mongoose';

import IAsignaturaOriginal from './asignaturaOriginal.interface';

export const asignaturaOriginalSchema = new mongoose.Schema({
  // _id: { type: String },
  IdAsignarutas: { type: Number },
  DetalleAsignatura: { type: String },
  TipoAsignatura: { type: String },
  TipoCiclo: { type: String },
  Tcurso: { type: Number },
  HorasCatedraAnuales: { type: Number },
  HorasCatedraSemanales: { type: Number },
  Meses: { type: Number },
  Tipodeformacion: { type: String },
});

// Modelo
const asignaturaOriginalModel = mongoose.model<IAsignaturaOriginal>('AsignaturaOriginal', asignaturaOriginalSchema);

export default asignaturaOriginalModel;
