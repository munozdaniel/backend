import * as mongoose from 'mongoose';
import IComisionOriginal from './comisionOriginal.interface';

export const comisionesOriginalSchema = new mongoose.Schema({
  // _id: { type: Number},
  id_comisiones: { type: Number },
  comision: { type: String },
  id_alumnos: { type: Number },
  ciclo_lectivo: { type: Number },
  Tcurso: { type: Number },
  Division: { type: Number },
  Condicion: { type: String },
});

// Modelo
const comisionesOriginalModel = mongoose.model<IComisionOriginal>(
  'Alumnos_por_comisione',
  comisionesOriginalSchema
);

export default comisionesOriginalModel;
