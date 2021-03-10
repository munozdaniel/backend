import * as mongoose from 'mongoose';
import ICurso from 'cursos/curso.interface';
import ICicloLectivo from 'ciclolectivos/ciclolectivo.interface';
interface IEstadoCursada extends mongoose.Document {
  // _id: string;
  estadoCursadaNro?: number;
  curso: ICurso;
  condicion: string;
  cicloLectivo: ICicloLectivo;
  fechaCreacion: Date;
  fechaModificacion?: Date;
  activo: boolean;
}

export default IEstadoCursada;
