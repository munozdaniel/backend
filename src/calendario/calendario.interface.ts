import ICicloLectivo from 'ciclolectivos/ciclolectivo.interface';
import * as mongoose from 'mongoose';
interface ICalendario extends mongoose.Document {
  _id: number;
  id_calendario: number; // para migrar
  fecha: Date;
  cicloLectivo: ICicloLectivo;
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  g: number;
  h: number;

  fechaCreacion?: Date;
  activo: boolean;
}

export default ICalendario;
