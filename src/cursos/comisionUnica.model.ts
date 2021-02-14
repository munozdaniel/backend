import * as mongoose from 'mongoose';
import IComisionUnica from './comisionUnica.interface';

export const comisionesUnicaSchema = new mongoose.Schema({
  // _id: { type: Number},
  id_comisiones: { type: Number },
  comision: { type: String },
  id_alumnos: { type: Number },
  ciclo_lectivo: { type: Number },
  Tcurso: { type: Number },
  Division: { type: Number },
});

// Modelo
const comisionesUnicaModel = mongoose.model<IComisionUnica>(
  'Comisiones_sql',
  comisionesUnicaSchema
);

export default comisionesUnicaModel;
