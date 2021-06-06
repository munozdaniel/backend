import mongoose from 'mongoose';
export const planillaTallerOriginalSchema = new mongoose.Schema({
    // _id: { type: Number },
    id_planilla_de_taller: { type: Number },
    id_asignatura: { type: Number },
    Tcurso: { type: Number },
    division: { type: Number },
    comision: { type: String },
    ciclo_lectivo: { type: Number },
    Id_Profesor: { type: Number },
    FechaInicio: { type: String },
    Observacion: { type: String },
    FechaFinalizacion: { type: String },
    Bimestre: { type: String },
});
// Modelo
const planillaTallerOriginalModel = mongoose.model('planilla_de_taller', planillaTallerOriginalSchema);
export default planillaTallerOriginalModel;
//# sourceMappingURL=planillaTallerOriginal.model.js.map