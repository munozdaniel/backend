import mongoose from 'mongoose';
interface IAsistenciaOriginal extends mongoose.Document {
  _id: number;
  id_planilla_de_asistencia: number;
  id_planilla_de_taller: number;
  id_alumnos: number;
  Fecha: string;
  Presente: string;
  LlegoTarde: string;
}

export default IAsistenciaOriginal;
