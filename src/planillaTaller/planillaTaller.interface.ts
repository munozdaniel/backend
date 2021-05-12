import IAsignatura from '../asignaturas/asignatura.interface';
import mongoose from 'mongoose';

import IProfesor from '../profesores/profesor.interface';
import ICurso from 'cursos/curso.interface';
import ICicloLectivo from 'ciclolectivos/ciclolectivo.interface';
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
  cicloLectivo: ICicloLectivo;
  fechaInicio: Date;
  fechaFinalizacion: Date;
  observacion: string;
  bimestre: string;
  turno?: string;
  tipoCalendario?: 'POR COMISION' | 'PERSONALIZADO';
  diasHabilitados: string[]; // Lunes,Martes,Miercoles... (En ingles)
  fechaCreacion?: Date;
  fechaModificacion?: Date;
  activo: boolean;
}

export default IPlanillaTaller;
