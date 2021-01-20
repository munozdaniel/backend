 import * as mongoose from 'mongoose';
interface IProfesorOriginal extends mongoose.Document {
  _id:string;
  nombre_y_apellido:string;
  telefono:string;
  mail:string;
  formacion:string;
  tipo_de_titulacion:string;

}

export default IProfesorOriginal;
