import IAsignatura from "../asignaturas/asignatura.interface";
import IComision from "../comisiones/comision.interface";
import * as mongoose from "mongoose";
import IProfesor from "../profesores/profesor.interface";
import ICurso from "cursos/curso.interface";
interface IPlanillaTaller extends mongoose.Document {
  _id: string;
  planillaTallerNro: number;
  planillaTallerId: number; // para migrar
  asignatura: IAsignatura;
  profesor: IProfesor;
  curso: ICurso;
  // curso: number;
  // division: number;
  // comision: string;
  // cicloLectivo: number;
  fechaInicio: Date;
  fechaFinalizacion: Date;
  observacion: string;
  bimestre: string;

  fechaCreacion?: Date;
  fechaModificacion?: Date;
  activo: boolean;
}

export default IPlanillaTaller;
