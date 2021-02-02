import * as mongoose from "mongoose";
interface ICalificacionOriginal extends mongoose.Document {
  _id: number;
  id_calificaciones: number;
  id_planilla_de_taller: number;
  id_profesor: number;
  forma_del_examen: string;
  tipo_de_examen: string;
  promedia: string;
  PromedioGeneral: number;
  Id_alumno: number;
  Observaciones: string;
}

export default ICalificacionOriginal;
