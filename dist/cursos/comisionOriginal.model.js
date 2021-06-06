import mongoose from 'mongoose';
export const comisionesOriginalSchema = new mongoose.Schema({
    // _id: { type: Number},
    id_comisiones: { type: Number },
    comision: { type: String },
    id_alumnos: { type: Number },
    ciclo_lectivo: { type: Number },
    Tcurso: { type: Number },
    Division: { type: Number },
    Condicion: { type: String },
});
// Modelo
const comisionesOriginalModel = mongoose.model('Alumnos_por_comisione', comisionesOriginalSchema);
export default comisionesOriginalModel;
//# sourceMappingURL=comisionOriginal.model.js.map