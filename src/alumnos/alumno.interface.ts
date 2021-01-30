import IAdulto from '../adulto/adulto.interface';
import * as mongoose from 'mongoose';
import IComision from '../comisiones/comision.interface';
interface IAlumno extends mongoose.Document {
  // _id: string;
  alumnoNro?:number;
  adultos:IAdulto[];
  comisiones?:IComision[];
  tipoDni: string;
  dni: string;
  nombreCompleto: string;
  fechaNacimiento: string;
  sexo: 'Masculino' | 'Femenino' | 'Otros';
  nacionalidad: string;
  observacionTelefono?: string;
  telefono?: string;
  celular?: string;
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

  observacion?: string;

  fechaCreacion: Date;
  fechaModificacion?: Date;
  activo: boolean;
}

export default IAlumno;
