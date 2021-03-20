import mongoose from 'mongoose';
import { IUsuario } from './usuario.interface';
import passportLocalMongoose from 'passport-local-mongoose';
const Schema = mongoose.Schema;

export const usuarioSchema = new Schema({
  email: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  rol: { type: String }, // Deberia ser una coleccion aparte pero vamos a probar asi
  observacion: { type: String },

  fechaCreacion: { type: Date, default: Date.now },
  fechaModificacion: { type: Date, default: Date.now },
  activo: { type: Boolean, default: true },
});

// Hooks
usuarioSchema.pre('save', async function (this: IUsuario, next: any) {
  const SALT_FACTOR = 5;
  if (!this.isModified('password')) return next();

  console.log('usuarioSchema', 'save');
  const now = new Date();
  if (!this.fechaCreacion) {
    this.fechaCreacion = now;
  }
  next();
});
// Plugin
usuarioSchema.plugin(passportLocalMongoose, {
  usernameField: 'email',
  errorMessages: {
    IncorrectPasswordError: 'Contraseña incorrecta',
    IncorrectUsernameError: 'No hay una cuenta registrada con el correo ingresado',
    UserExistsError: 'El email ya se encuentra asignado a otro usuario',
  },
  usernameUnique: false,
});
// Modelo
const usuarioModel = mongoose.model<IUsuario>('Usuario', usuarioSchema);
export default usuarioModel;
