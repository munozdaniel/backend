import mongoose from 'mongoose';
import IProfesor from 'profesores/profesor.interface';

export interface IUsuario extends mongoose.Document {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rol: 'PROFESOR' | 'ADMIN' | 'DIRECTOR' | 'JEFETALLER' | 'PRECEPTOR';

  observacion?: string; // Agregado por el dueño del comercio
  profesor?: IProfesor;
  fechaCreacion: Date;
  usuarioCreacion: string | null;
  activo: boolean;
}
