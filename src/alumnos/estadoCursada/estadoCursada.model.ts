import * as mongoose from "mongoose";
import IEstadoCursada from "./estadoCursada.interface";
import mongoosePaginate from "mongoose-paginate-v2";
// import AutoincrementService from "../../services/AutoincrementService";
const Schema = mongoose.Schema;

export const estadoCursadaSchema = new mongoose.Schema({
  estadoCursadaNro: { type: Number, default: 100, required: true },
  curso: {
    type: Schema.Types.ObjectId,
    ref: "Curso",
    required: true,
  },
  condicion: {
    type: String,
    required: true,
    uppercase: true,
    default: "SIN REGISTRAR",
  },
  fechaCreacion: { type: Date, default: Date.now },
  fechaModificacion: { type: Date },
  activo: { type: Boolean, default: true },
});

// Modelo
estadoCursadaSchema.plugin(mongoosePaginate);
// <IEstadoCursada>
const estadoCursadaModel = mongoose.model(
  "EstadoCursada",
  estadoCursadaSchema
);
// estadoCursadaModel.paginate();
// Hooks
// estadoCursadaSchema.plugin(AutoincrementService.getAutoIncrement(), {
//   inc_field: "estadoCursadaNro",
//   start_seq: 100,
// });

// estadoCursadaSchema.pre('save', function (this: IEstadoCursada, next: any) {
//   const now = new Date();
//   if (!this.fechaCreacion) {
//     this.fechaCreacion = now;
//   }
//   next();
// });
estadoCursadaSchema.pre("update", function (this: IEstadoCursada, next: any) {
  const now = new Date();
  this.fechaModificacion = now;
  next();
});
export default estadoCursadaModel;
