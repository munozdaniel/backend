import * as mongoose from 'mongoose';
import IAlumno from './alumno.interface';
import mongoosePaginate from 'mongoose-paginate';
import { adultoSchema } from '../adulto/adulto.model';

export const alumnoSchema = new mongoose.Schema({
  adultos: [adultoSchema],
  dni: { type: String },
  nombreCompleto: { type: String },
  fechaNacimiento: { type: String },
  sexo: { type: String },
  nacionalidad: { type: String },
  telefono: { type: String },
  celular: { type: String },
  email: { type: String },
  fechaIngreso: { type: String },
  procedenciaColegioPrimario: { type: String },
  procedenciaColegioSecundario: { type: String },
  fechaDeBaja: { type: String },
  motivoDeBaja: { type: String },
  domicilio: { type: String },

  cantidadIntegranteGrupoFamiliar: { type: Number },
  seguimientoEtap: { type: String },

  nombreCompletoTae: { type: String },
  emailTae: { type: String },
  archivoDiagnostico: { type: String },
  observaciones: { type: String },
  observacionTelefono: { type: String },

  fechaCreacion: { type: Date, default: Date.now },
  fechaModificacion: { type: Date },
  activo: { type: Boolean, default: true },
});

// Modelo
alumnoSchema.plugin(mongoosePaginate);
const alumnoModel = mongoose.model<IAlumno>('Alumno', alumnoSchema);
alumnoModel.paginate();
// Hooks
// alumnoSchema.pre('save', function (this: IAlumno, next: any) {
//   const now = new Date();
//   if (!this.fechaCreacion) {
//     this.fechaCreacion = now;
//   }
//   next();
// });
alumnoSchema.pre('update', function (this: IAlumno, next: any) {
  const now = new Date();
  this.fechaModificacion = now;
  next();
});
export default alumnoModel;
