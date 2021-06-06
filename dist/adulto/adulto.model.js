import mongoose from 'mongoose';
export const adultoSchema = new mongoose.Schema({
    nombreCompleto: { type: String },
    telefono: { type: String },
    celular: { type: String },
    email: { type: String },
    tipoAdulto: { type: String },
    fechaCreacion: { type: Date, default: Date.now },
    fechaModificacion: { type: Date },
    activo: { type: Boolean, default: true },
});
// Modelo
const adultoModel = mongoose.model('Adulto', adultoSchema);
// Hooks
export default adultoModel;
//# sourceMappingURL=adulto.model.js.map