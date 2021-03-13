import * as mongoose from 'mongoose';
import ICalificacion from './calificacion.interface';
import mongoosePaginate from 'mongoose-paginate-v2';
import { autoIncrement } from 'mongoose-plugin-autoinc';
import moment from 'moment';

const Schema = mongoose.Schema;

export const calificacionSchema = new mongoose.Schema({
  calificacionNro: { type: Number, unique: true, required: false },
  planillaTaller: {
    type: Schema.Types.ObjectId,
    ref: 'PlanillaTallere',
    required: true,
  },
  alumno: {
    type: Schema.Types.ObjectId,
    ref: 'Alumno',
    required: true,
  },
  profesor: {
    type: Schema.Types.ObjectId,
    ref: 'Profesore',
    required: true,
  },
  id_calificaciones: { type: Number, required: false }, // para migrar
  formaExamen: { type: String, required: false },
  tipoExamen: { type: String, required: false },
  promedia: { type: Boolean, required: true },
  promedioGeneral: { type: Number, required: true },
  observaciones: { type: String, required: false },

  fechaCreacion: { type: Date, default: Date.now },
  fechaModificacion: { type: Date },
  activo: { type: Boolean, default: true },
});

// Modelo
calificacionSchema.plugin(mongoosePaginate);
// <ICalificacion>
calificacionSchema.plugin(autoIncrement, {
  model: 'Calificacione',
  field: 'calificacionNro',
});
const calificacionModel = mongoose.model('Calificacione', calificacionSchema);

calificacionSchema.pre('update', function (this: ICalificacion, next: any) {
  const now = new Date();
  const hoy = new Date(moment(now).format('YYYY-MM-DD'));
  this.fechaModificacion = hoy;
  next();
});
export default calificacionModel;
