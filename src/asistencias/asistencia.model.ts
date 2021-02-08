import * as mongoose from "mongoose";
import IAsistencia from "./asistencia.interface";
import mongoosePaginate from "mongoose-paginate-v2";
// import AutoincrementFieldService from '../services/AutoincrementFieldService';
// import AutoincrementService from "../services/AutoincrementService";
const Schema = mongoose.Schema;

export const asistenciaSchema = new mongoose.Schema({
  asistenciaNro: { type: Number },
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
  id_planilla_de_asistencia: { type: Number }, // para migrar
  presente: { type: Boolean, required: true },
  llegoTarde: { type: Boolean, required: true },
  fecha: { type: Date, required: true },

  fechaCreacion: { type: Date, default: Date.now },
  fechaModificacion: { type: Date },
  activo: { type: Boolean, default: true },
});

// Modelo
asistenciaSchema.plugin(mongoosePaginate);
// <IAsistencia>
const asistenciaModel = mongoose.model("Asistencia", asistenciaSchema);
// asistenciaModel.paginate();
// Hooks
// asistenciaSchema.plugin(AutoincrementService.getAutoIncrement(), {
//   inc_field: "asistenciaNro",
//   start_seq: 100,
// });
// asistenciaSchema.plugin(AutoincrementFieldService.getAutoIncrement().plugin, { model: 'Asistencia', field: 'asistenciaNro' });

// asistenciaSchema.pre('save', function (this: IAsistencia, next: any) {
//   const now = new Date();
//   if (!this.fechaCreacion) {
//     this.fechaCreacion = now;
//   }
//   next();
// });
asistenciaSchema.pre("update", function (this: IAsistencia, next: any) {
  const now = new Date();
  this.fechaModificacion = now;
  next();
});
export default asistenciaModel;
