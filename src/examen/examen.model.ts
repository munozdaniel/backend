import mongoose from 'mongoose';

import mongoosePaginate from 'mongoose-paginate-v2';
const Schema = mongoose.Schema;

export const examenSchema = new Schema({
  nota: { type: Number, required: true },
  mes: { type: String, required: true },
  ausente: { type: Boolean, required: false },
  alumno: {
    type: Schema.Types.ObjectId,
    ref: 'Alumno',
    required: true,
  },
  planillaTaller: {
    type: Schema.Types.ObjectId,
    ref: 'PlanillaTallere',
    required: true,
  },
  fecha: { type: Date, required: true},
});
examenSchema.plugin(mongoosePaginate);
const examenModel = mongoose.model('Examene', examenSchema);

export default examenModel;
