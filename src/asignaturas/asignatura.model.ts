import * as mongoose from 'mongoose';
import IAsignatura from './asignatura.interface';
import mongoosePaginate from 'mongoose-paginate-v2';
import { autoIncrement } from 'mongoose-plugin-autoinc';

export const asignaturaSchema = new mongoose.Schema({
  // _id: {type:String, required:true},
  asignaturaNro: { type: Number, unique: true, required: false },
  IdAsignarutas: { type: Number, required: false }, // id se usa solo para migrar
  detalle: { type: String, required: true },
  tipoAsignatura: { type: String, required: true },
  tipoCiclo: { type: String, required: true },
  tipoFormacion: { type: String, required: true },
  curso: { type: Number, required: true },
  meses: { type: Number, required: true },
  horasCatedraAnuales: { type: Number, required: true },
  horasCatedraSemanales: { type: Number, required: true },

  fechaCreacion: { type: Date, default: Date.now },
  fechaModificacion: { type: Date },
  activo: { type: Boolean, default: true },
});

// Modelo
asignaturaSchema.plugin(mongoosePaginate);
// <IAsignatura>
asignaturaSchema.plugin(autoIncrement, {
  model: 'Asignatura',
  field: 'asignaturaNro',
});
const asignaturaModel = mongoose.model('Asignatura', asignaturaSchema);

asignaturaSchema.pre('update', function (this: IAsignatura, next: any) {
  const now = new Date();
  this.fechaModificacion = now;
  next();
});
export default asignaturaModel;
