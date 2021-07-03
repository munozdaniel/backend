import mongoose from 'mongoose';

interface IAdulto extends mongoose.Document {
  nombreCompleto: string;
  telefono?: string;
  celular?: string;
  email: string;
  tipoAdulto: 'TUTOR' | 'PADRE' | 'MADRE';
  fechaCreacion: Date;
  fechaModificacion?: Date;
  activo: boolean;
  preferencia?:boolean;
}

export default IAdulto;
