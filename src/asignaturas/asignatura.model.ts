import mongoose from 'mongoose';

import IAsignatura from './asignatura.interface';
import mongoosePaginate from 'mongoose-paginate-v2';
import ai from 'mongoose-plugin-autoinc';
const { autoIncrement } = ai;
import moment from 'moment';
const Schema = mongoose.Schema;

export const asignaturaSchema = new mongoose.Schema({
  // _id: {type:String, required:true},
  asignaturaNro: { type: Number, unique: true, required: false },
  IdAsignarutas: { type: Number, required: false }, // id se usa solo para migrar
  detalle: { type: String, required: true },
  tipoAsignatura: { type: String, required: true },
  tipoCiclo: { type: String, required: true }, // 1° BIMESTRE
  tipoFormacion: { type: String, required: true },
  curso: { type: Number, required: true },
  // cursos: [
  //   {
  //     type: Schema.Types.ObjectId,
  //     ref: 'Curso',
  //     required: true,
  //   },
  // ],
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

asignaturaSchema.pre<any>('update', function (this: IAsignatura, next: any) {
  const now = new Date();
  const hoy = new Date(moment(now).format('YYYY-MM-DD'));
  this.fechaModificacion = hoy;
  next();
});
export default asignaturaModel;
