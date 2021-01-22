import * as mongoose from 'mongoose';
import IAlumnoOriginal from './alumnoOriginal.interface';
import mongoosePaginate from 'mongoose-paginate';

export const alumnoOriginalSchema = new mongoose.Schema({
  _id:{ type:String},
  id_alumno:{ type:Number},
  dni:{ type:String},
  ApellidoyNombre:{ type:String},
  fecha_nacimiento:{ type:String},
  sexo:{ type:String},
  nacionalidad:{ type:String},
  telefonos:{ type:String},
  mail:{ type:String},
  fecha_ingreso:{ type:String},
  procedencia_colegio_primario:{ type:String},
  procedencia_colegio_secundario:{ type:String},
  fecha_de_baja:{ type:String},
  motivo_de_baja:{ type:String},
  domicilio:{ type:String},
  nombre_y_apellido_padre:{ type:String},
  telefono_padre:{ type:String},
  mail_padre:{ type:String},
  nombre_y_apellido_madre:{ type:String},
  telefono_madre:{ type:String},
  mail_madre:{ type:String},
  nombre_y_apellido_tutor1:{ type:String},
  telefono_tutor1:{ type:String},
  mail_tutor1:{ type:String},
  nombre_y_apellido_tutor2:{ type:String},
  telefono_tutor2:{ type:String},
  mail_tutor2:{ type:String},
  nombre_y_apellido_tutor3:{ type:String},
  telefono_tutor3:{ type:String},
  mail_tutor3:{ type:String},
  cantidad_integrantes_grupo_familiar:{ type:Number},
  SeguimientoETAP:{ type:String},
  NombreyApellidoTae:{ type:String},
  MailTae:{ type:String},
  ArchivoDiagnostico:{ type:String},


});

// Modelo
const alumnoOriginalModel = mongoose.model<IAlumnoOriginal>('AlumnoOriginal', alumnoOriginalSchema);

export default alumnoOriginalModel;
