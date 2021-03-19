import mongoose from 'mongoose';

import ISeguimientoAlumnoOriginal from './seguimientoAlumnoOriginal.interface';

export const seguimientoAlumnoOriginalSchema = new mongoose.Schema({
  id_seguimiento: { type: Number },
  id_alumno: { type: Number },
  fecha: { type: String },
  tipo_seguimiento: { type: String },
  observacion: { type: String },
  ciclo_lectivo: { type: Number },
  IdPlanillaDeTaller: { type: Number },
  Resuelto: { type: String },
  Observacion2: { type: String },
  ObservacionJefe: { type: String },
});

// Modelo
const seguimientoAlumnoOriginalModel = mongoose.model<ISeguimientoAlumnoOriginal>('seguimiento_de_alumno', seguimientoAlumnoOriginalSchema);

export default seguimientoAlumnoOriginalModel;
