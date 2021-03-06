import IAdulto from '../adulto/adulto.interface';
import mongoose from 'mongoose';

interface IAsignatura extends mongoose.Document {
  _id: string;
  asignaturaNro: number;
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
