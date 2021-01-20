 import * as mongoose from 'mongoose';
interface IComisionOriginal extends mongoose.Document {
  _id:string;
  nombre_y_apellido:string;
  telefono:string;
  mail:string;
  formacion:string;
  tipo_de_titulacion:string;

}

export default IComisionOriginal;
