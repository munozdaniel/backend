import * as mongoose from "mongoose";
import IPlanillaTaller from "./planillaTaller.interface";
import mongoosePaginate from "mongoose-paginate";
// import AutoincrementFieldService from '../services/AutoincrementFieldService';
import AutoincrementService from "../services/AutoincrementService";
const Schema = mongoose.Schema;

export const planillaTallerSchema = new mongoose.Schema({
  planillaTallerNro: { type: Number },
  asignaturaId: {
    type: Schema.Types.ObjectId,
    ref: "Asignatura",
    required: false,
  },
  profesorId: {
    type: Schema.Types.ObjectId,
    ref: "Profesore",
    required: false,
  },
  comision: {
    type: Schema.Types.ObjectId,
    ref: "Comisione",
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
planillaTallerSchema.plugin(mongoosePaginate);
const planillaTallerModel = mongoose.model<IPlanillaTaller>(
  "PlanillaTallere",
  planillaTallerSchema
);
planillaTallerModel.paginate();
// Hooks
planillaTallerSchema.plugin(AutoincrementService.getAutoIncrement(), {
  inc_field: "planillaTallerNro",
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
planillaTallerSchema.pre("update", function (this: IPlanillaTaller, next: any) {
  const now = new Date();
  this.fechaModificacion = now;
  next();
});
export default planillaTallerModel;
