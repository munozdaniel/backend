import mongoose from 'mongoose';
export const temaOriginalSchema = new mongoose.Schema({
    // _id: { type: Number },
    id_planilla_temas: { type: Number },
    id_planilla_taller: { type: Number },
    Id_temas_por_unidad: { type: Number },
    Fecha: { type: Date },
    Temas_del_dia: { type: String },
    Tipo_de_desarrollo: { type: String },
    Temas_Proxima_Clase: { type: String },
    NroClase: { type: Number },
    Unidad: { type: Number },
    CaracterClase: { type: String },
    ObservacionJefe: { type: Number },
});
// Modelo
const temaOriginalModel = mongoose.model('planilla_temario_por_dia', temaOriginalSchema);
export default temaOriginalModel;
//# sourceMappingURL=temaOriginal.model.js.map