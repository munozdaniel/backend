import * as mongoose from 'mongoose';
import ISeguimientoAlumno from './seguimientoAlumno.interface';
import mongoosePaginate from 'mongoose-paginate-v2';
import { autoIncrement } from 'mongoose-plugin-autoinc';
import moment from 'moment';

const Schema = mongoose.Schema;
export const seguimientoAlumnoSchema = new mongoose.Schema({
  seguimientoAlumnoNro: { type: Number, unique: true, required: false },
  cicloLectivo: {
    type: Schema.Types.ObjectId,
    ref: 'CicloLectivo',
    required: true,
  },
  alumno: {
    type: Schema.Types.ObjectId,
    ref: 'Alumno',
    required: false,
  },
  planillaTaller: {
    type: Schema.Types.ObjectId,
    ref: 'PlanillaTallere',
    required: false,
  },
  fecha: { type: String },
  tipoSeguimiento: { type: String },
  // cicloLectivo: { type: Number },
  resuelto: { type: Boolean },
  observacion: { type: String },
  observacion2: { type: String },
  observacionJefe: { type: String },

  fechaCreacion: { type: Date, default: Date.now },
  fechaModificacion: { type: Date },
  activo: { type: Boolean, default: true },
});

// Modelo
seguimientoAlumnoSchema.plugin(mongoosePaginate);
// <ISeguimientoAlumno>
seguimientoAlumnoSchema.plugin(autoIncrement, {
  model: 'SeguimientoAlumno',
  field: 'seguimientoAlumnoNro',
});
const seguimientoAlumnoModel = mongoose.model('SeguimientoAlumno', seguimientoAlumnoSchema);

seguimientoAlumnoSchema.pre('update', function (this: ISeguimientoAlumno, next: any) {
  const now = new Date();
  const hoy = new Date(moment(now).format('YYYY-MM-DD'));
  this.fechaModificacion = hoy;
  next();
});
export default seguimientoAlumnoModel;
