import * as mongoose from 'mongoose';
interface IProfesor extends mongoose.Document {
  _id: string;
  profesorNro: string;
  nombreCompleto: string;
  telefono?: string;
  celular?: string;
  email: string;
  formacion: string;
  titulo: string;

  fechaCreacion: Date;
  fechaModificacion?: Date;
  activo: boolean;

  id_profesores?: number; // solo para migrar
}

export default IProfesor;
