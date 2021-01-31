import IAdulto from '../adulto/adulto.interface';
import * as mongoose from 'mongoose';
interface IAsignatura extends mongoose.Document {
  _id: string;
  numero: number;
  detalle: string;
  tipoAsignatura: string;
  tipoCiclo: string;
  tipoFormacion: string;
  curso: number;
  meses: number;
  horasCatedraAnuales: number;
  horasCatedraSemanales: number;

  fechaCreacion: Date;
  fechaModificacion?: Date;
  activo: boolean;

  IdAsignarutas?: number; // solo para migrar
}

export default IAsignatura;
