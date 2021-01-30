import * as mongoose from 'mongoose';
interface ISeguimientoAlumno extends mongoose.Document {
  idAlumno: number | string;
  idPlanillaDeTaller: number | string;
  fecha: string;
  tipoSeguimiento: string;
  observacion: string;
  cicloLectivo: number;
  resuelto: string;
  observacion2: string;
  observacionJefe: string;

  fechaCreacion: Date;
  fechaModificacion?: Date;
  activo: boolean;
}

export default ISeguimientoAlumno;
