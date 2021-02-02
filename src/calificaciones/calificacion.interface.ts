import IAlumno from "alumnos/alumno.interface";
import * as mongoose from "mongoose";
import IPlanillaTaller from "planillaTaller/planillaTaller.interface";
import IProfesor from "profesores/profesor.interface";
interface ICalificacion extends mongoose.Document {
  _id: number;
  id_calificaciones: number; // para migrar
  planillaTaller: IPlanillaTaller;
  profesor: IProfesor;
  alumno: IAlumno;
  formaExamen?: string; // ORAL | ESCRITO
  tipoExamen?: string;// TP | EVALUACION | CONCEPTO | PARTICIPACION | TRABAJO EN GRUPO
  promedia: boolean;
  promedioGeneral: number;
  observaciones: string;

  fechaCreacion?: Date;
  fechaModificacion?: Date;
  activo: boolean;
}

export default ICalificacion;
