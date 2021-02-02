import * as mongoose from "mongoose";
interface ITemaOriginal extends mongoose.Document {
  _id: string;
  id_planilla_temas: number;
  id_planilla_taller: number;
  Id_temas_por_unidad: number; // no se usa
  Fecha: Date;
  Temas_del_dia: string;
  Tipo_de_desarrollo: string;
  Temas_Proxima_Clase: string;
  NroClase: number;
  Unidad: number;
  CaracterClase: string;
  ObservacionJefe: number;
}

export default ITemaOriginal;