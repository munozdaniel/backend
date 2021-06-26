import mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const temaPendienteSchema = new mongoose.Schema({
  planillaTaller: {
    type: Schema.Types.ObjectId,
    ref: 'PlanillaTallere',
    required: true,
  },
  fecha: { type: Date, required: true },
  profesor: {
    type: Schema.Types.ObjectId,
    ref: 'Profesore',
    required: false,
  },
  motivoAlerta: { type: String, default: null, required: false },
});

const temaPendienteModel = mongoose.model('temaPendiente', temaPendienteSchema);

export default temaPendienteModel;
