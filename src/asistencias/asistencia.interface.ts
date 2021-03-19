import IAlumno from 'alumnos/alumno.interface';
import mongoose from 'mongoose';

import IPlanillaTaller from 'planillaTaller/planillaTaller.interface';
interface IAsistencia extends mongoose.Document {
  _id: string;
  id_planilla_de_asistencia: number; // para migrar
  planillaTaller: IPlanillaTaller;
  alumno: IAlumno;
  fecha: Date;
  presente: boolean;
  llegoTarde: boolean;

  fechaCreacion?: Date;
  fechaModificacion?: Date;
  activo: boolean;
}

export default IAsistencia;
