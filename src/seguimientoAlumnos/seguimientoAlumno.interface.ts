import IAlumno from 'alumnos/alumno.interface';
import ICicloLectivo from 'ciclolectivos/ciclolectivo.interface';
import mongoose from 'mongoose';

import IPlanillaTaller from 'planillaTaller/planillaTaller.interface';
interface ISeguimientoAlumno extends mongoose.Document {
  _id: string;
  id_seguimiento: number; // para migrar
  seguimientoAlumnoNro: number;
  alumno: IAlumno;
  planillaTaller: IPlanillaTaller;
  fecha: Date;
  tipoSeguimiento: string;
  cicloLectivo: ICicloLectivo;
  resuelto: boolean;
  observacion: string;
  observacion2: string;
  observacionJefe: string;

  fechaCreacion: Date;
  fechaModificacion?: Date;
  activo: boolean;
}

export default ISeguimientoAlumno;
