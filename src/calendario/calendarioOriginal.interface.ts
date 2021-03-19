import mongoose from 'mongoose';

interface ICalendarioOriginal extends mongoose.Document {
  _id: number;
  id_calendario: number;
  fechas: any;
  comision?: string;
  ciclo_lectivo: number;
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  F: number;
  G: number;
  H: number;
}

export default ICalendarioOriginal;
