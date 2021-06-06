import mongoose from 'mongoose';
export const asistenciaOriginalSchema = new mongoose.Schema({
    // _id: { type: Number },
    id_planilla_de_asistencia: { type: Number },
    id_planilla_de_taller: { type: Number },
    id_alumnos: { type: Number },
    Fecha: { type: String },
    Presente: { type: String },
    LlegoTarde: { type: String },
});
// Modelo
const asistenciaOriginalModel = mongoose.model('planilla_de_asistencia_por_alumnos', asistenciaOriginalSchema);
export default asistenciaOriginalModel;
//# sourceMappingURL=asistenciaOriginal.model.js.map