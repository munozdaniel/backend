import IAdulto from '../adulto/adulto.interface';
import mongoose from 'mongoose';

interface ICurso extends mongoose.Document {
  _id?: string;
  cursoNro?: number;
  curso: number;
  comision: string;
  alumnoId?: string;
  // cicloLectivo: number;
  // cicloLectivo: ICicloLectivo[];
  division: number;
  // condicion:string;

  fechaCreacion?: Date;
  fechaModificacion?: Date;
  activo: boolean;
}

export default ICurso;
