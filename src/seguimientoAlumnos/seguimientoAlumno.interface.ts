import * as mongoose from 'mongoose';
interface ISeguimientoAlumno extends mongoose.Document {
  seguimientoAlumnoNro: number;
  alumnoId: string;
  planillaTallerId: string;
  fecha: string;
  tipoSeguimiento: string;
  cicloLectivo: number;
  resuelto: boolean;
  observacion: string;
  observacion2: string;
  observacionJefe: string;

  fechaCreacion: Date;
  fechaModificacion?: Date;
  activo: boolean;
}

export default ISeguimientoAlumno;
