import mongoose from 'mongoose';

import IPlanillaTaller from 'planillaTaller/planillaTaller.interface';
import IAlumno from 'alumnos/alumno.interface';
interface IAlumnoTaller extends mongoose.Document {
  _id: string;
  planillaTaller: IPlanillaTaller; // para migrar
  alumno: IAlumno;
  selected?: boolean;
}

export default IAlumnoTaller;
