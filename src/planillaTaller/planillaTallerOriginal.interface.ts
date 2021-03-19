import mongoose from 'mongoose';

interface IPlanillaTallerOriginal extends mongoose.Document {
  _id: number;
  id_planilla_de_taller: number;
  id_asignatura: number;
  Tcurso: number;
  division: number;
  comision: string;
  ciclo_lectivo: number;
  Id_Profesor: number;
  FechaInicio: string;
  Observacion: string;
  FechaFinalizacion: string;
  Bimestre: string;
}

export default IPlanillaTallerOriginal;
