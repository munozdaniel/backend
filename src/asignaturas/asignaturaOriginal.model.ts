import * as mongoose from 'mongoose';
import IAsignaturaOriginal from './asignaturaOriginal.interface';
import mongoosePaginate from 'mongoose-paginate';

export const asignaturaOriginalSchema = new mongoose.Schema({
  _id: { type: String },
  idAsignarutas: { type: Number },
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
const asignaturaOriginalModel = mongoose.model<IAsignaturaOriginal>(
  'AsignaturaOriginal',
  asignaturaOriginalSchema
);

export default asignaturaOriginalModel;