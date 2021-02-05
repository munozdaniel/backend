import * as mongoose from "mongoose";
import ITema from "./tema.interface";
import mongoosePaginate from "mongoose-paginate-v2";
// import AutoincrementFieldService from '../services/AutoincrementFieldService';
import AutoincrementService from "../services/AutoincrementService";
const Schema = mongoose.Schema;

export const temaSchema = new mongoose.Schema({
  planillaTaller: {
    type: Schema.Types.ObjectId,
    ref: "PlanillaTallere",
    required: true,
  },
  fecha: { type: Date },
  temaDelDia: { type: String },
  tipoDesarrollo: { type: String },
  temasProximaClase: { type: String },
  nroClase: { type: Number },
  unidad: { type: Number },
  caracterClase: { type: String },
  observacionJefe: { type: String },

  fechaCreacion: { type: Date, default: Date.now },
  fechaModificacion: { type: Date },
  activo: { type: Boolean, default: true },
});

// Modelo
temaSchema.plugin(mongoosePaginate);
// <ITema>
const temaModel = mongoose.model("Tema", temaSchema);
// temaModel.paginate();
// Hooks
temaSchema.plugin(AutoincrementService.getAutoIncrement(), {
  inc_field: "temaNro",
  start_seq: 100,
});
// temaSchema.plugin(AutoincrementFieldService.getAutoIncrement().plugin, { model: 'Tema', field: 'temaNro' });

// temaSchema.pre('save', function (this: ITema, next: any) {
//   const now = new Date();
//   if (!this.fechaCreacion) {
//     this.fechaCreacion = now;
//   }
//   next();
// });
temaSchema.pre("update", function (this: ITema, next: any) {
  const now = new Date();
  this.fechaModificacion = now;
  next();
});
export default temaModel;
