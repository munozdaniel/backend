import mongoose, { SequenceOptions, SequenceSchema } from 'mongoose';
import IProfesor from './profesor.interface';
import mongoosePaginate from 'mongoose-paginate-v2';
// import AutoincrementFieldService from '../services/AutoincrementFieldService';
// import AutoincrementService from "../services/AutoincrementService";
import { autoIncrement } from 'mongoose-plugin-autoinc';
import moment from 'moment';
export const profesorSchema: SequenceSchema = new mongoose.Schema({
  // _id: {type:String, required:true},
  profesorNro: { type: Number, unique: true, required: false },
  id_profesores: { type: Number, required: false }, // id se usa solo para migrar
  nombreCompleto: { type: String },
  telefono: { type: String },
  celular: { type: String },
  email: { type: String },
  formacion: { type: String },
  titulo: { type: String },

  fechaCreacion: { type: Date, default: Date.now },
  fechaModificacion: { type: Date },
  activo: { type: Boolean, default: true },
}) as SequenceSchema;

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

profesorSchema.pre<any>('update', function (this: IProfesor, next: any) {
  const now = new Date();
  const hoy = new Date(moment(now).format('YYYY-MM-DD'));
  this.fechaModificacion = hoy;
  next();
});
export default profesorModel;
