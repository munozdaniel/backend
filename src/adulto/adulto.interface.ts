import * as mongoose from 'mongoose';
interface IAdulto extends mongoose.Document {
  _id: string;
  nombreCompleto: string;
  telefono: string;
  celular: string;
  email: string;
  tipoAdulto: 'TUTOR' | 'PADRE' | 'MADRE';
  fechaCreacion: Date;
  fechaModificacion?: Date;
  activo: boolean;
}

export default IAdulto;
