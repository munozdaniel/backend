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
  @IsOptional()
  @IsString({ message: 'El legajo no ha sido ingresado' })
  public legajo: string;
  @IsString({ message: 'El dni no ha sido ingresado' })
  @MinLength(7, {
    message: 'El dni es muy corto',
  })
  @MaxLength(9, {
    message: 'El dni no puede superar los 9 digitos',
  })
  public dni: string;
  @IsString()
  @IsOptional()
  public _id: string;
  @IsString()
  @IsOptional()
  public observacionTelefono: string;
  @IsString()
  @IsOptional()
  @MinLength(4, {
    message: 'La observación es muy corta',
  })
  @MaxLength(200, {
    message: 'La observación no puede superar los 200 digitos',
  })
  public observacion: string;

  @ValidateNested()
  @IsArray({
    message: 'Debe ingresar al menos un elemento en la lista de adultos',
  })
  adultos: IAdulto[];

  @IsString()
  @MinLength(3, {
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
  @IsDateString({ message: 'La fecha de nacimiento no es válida' })
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
  @IsString({ message: 'El telefono no fue ingresado' })
  @MinLength(4, {
    message: 'El telefono debe contener al menos 4 caracteres',
  })
  @MaxLength(50, {
    message: 'El telefono debe contener 50 caracteres máximo',
  })
  @IsOptional()
  public telefono: string;
  @IsString()
  @MinLength(4, {
    message: 'El celular debe contener al menos 4 caracteres',
  })
  @MaxLength(50, {
    message: 'El celular debe contener 50 caracteres máximo',
  })
  @IsOptional()
  public celular: string;
  @IsString()
  @MinLength(4, {
    message: 'El email debe contener al menos 4 caracteres',
  })
  @MaxLength(70, {
    message: 'El email debe contener 70 caracteres máximo',
  })
  public email: string;
  @IsDateString({ message: 'La fecha de ingreso no es válida' })
  public fechaIngreso: string;
  @IsString()
  @MinLength(4, {
    message: 'La procedencia del colegio primario al menos 4 caracteres',
  })
  @MaxLength(50, {
    message: 'La procedencia del colegio primario debe contener 50 caracteres máximo',
  })
  @IsOptional()
  public procedenciaColegioPrimario: string;
  @IsString()
  @MinLength(4, {
    message: 'La procedencia del colegio secundario debe contener al menos 4 caracteres',
  })
  @MaxLength(50, {
    message: 'La procedencia del colegio secundario debe contener 50 caracteres máximo',
  })
  @IsOptional()
  public procedenciaColegioSecundario: string;
  @IsOptional()
  @IsDateString({ message: 'La fecha de baja no es válida' })
  public fechaDeBaja: string;
  @IsOptional()
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
      message: 'La cantidad de integrantes del grupo familiar debe ser numerico',
    }
  )
  @IsOptional()
  public cantidadIntegranteGrupoFamiliar: number;
  @IsString()
  @MinLength(2, {
    message: 'Seguimiento Etap de 2 caracteres',
  })
  @MaxLength(2, {
    message: 'Seguimiento Etap de 2 caracteres',
  })
  @IsOptional()
  public seguimientoEtap: string;
  @IsOptional()
  @IsString()
  @MinLength(4, {
    message: 'El nombre del TAE debe contener al menos 4 caracteres',
  })
  @MaxLength(100, {
    message: 'El nombre del TAE debe contener 100 caracteres máximo. ',
  })
  public nombreCompletoTae: string;
  @IsString({ message: 'El email del TAE no ha sido ingresado' })
  @IsOptional()
  @MinLength(4, {
    message: 'El email del TAE debe contener al menos 4 caracteres. ',
  })
  @MaxLength(70, {
    message: 'El email del TAE debe contener 70 caracteres máximo. ',
  })
  public emailTae: string;
  @IsOptional()
  @IsString({ message: 'El diagnositico no ha sido ingresado. ' })
  @MinLength(4, {
    message: 'El diagnostico debe contener al menos 4 caracteres. ',
  })
  @MaxLength(70, {
    message: 'El diagnostico debe contener 70 caracteres máximo.',
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
