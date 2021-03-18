import * as mongoose from 'mongoose';
export interface IUsuario extends mongoose.Document {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rol: 'PROFESOR' | 'ADMIN' | 'DIRECTOR' | 'JEFETALLER' | 'PRECEPTOR';

  observacion?: string; // Agregado por el dueño del comercio

  fechaCreacion: Date;
  usuarioCreacion: string | null;
  activo: boolean;
}
