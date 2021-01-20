import * as mongoose from 'mongoose';
import IAlumno from './alumno.interface';
import mongoosePaginate from 'mongoose-paginate';
import { adultoSchema } from '../adulto/adulto.model';
import AutoincrementService from '../services/AutoincrementService';
const Schema = mongoose.Schema;

export const alumnoSchema = new mongoose.Schema({
  alumnoNro: { type: Number, default: 100, required: true },
  adultos: [adultoSchema],
  comisiones:[
    {
      type: Schema.Types.ObjectId,
      ref: 'Comisione',
    },
  ],
  id_alumno: { type: String, required: false }, // Para migrar sin required
  dni: { type: String, required: true }, // Para migrar sin required
  tipoDni: { type: String, default: 'DNI', uppercase: true },
  nombreCompleto: { type: String, required: true },
  fechaNacimiento: { type: String, required: true }, // Para migrar sin required
  sexo: { type: String, default: 'MASCULINO', uppercase: true },
  nacionalidad: { type: String, required: true },
  telefono: { type: String },
  celular: { type: String },
  email: { type: String, required: true },
  fechaIngreso: { type: String, required: true },
  procedenciaColegioPrimario: { type: String, required: true }, // Para migrar sin required
  procedenciaColegioSecundario: { type: String },
  fechaDeBaja: { type: String },
  motivoDeBaja: { type: String },
  domicilio: { type: String, required: true },

  cantidadIntegranteGrupoFamiliar: { type: Number, required: true },
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
alumnoSchema.plugin(AutoincrementService.getAutoIncrement(), {
  inc_field: 'alumnoNro',
  start_seq: 100,
});

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
