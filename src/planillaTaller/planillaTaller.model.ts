import * as mongoose from 'mongoose';
import IPlanillaTaller from './planillaTaller.interface';
import mongoosePaginate from 'mongoose-paginate';
// import AutoincrementFieldService from '../services/AutoincrementFieldService';
import AutoincrementService from '../services/AutoincrementService';
const Schema = mongoose.Schema;

export const planillaTallerSchema = new mongoose.Schema({
  asignaturaId: {
    type: Schema.Types.ObjectId,
    ref: 'Asignatura',
    required: false,
  },
  profesorId: {
    type: Schema.Types.ObjectId,
    ref: 'Asignatura',
    required: false,
  },
  planillaTallerId: { type: Number, required: false },
  curso: { type: Number, required: true },
  division: { type: Number, required: true },
  comision: { type: String, required: true }, // req false solo para migrar
  cicloLectivo: { type: Number, required: true },
  fechaInicio: { type: String, required: true }, // req false solo para migrar
  fechaFinalizacion: { type: String, required: true }, // req false solo para migrar
  observacion: { type: String },
  bimestre: { type: String, required: true },

  fechaCreacion: { type: Date, default: Date.now },
  fechaModificacion: { type: Date },
  activo: { type: Boolean, default: true },
});

// Modelo
planillaTallerSchema.plugin(mongoosePaginate);
const planillaTallerModel = mongoose.model<IPlanillaTaller>(
  'PlanillaTaller',
  planillaTallerSchema
);
planillaTallerModel.paginate();
// Hooks
planillaTallerSchema.plugin(AutoincrementService.getAutoIncrement(), {
  inc_field: 'planillaTallerNro',
  start_seq: 100,
});
// planillaTallerSchema.plugin(AutoincrementFieldService.getAutoIncrement().plugin, { model: 'PlanillaTaller', field: 'planillaTallerNro' });

// planillaTallerSchema.pre('save', function (this: IPlanillaTaller, next: any) {
//   const now = new Date();
//   if (!this.fechaCreacion) {
//     this.fechaCreacion = now;
//   }
//   next();
// });
planillaTallerSchema.pre('update', function (this: IPlanillaTaller, next: any) {
  const now = new Date();
  this.fechaModificacion = now;
  next();
});
export default planillaTallerModel;
