import mongoose from 'mongoose';

import IAlumno from './alumno.interface';
import { adultoSchema } from '../adulto/adulto.model';
import { autoIncrement } from 'mongoose-plugin-autoinc';
import moment from 'moment';
const Schema = mongoose.Schema;
import mongoosePaginate from 'mongoose-paginate-v2';

export const alumnoSchema = new mongoose.Schema({
  alumnoNro: { type: Number, unique: true, required: false },
  adultos: [adultoSchema],
  // estadoComisiones: [estadoComisionSchema],
  // comisiones:[comisionSchema],
  estadoCursadas: [
    {
      type: Schema.Types.ObjectId,
      ref: 'EstadoCursada',
      required: false,
    },
  ],
  legajo: { type: String, required: false, unique: false },
  alumnoId: { type: Number, required: false },
  dni: { type: String, required: false, unique: false }, // Para migrar sin required
  tipoDni: { type: String, default: 'DNI', uppercase: true, require: true },
  nombreCompleto: { type: String, required: true },
  fechaNacimiento: { type: String, required: false }, // Para migrar sin required
  sexo: { type: String, default: 'MASCULINO', uppercase: true },
  nacionalidad: { type: String, required: false },
  telefono: { type: String },
  celular: { type: String },
  email: { type: String, required: false },
  fechaIngreso: { type: String, required: false },
  procedenciaColegioPrimario: { type: String, required: false },
  procedenciaColegioSecundario: { type: String },
  fechaDeBaja: { type: String },
  motivoDeBaja: { type: String },
  domicilio: { type: String, required: true },

  cantidadIntegranteGrupoFamiliar: { type: Number, required: false },
  seguimientoEtap: { type: String },

  nombreCompletoTae: { type: String },
  emailTae: { type: String },
  diagnostico: { type: String, require: false },
  archivoDiagnostico: { type: [String], require: false },
  observaciones: { type: String },
  observacionTelefono: { type: String },

  fechaCreacion: { type: Date },
  fechaModificacion: { type: Date },
  activo: { type: Boolean, default: true },
  incompleto: { type: Boolean, default: false },
});

// Modelo
alumnoSchema.plugin(mongoosePaginate);
alumnoSchema.plugin(autoIncrement, {
  model: 'Alumno',
  field: 'alumnoNro',
});
const alumnoModel = mongoose.model('Alumno', alumnoSchema);
//  alumnoModel.paginate();

alumnoSchema.pre<any>('update', function (this: IAlumno, next: any) {
  const now = new Date();
  const hoy = new Date(moment(now).format('YYYY-MM-DD'));
  this.fechaModificacion = hoy;
  next();
});
export default alumnoModel;
