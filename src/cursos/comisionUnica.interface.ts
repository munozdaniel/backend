import mongoose from 'mongoose';

interface IComisionOriginal extends mongoose.Document {
  _id: number;
  id_comisiones: number;
  comision: string;
  id_alumnos: number;
  ciclo_lectivo: number;
  Tcurso: number;
  Division: number;
}

export default IComisionOriginal;
