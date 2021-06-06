import mongoose from 'mongoose';
import moment from 'moment';
export const cursoSchema = new mongoose.Schema({
    cursoNro: { type: Number },
    comision: {
        type: String,
        required: false,
        uppercase: true,
        default: null,
    },
    curso: { type: Number, required: true, default: 0, min: 0 },
    division: { type: Number, required: true, default: 0, min: 0 },
    fechaCreacion: { type: Date, default: Date.now },
    fechaModificacion: { type: Date },
    activo: { type: Boolean, default: true },
});
cursoSchema.index({ comision: 1, curso: 1, division: 1 }, { unique: true });
// Modelo
// cursoSchema.plugin(mongoosePaginate);
const cursoModel = mongoose.model('Curso', cursoSchema);
cursoSchema.pre('update', function (next) {
    const now = new Date();
    const hoy = new Date(moment(now).format('YYYY-MM-DD'));
    this.fechaModificacion = hoy;
    next();
});
export default cursoModel;
//# sourceMappingURL=curso.model.js.map