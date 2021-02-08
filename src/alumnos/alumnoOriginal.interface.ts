import * as mongoose from 'mongoose';
interface IAlumnoOriginal extends mongoose.Document {
  dni: string;
  ApellidoyNombre: string;
  fecha_nacimiento: string;
  sexo: string;
  nacionalidad: string;
  telefonos: string;
  mail: string;
  fecha_ingreso: string;
  procedencia_colegio_primario: string;
  procedencia_colegio_secundario: string;
  fecha_de_baja: string;
  motivo_de_baja: string;
  domicilio: string;
  nombre_y_apellido_padre: string;
  telefono_padre: string;
  mail_padre: string;
  nombre_y_apellido_madre: string;
  telefono_madre: string;
  mail_madre: string;
  nombre_y_apellido_tutor1: string;
  telefono_tutor1: string;
  mail_tutor1: string;
  nombre_y_apellido_tutor2: string;
  telefono_tutor2: string;
  mail_tutor2: string;
  nombre_y_apellido_tutor3: string;
  telefono_tutor3: string;
  mail_tutor3: string;
  cantidad_integrantes_grupo_familiar: number;
  SeguimientoETAP: string;
  NombreyApellidoTae: string;
  MailTae: string;
  ArchivoDiagnostico: string;
}

export default IAlumnoOriginal;
