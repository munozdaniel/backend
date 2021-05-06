import mongoose from 'mongoose';

import IAsistencia from './asistencia.interface';
import mongoosePaginate from 'mongoose-paginate-v2';
// import AutoincrementFieldService from '../services/AutoincrementFieldService';
// import AutoincrementService from "../services/AutoincrementService";
const Schema = mongoose.Schema;
import { autoIncrement } from 'mongoose-plugin-autoinc';
import moment from 'moment';

export const asistenciaSchema = new mongoose.Schema({
  planillaTaller: {
    type: Schema.Types.ObjectId,
    ref: 'PlanillaTallere',
    required: true,
  },
  alumno: {
    type: Schema.Types.ObjectId,
    ref: 'Alumno',
    required: true,
  },
  id_planilla_de_asistencia: { type: Number }, // para migrar
  presente: { type: Boolean, required: true, default: true },
  llegoTarde: { type: Boolean, required: false, default: false },
  fecha: { type: Date, required: true },

  fechaCreacion: { type: Date, default: Date.now },
  fechaModificacion: { type: Date },
  activo: { type: Boolean, default: true },
});

// Modelo
asistenciaSchema.plugin(mongoosePaginate);
// <IAsistencia>
// asistenciaSchema.plugin(autoIncrement, {
//   model: 'Asistencia',
//   field: 'asistenciaNro',
// });
asistenciaSchema.index({ planillaTaller: 1, alumno: 1, fecha: 1 }, { unique: true });

const asistenciaModel = mongoose.model('Asistencia', asistenciaSchema);

asistenciaSchema.pre<any>('update', function (this: IAsistencia, next: any) {
  const now = new Date();
  const hoy = new Date(moment(now).format('YYYY-MM-DD'));
  this.fechaModificacion = hoy;
  next();
});
// asistenciaSchema.pre('findOneAndUpdate', function (this: IAsistencia, next: any) {
//   const ultimaAsistencia = asistenciaModel.find().sort({_id:1}).limit(1);
//   this.
//   mongoose.models["YourModel"].find(this.getQuery(), (err, data) => {
//     if (data.length === 0) {
//         mongoose.models["YourModel"].create({
//             name: self.getQuery().name
//         },
//         function (err, name) {
//             if (err) return next(err)
//             next()
//         })
//     } else {
//         next()
//     }
// })
//   next();
// });
export default asistenciaModel;
