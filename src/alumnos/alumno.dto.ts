import IAdulto from '../adulto/adulto.interface';
import {
  IsString,
  ValidateNested,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDateString,
  MaxLength,
  MinLength,
  IsDate,
  IsArray,
} from 'class-validator';

class CrearAlumnoDto {
  @IsString()
  @IsOptional()
  public _id: string;
  @IsString()
  @IsOptional()
  @MinLength(4, {
    message: 'La obs del telefono es muy corto',
  })
  @MaxLength(50, {
    message: 'La obs del telefono no puede superar los 9 digitos',
  })
  public observacionTelefono: string;
  @IsString()
  @IsOptional()
  @MinLength(4, {
    message: 'La obs del telefono es muy corto',
  })
  @MaxLength(200, {
    message: 'La obs del telefono no puede superar los 200 digitos',
  })
  public observacion: string;

  @ValidateNested()
  @IsArray({
    message: 'Debe ingresar al menos un elemento en la lista de adultos',
  })
  adultos: IAdulto[];

  @IsString()
  @MinLength(4, {
    message: 'El dni es muy corto',
  })
  @MaxLength(50, {
    message: 'El dni no puede superar los 9 digitos',
  })
  public dni: string;
  @IsString()
  @MinLength(4, {
    message: 'El tipo Dni es muy corto',
  })
  @MaxLength(9, {
    message: 'El tipo Dni no puede superar los 9 digitos',
  })
  public tipoDni: string;
  @IsString()
  @MinLength(3, {
    message: 'El nombre es muy corto',
  })
  @MaxLength(250, {
    message: 'El nombre no puede superar los 250 caracteres',
  })
  public nombreCompleto: string;
  @IsDate({ message: 'La fecha de nacimiento no es válida' })
  public fechaNacimiento: string;
  @IsString()
  @MinLength(4, {
    message: 'El sexo debe indentificarse con más de 4 caracteres',
  })
  @MaxLength(15, {
    message: 'El sexo debe identificarse en 15 caracteres máximo',
  })
  public sexo: string;
  @IsString()
  @MinLength(4, {
    message: 'La nacionalidad debe contener al menos 4 caracteres',
  })
  @MaxLength(50, {
    message: 'La nacionalidad debe contener 50 caracteres máximo',
  })
  public nacionalidad: string;
  @IsOptional()
  @IsString()
  @MinLength(4, {
    message: 'El telefono debe contener al menos 4 caracteres',
  })
  @MaxLength(50, {
    message: 'El telefono debe contener 50 caracteres máximo',
  })
  public telefono: string;
  @IsString()
  @MinLength(4, {
    message: 'El celular debe contener al menos 4 caracteres',
  })
  @MaxLength(50, {
    message: 'El celular debe contener 50 caracteres máximo',
  })
  public celular: string;
  @IsString()
  @MinLength(4, {
    message: 'El email debe contener al menos 4 caracteres',
  })
  @MaxLength(70, {
    message: 'El email debe contener 70 caracteres máximo',
  })
  public email: string;
  @IsDate({ message: 'La fecha de ingreso no es válida' })
  public fechaIngreso: string;
  @IsString()
  @MinLength(4, {
    message: 'La procedencia del colegio primario al menos 4 caracteres',
  })
  @MaxLength(50, {
    message:
      'La procedencia del colegio primario debe contener 50 caracteres máximo',
  })
  public procedenciaColegioPrimario: string;
  @IsString()
  @MinLength(4, {
    message:
      'La procedencia del colegio secundario debe contener al menos 4 caracteres',
  })
  @MaxLength(50, {
    message:
      'La procedencia del colegio secundario debe contener 50 caracteres máximo',
  })
  public procedenciaColegioSecundario: string;
  @IsDate({ message: 'La fecha de ingreso no es válida' })
  public fechaDeBaja: string;
  @IsString()
  @MinLength(4, {
    message: 'El motivo de baja debe contener al menos 4 caracteres',
  })
  @MaxLength(50, {
    message: 'El motivo de baja debe contener 50 caracteres máximo',
  })
  public motivoDeBaja: string;
  @IsString()
  @MinLength(4, {
    message: 'El domicilio debe contener al menos 4 caracteres',
  })
  @MaxLength(100, {
    message: 'El domicilio  debe contener 100 caracteres máximo',
  })
  public domicilio: string;
  @IsNumber(
    { allowNaN: false },
    {
      message:
        'La cantidad de integrantes del grupo familiar debe ser numerico',
    }
  )
  public cantidadIntegranteGrupoFamiliar: number;
  @IsString()
  @MinLength(2, {
    message: 'Seguimiento Etap de 2 caracteres',
  })
  @MaxLength(2, {
    message: 'Seguimiento Etap de 2 caracteres',
  })
  public seguimientoEtap: string;
  @IsString()
  @MinLength(4, {
    message: 'El nombre del TAE debe contener al menos 4 caracteres',
  })
  @MaxLength(100, {
    message: 'El nombre del TAE debe contener 100 caracteres máximo',
  })
  public nombreCompletoTae: string;
  @IsString()
  @MinLength(4, {
    message: 'El email del TAE debe contener al menos 4 caracteres',
  })
  @MaxLength(70, {
    message: 'El email del TAE debe contener 70 caracteres máximo',
  })
  public emailTae: string;
  @IsString()
  @MinLength(4, {
    message: 'El diagnostico debe contener al menos 4 caracteres',
  })
  @MaxLength(70, {
    message: 'El diagnostico debe contener 70 caracteres máximo',
  })
  public archivoDiagnostico: string;
  @IsOptional()
  @IsDateString()
  fechaCreacion: string;
  @IsDateString()
  @IsOptional()
  fechaModificacion?: string;

  @IsBoolean()
  activo: boolean;
}

export default CrearAlumnoDto;
