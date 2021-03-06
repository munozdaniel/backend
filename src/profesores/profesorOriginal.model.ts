import mongoose from 'mongoose';

import IProfesorOriginal from './profesorOriginal.interface';

export const profesoresOriginalSchema = new mongoose.Schema({
  _id: { type: String },
  id_profesores: { type: Number },
  nombre_y_apellido: { type: String },
  telefono: { type: String },
  mail: { type: String },
  formacion: { type: String },
  tipo_de_titulacion: { type: String },
});

// Modelo
const profesoresOriginalModel = mongoose.model<IProfesorOriginal>('Profesoresoriginal', profesoresOriginalSchema);

export default profesoresOriginalModel;
