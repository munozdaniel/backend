import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
export const ciclolectivoSchema = new mongoose.Schema({
    anio: { type: Number, required: true, unique: true },
});
ciclolectivoSchema.plugin(mongoosePaginate);
const ciclolectivoModel = mongoose.model('CicloLectivo', ciclolectivoSchema);
export default ciclolectivoModel;
//# sourceMappingURL=ciclolectivo.model.js.map