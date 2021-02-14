import * as mongoose from 'mongoose';
import IAsignatura from './curso.interface';
import mongoosePaginate from 'mongoose-paginate-v2';
import ICurso from './curso.interface';
// import AutoincrementFieldService from '../services/AutoincrementFieldService';
// import AutoincrementService from "../services/AutoincrementService";
const Schema = mongoose.Schema;

export const cursoSchema = new mongoose.Schema({
  // _id: {type:String, required:true},
  cursoNro: { type: Number },
  comision: {
    type: String,
    required: false,
    uppercase: true,
    default: 'SIN REGISTRAR',
  },
  // cicloLectivo: { type: Number, required: true }, // eliminar una vez migrados
  cicloLectivo: [
    {
      type: Schema.Types.ObjectId,
      ref: 'CicloLectivo',
      required: true,
    },
  ],
  curso: { type: Number, required: false, default: 0, min: 0 },
  division: { type: Number, required: false, default: 0, min: 0 },

  fechaCreacion: { type: Date, default: Date.now },
  fechaModificacion: { type: Date },
  activo: { type: Boolean, default: true },
});

cursoSchema.index({ comision: 1, 'cicloLectivo._id': 1, curso: 1, division: 1 }, { unique: true });
// Modelo
// cursoSchema.plugin(mongoosePaginate);
const cursoModel = mongoose.model<ICurso>('Curso', cursoSchema);

cursoSchema.pre('update', function (this: ICurso, next: any) {
  const now = new Date();
  this.fechaModificacion = now;
  next();
});
export default cursoModel;
