import IAlumno from 'alumnos/alumno.interface';
import mongoose from 'mongoose';
import IPlanillaTaller from 'planillaTaller/planillaTaller.interface';

interface IExamen extends mongoose.Document {
  _id: string;
  nota: number;
  mes: string;
  alumno: IAlumno;
  planilla: IPlanillaTaller;
  ausente?:boolean;
}

export default IExamen;
