 import * as mongoose from 'mongoose';
interface ISeguimientoAlumnoOriginal extends mongoose.Document {
  _id: number;
  id_seguimiento: number;
  id_alumno: number;
  fecha: string;
  tipo_seguimiento: string;
  observacion: string;
  ciclo_lectivo: number;
  IdPlanillaDeTaller: number;
  Resuelto: string;
  Observacion2: string;
  ObservacionJefe: string;

}

export default ISeguimientoAlumnoOriginal;
