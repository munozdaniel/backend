import * as mongoose from 'mongoose';
interface IPlanillaTaller extends mongoose.Document {
  _id: string;
  planillaTallerId: number;

  asignaturaId: string;
  profesorId: number;
  curso: number;
  division: number;
  comision: string;
  cicloLectivo: number;
  fechaInicio: string;
  observacion: string;
  fechaFinalizacion: string;
  bimestre: string;

  fechaCreacion?: Date;
  fechaModificacion?: Date;
  activo: boolean;
}

export default IPlanillaTaller;
