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
  curso: { type: Number },
  division: { type: Number },
  comision: { type: String },
  cicloLectivo: { type: Number },
  fechaInicio: { type: String },
  observacion: { type: String },
  fechaFinalizacion: { type: String },
  bimestre: { type: String },

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
