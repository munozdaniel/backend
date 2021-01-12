import * as mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';
import { rolesEnum } from '../utils/roles.enum';
import { direccionSchema } from '../direccion/direccion.model';
import { tarjetaSchema } from '../tarjeta/tarjeta.model';
import { IUsuario } from './iUsuario';

export const usuarioSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  //  passport-local-mongoose genera un hash y salt por la contraseña
  // password: { type: String, required: true },
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  telefono: { type: String },
  rol: { type: String, default:rolesEnum.CLIENTE },
  identificacion: { type: String },
  fechaNacimiento: Date,
  direccionActual: direccionSchema,
  direcciones: [direccionSchema],
  perfilCompleto: { type: Boolean, default: false },
  observacion: { type: String },
  totalGastado: { type: String, default: 0 },
  ultimaCompra: { type: String, default: null },
  tarjetaGuardada: tarjetaSchema,

  fechaCreacion: { type: Date, default: Date.now },
  usuarioCreacion: { type: String }, // id
  fechaModificacion: { type: Date, default: Date.now },
  usuarioModificacion: { type: String },
  activo: { type: Boolean, default: true },

});

// Hooks
usuarioSchema.pre('save', async function (this: IUsuario, next: any) {
  var SALT_FACTOR = 5;
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

// usuarioSchema.pre('update', function (this: IUsuario, next: any) {
//   const now = new Date();
//   this.fechaModificacion = now;
//   next();
// });

// usuarioSchema.methods.isValidPassword = async function (password: string) {
//   const user = this;
//   const compare = await bcrypt.compare(password, user.password);
//   return compare;
// };
// Modelo
const usuarioModel = mongoose.model<IUsuario>('Usuario', usuarioSchema);
export default usuarioModel;
