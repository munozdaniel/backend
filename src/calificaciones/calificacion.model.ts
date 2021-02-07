import * as mongoose from "mongoose";
import ICalificacion from "./calificacion.interface";
import mongoosePaginate from "mongoose-paginate-v2";
// import AutoincrementFieldService from '../services/AutoincrementFieldService';
import AutoincrementService from "../services/AutoincrementService";
const Schema = mongoose.Schema;

export const calificacionSchema = new mongoose.Schema({
  calificacionNro: Number,
  planillaTaller: {
    type: Schema.Types.ObjectId,
    ref: "PlanillaTallere",
    required: true,
  },
  alumno: {
    type: Schema.Types.ObjectId,
    ref: "Alumno",
    required: true,
  },
  profesor: {
    type: Schema.Types.ObjectId,
    ref: "Profesore",
    required: true,
  },
  id_calificaciones: { type: Number, required: true }, // para migrar
  formaExamen: { type: String, required: false },
  tipoExamen: { type: String, required: false },
  promedia: { type: Boolean, required: true },
  promedioGeneral: { type: Number, required: true },
  observaciones: { type: String, required: false },

  fechaCreacion: { type: Date, default: Date.now },
  fechaModificacion: { type: Date },
  activo: { type: Boolean, default: true },
});

// Modelo
calificacionSchema.plugin(mongoosePaginate);
// <ICalificacion>
const calificacionModel = mongoose.model("Calificacione", calificacionSchema);
// calificacionModel.paginate();
// Hooks
calificacionSchema.plugin(AutoincrementService.getAutoIncrement(), {
  inc_field: "calificacionNro",
  start_seq: 100,
});
// calificacionSchema.plugin(AutoincrementFieldService.getAutoIncrement().plugin, { model: 'Calificacion', field: 'calificacionNro' });

// calificacionSchema.pre('save', function (this: ICalificacion, next: any) {
//   const now = new Date();
//   if (!this.fechaCreacion) {
//     this.fechaCreacion = now;
//   }
//   next();
// });
calificacionSchema.pre("update", function (this: ICalificacion, next: any) {
  const now = new Date();
  this.fechaModificacion = now;
  next();
});
export default calificacionModel;
