import IAdulto from 'adulto/adulto.interface';
import * as mongoose from 'mongoose';
interface IAlumno extends mongoose.Document {
  _id: string;
  adulto:IAdulto[];
  dni: string;
  nombreCompleto: string;
  fechaNacimiento: string;
  sexo: string;
  nacionalidad: string;
  telefono?: string;
  celular: string;
  email: string;
  fechaIngreso: string;
  procedenciaColegioPrimario: string;
  procedenciaColegioSecundario: string;
  fechaDeBaja: string;
  motivoDeBaja: string;
  domicilio: string;

  cantidadIntegranteGrupoFamiliar: number;
  seguimientoEtap: string;

  nombreCompletoTae: string;
  emailTae: string;
  archivoDiagnostico: string;

  fechaCreacion: Date;
  fechaModificacion?: Date;
  activo: boolean;
}

export default IAlumno;
