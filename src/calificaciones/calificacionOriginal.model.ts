import * as mongoose from "mongoose";
import IAsistenciaOriginal from "./calificacionOriginal.interface";

export const calificacionesOriginalSchema = new mongoose.Schema({
  // _id: { type: Number },
  id_calificaciones: { type: Number },
  id_planilla_de_taller: { type: Number },
  id_profesor: { type: Number },
  forma_del_examen: { type: String },
  tipo_de_examen: { type: String },
  promedia: { type: String },
  PromedioGeneral: { type: Number },
  Id_alumno: { type: Number },
  Observaciones: { type: String },
});

// Modelo
const calificacionesOriginalModel = mongoose.model<IAsistenciaOriginal>(
  "planilla_de_calificaciones_por_alumno",
  calificacionesOriginalSchema
);

export default calificacionesOriginalModel;
