var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';
const Schema = mongoose.Schema;
export const usuarioSchema = new Schema({
    email: { type: String, required: true, unique: true },
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    rol: { type: String },
    observacion: { type: String },
    profesor: {
        type: Schema.Types.ObjectId,
        ref: 'Profesore',
        required: false,
    },
    fechaCreacion: { type: Date, default: Date.now },
    fechaModificacion: { type: Date, default: Date.now },
    activo: { type: Boolean, default: true },
});
// Hooks
usuarioSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const SALT_FACTOR = 5;
        if (!this.isModified('password'))
            return next();
        console.log('usuarioSchema', 'save');
        const now = new Date();
        if (!this.fechaCreacion) {
            this.fechaCreacion = now;
        }
        next();
    });
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
const usuarioModel = mongoose.model('Usuario', usuarioSchema);
export default usuarioModel;
//# sourceMappingURL=usuario.model.js.map