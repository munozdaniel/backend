import * as mongoose from 'mongoose';
import IComisionOriginal from './comisionOriginal.interface';

export const comisionesOriginalSchema = new mongoose.Schema({
  _id: { type: String },
  nombre_y_apellido: { type: String },
  telefono: { type: String },
  mail: { type: String },
  formacion: { type: String },
  tipo_de_titulacion: { type: String },
});

// Modelo
const comisionesOriginalModel = mongoose.model<IComisionOriginal>(
  'Alumnos_por_comisione',
  comisionesOriginalSchema
);

export default comisionesOriginalModel;
