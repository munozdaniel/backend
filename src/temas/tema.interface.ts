import * as mongoose from "mongoose";
import IPlanillaTaller from "planillaTaller/planillaTaller.interface";
interface ITema extends mongoose.Document {
  _id: string;
  temaNro: number;
  id_planilla_temas: number; // solo para migrar
  planillaTaller: IPlanillaTaller;
  fecha: Date;
  temaDelDia: string;
  tipoDesarrollo: string;
  temasProximaClase: string;
  nroClase: number;
  unidad: number;
  caracterClase: string;
  observacionJefe: string;

  fechaCreacion?: Date;
  fechaModificacion?: Date;
  activo: boolean;
}

export default ITema;
