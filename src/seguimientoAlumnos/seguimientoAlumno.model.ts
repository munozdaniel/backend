import * as mongoose from 'mongoose';
import ISeguimientoAlumno from './seguimientoAlumno.interface';
import mongoosePaginate from 'mongoose-paginate-v2';
import { autoIncrement } from 'mongoose-plugin-autoinc';

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
// seguimientoAlumnoModel.paginate();
// Hooks
// seguimientoAlumnoSchema.plugin(AutoincrementService.getAutoIncrement(), {
//   inc_field: "seguimientoAlumnoNro",
//   start_seq: 100,
// }),
// seguimientoAlumnoSchema.plugin(AutoincrementFieldService.getAutoIncrement().plugin, { model: 'SeguimientoAlumno', field: 'seguimientoAlumnoNro' }),

// seguimientoAlumnoSchema.pre('save', function (this: ISeguimientoAlumno, next: any) {
//   const now = new Date(),
//   if (!this.fechaCreacion) {
//     this.fechaCreacion = now,
//   }
//   next(),
// }),
seguimientoAlumnoSchema.pre('update', function (this: ISeguimientoAlumno, next: any) {
  const now = new Date();
  this.fechaModificacion = now;
  next();
});
export default seguimientoAlumnoModel;
