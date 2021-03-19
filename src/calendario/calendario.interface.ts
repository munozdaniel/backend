import ICicloLectivo from 'ciclolectivos/ciclolectivo.interface';
import mongoose from 'mongoose';

interface ICalendario extends mongoose.Document {
  _id: number;
  id_calendario: number; // para migrar
  fecha: Date;
  cicloLectivo: ICicloLectivo;
  comisionA: number;
  comisionB: number;
  comisionC: number;
  comisionD: number;
  comisionE: number;
  comisionF: number;
  comisionG: number;
  comisionH: number;

  fechaCreacion?: Date;
  activo: boolean;
}

export default ICalendario;
