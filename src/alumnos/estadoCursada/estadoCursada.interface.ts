import * as mongoose from 'mongoose';
import ICurso from 'cursos/curso.interface';
interface IEstadoCursada extends mongoose.Document {
  // _id: string;
  estadoCursadaNro?: number;
  curso: ICurso;
  condicion: string;

  fechaCreacion: Date;
  fechaModificacion?: Date;
  activo: boolean;
}

export default IEstadoCursada;
