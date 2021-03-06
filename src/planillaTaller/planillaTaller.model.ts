import * as mongoose from 'mongoose';
import IPlanillaTaller from './planillaTaller.interface';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { autoIncrement } from 'mongoose-plugin-autoinc';

const Schema = mongoose.Schema;

export const planillaTallerSchema = new mongoose.Schema({
  planillaTallerNro: { type: Number, unique: true, required: false },
  cicloLectivo: {
    type: Schema.Types.ObjectId,
    ref: 'CicloLectivo',
    required: true,
  },
  asignatura: {
    type: Schema.Types.ObjectId,
    ref: 'Asignatura',
    required: false,
  },
  profesor: {
    type: Schema.Types.ObjectId,
    ref: 'Profesore',
    required: false,
  },
  curso: {
    type: Schema.Types.ObjectId,
    ref: 'Curso',
    required: true,
  },
  planillaTallerId: { type: Number, required: false }, // solo par a migrar
  // curso: { type: Number, required: true },
  // division: { type: Number, required: true },
  // comision: { type: String, required: true }, // req false solo para migrar
  // cicloLectivo: { type: Number, required: true },
  fechaInicio: { type: Date, required: false }, // req false solo para migrar
  fechaFinalizacion: { type: Date, required: false }, // req false solo para migrar
  observacion: { type: String },
  bimestre: { type: String, required: true },

  fechaCreacion: { type: Date, default: Date.now },
  fechaModificacion: { type: Date },
  activo: { type: Boolean, default: true },
});

// Modelo
// planillaTallerSchema.plugin(mongoosePaginate);
planillaTallerSchema.plugin(aggregatePaginate);
// <IPlanillaTaller>
planillaTallerSchema.plugin(autoIncrement, {
  model: 'PlanillaTallere',
  field: 'planillaTallerNro',
});
const planillaTallerModel = mongoose.model('PlanillaTallere', planillaTallerSchema);

planillaTallerSchema.pre('update', function (this: IPlanillaTaller, next: any) {
  const now = new Date();
  this.fechaModificacion = now;
  next();
});
export default planillaTallerModel;
