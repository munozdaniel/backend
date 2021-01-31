 import * as mongoose from 'mongoose';
interface IAsignaturaOriginal extends mongoose.Document {
  _id:string;
  IdAsignarutas:number;
  DetalleAsignatura:string;
  TipoAsignatura:string;
  TipoCiclo:string;
  Tcurso:number;
  HorasCatedraAnuales:number;
  HorasCatedraSemanales:number;
  Meses:number;
  Tipodeformacion:string;

}

export default IAsignaturaOriginal;
