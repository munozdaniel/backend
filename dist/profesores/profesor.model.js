import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
// import AutoincrementFieldService from '../services/AutoincrementFieldService';
// import AutoincrementService from "../services/AutoincrementService";
import { autoIncrement } from 'mongoose-plugin-autoinc';
import moment from 'moment';
export const profesorSchema = new mongoose.Schema({
    // _id: {type:String, required:true},
    profesorNro: { type: Number, unique: true, required: false },
    id_profesores: { type: Number, required: false },
    nombreCompleto: { type: String },
    telefono: { type: String },
    celular: { type: String },
    email: { type: String },
    formacion: { type: String },
    titulo: { type: String },
    fechaCreacion: { type: Date, default: Date.now },
    fechaModificacion: { type: Date },
    activo: { type: Boolean, default: true },
});
// Modelo
profesorSchema.plugin(mongoosePaginate);
// <IProfesor>
profesorSchema.plugin(autoIncrement, {
    model: 'Profesore',
    field: 'profesorNro',
});
const profesorModel = mongoose.model('Profesore', profesorSchema);
// Hooks
// profesorSchema.plugin(AutoincrementFieldService.getAutoIncrement().plugin, { model: 'Profesor', field: 'profesorNro' });
// profesorSchema.plugin(autoIncrement.plugin, {
//   model: "model",
//   field: "field",
//   startAt: 5000,
//   incrementBy: 1,
// });
profesorSchema.pre('update', function (next) {
    const now = new Date();
    const hoy = new Date(moment(now).format('YYYY-MM-DD'));
    this.fechaModificacion = hoy;
    next();
});
export default profesorModel;
//# sourceMappingURL=profesor.model.js.map