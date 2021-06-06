import mongoose from 'mongoose';
const Schema = mongoose.Schema;
export const alumnoTallerSchema = new mongoose.Schema({
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
});
const alumnoTallerModel = mongoose.model('AlumnoTallere', alumnoTallerSchema);
export default alumnoTallerModel;
//# sourceMappingURL=alumnoTaller.model.js.map