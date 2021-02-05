import * as mongoose from "mongoose";
import IProfesor from "./profesor.interface";
import mongoosePaginate from "mongoose-paginate-v2";
// import AutoincrementFieldService from '../services/AutoincrementFieldService';
import AutoincrementService from "../services/AutoincrementService";

export const profesorSchema = new mongoose.Schema({
  // _id: {type:String, required:true},
  profesorNro: { type: Number },
  id_profesores: { type: Number, required: false }, // id se usa solo para migrar
  nombreCompleto: { type: String },
  telefono: { type: String },
  celular: { type: String },
  email: { type: String },
  formacion: { type: String },
  titulo: { type: String },

  fechaCreacion: { type: Date, default: Date.now },
  fechaModificacion: { type: Date },
  activo: { type: Boolean, default: true },
});

// Modelo
profesorSchema.plugin(mongoosePaginate);
// <IProfesor>
const profesorModel = mongoose.model("Profesore", profesorSchema);
// Hooks
profesorSchema.plugin(AutoincrementService.getAutoIncrement(), {
  inc_field: "profesorNro",
  start_seq: 100,
});
// profesorSchema.plugin(AutoincrementFieldService.getAutoIncrement().plugin, { model: 'Profesor', field: 'profesorNro' });

// profesorSchema.pre('save', function (this: IProfesor, next: any) {
//   const now = new Date();
//   if (!this.fechaCreacion) {
//     this.fechaCreacion = now;
//   }
//   next();
// });
profesorSchema.pre("update", function (this: IProfesor, next: any) {
  const now = new Date();
  this.fechaModificacion = now;
  next();
});
export default profesorModel;