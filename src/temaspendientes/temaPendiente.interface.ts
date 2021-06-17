import mongoose from 'mongoose';

import IPlanillaTaller from 'planillaTaller/planillaTaller.interface';
import IProfesor from 'profesores/profesor.interface';
 interface ITemaPendiente extends mongoose.Document {
  _id: string;
  planillaTaller: IPlanillaTaller; // para migrar
  fecha: Date;
  profesor:IProfesor;
  selected?: boolean;
}

export default ITemaPendiente;
