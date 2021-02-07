import * as mongoose from "mongoose";
import IAsignatura from "./asignatura.interface";
import mongoosePaginate from "mongoose-paginate-v2";
// import AutoincrementFieldService from '../services/AutoincrementFieldService';
import AutoincrementService from "../services/AutoincrementService";

export const asignaturaSchema = new mongoose.Schema({
  // _id: {type:String, required:true},
  asignaturaNro: { type: Number },
  IdAsignarutas: { type: Number, required: false }, // id se usa solo para migrar
  detalle: { type: String, required: true },
  tipoAsignatura: { type: String, required: true },
  tipoCiclo: { type: String, required: true },
  tipoFormacion: { type: String, required: true },
  curso: { type: Number, required: true },
  meses: { type: Number, required: true },
  horasCatedraAnuales: { type: Number, required: true },
  horasCatedraSemanales: { type: Number, required: true },

  fechaCreacion: { type: Date, default: Date.now },
  fechaModificacion: { type: Date },
  activo: { type: Boolean, default: true },
});

// Modelo
asignaturaSchema.plugin(mongoosePaginate);
// <IAsignatura>
const asignaturaModel = mongoose.model("Asignatura", asignaturaSchema);
// asignaturaModel.paginate();
// Hooks
asignaturaSchema.plugin(AutoincrementService.getAutoIncrement(), {
  inc_field: "asignaturaNro",
  start_seq: 100,
});
// asignaturaSchema.plugin(AutoincrementFieldService.getAutoIncrement().plugin, { model: 'Asignatura', field: 'asignaturaNro' });

// asignaturaSchema.pre('save', function (this: IAsignatura, next: any) {
//   const now = new Date();
//   if (!this.fechaCreacion) {
//     this.fechaCreacion = now;
//   }
//   next();
// });
asignaturaSchema.pre("update", function (this: IAsignatura, next: any) {
  const now = new Date();
  this.fechaModificacion = now;
  next();
});
export default asignaturaModel;
