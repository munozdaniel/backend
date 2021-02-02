import IAlumno from "alumnos/alumno.interface";
import * as mongoose from "mongoose";
import IPlanillaTaller from "planillaTaller/planillaTaller.interface";
interface IAsistencia extends mongoose.Document {
  _id: string;
  asistenciaNro:number;
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
