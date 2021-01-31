import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  MaxLength,
  MinLength,
  IsNumber,
  IsNumberString,
  Min,
} from 'class-validator';

class CrearProfesorDto {
  @IsString()
  idAlumno: string;
  @IsString()
  idPlanillaDeTaller: string;
  @IsOptional()
  @IsDateString()
  fecha: string;
  @IsString({ message: 'El tipo de seguimiento no ha sido ingresado' })
  @MinLength(5, {
    message: 'El tipo de seguimiento es muy corto',
  })
  @MaxLength(100, {
    message: 'El tipo de seguimiento no puede superar los 100 caracteres',
  })
  tipoSeguimiento: string;
  @IsString({ message: 'La observación no ha sido ingresado' })
  @MinLength(5, {
    message: 'La observación es muy corta',
  })
  @MaxLength(100, {
    message: 'La observación no puede superar los 100 caracteres',
  })
  observacion: string;
  @IsNumber(
    { allowNaN: false },
    {
      message: 'El ciclo lectivo debe ser numerico',
    }
  )
  @Min(2000, { message: 'El ciclo lectivo no puede ser menor a 2000' })
  cicloLectivo: number;
  @IsString({
    message: 'La descripción de como fue resuelto no ha sido ingresado',
  })
  @IsOptional()
  @MinLength(5, {
    message: 'La descripción de como fue resuelto es muy corta',
  })
  @MaxLength(100, {
    message:
      'La descripción de como fue resuelto no puede superar los 100 caracteres',
  })
  resuelto: string;
  @IsString({ message: 'La observacion 2 no ha sido ingresada' })
  @MinLength(5, {
    message: 'La observacion 2 es muy corta',
  })
  @MaxLength(100, {
    message: 'La observacion 2 no puede superar los 100 caracteres',
  })
  observacion2: string;
  @IsString({ message: 'El tipo de seguimiento no ha sido ingresado' })
  @MinLength(5, {
    message: 'La observacion del jefe de taller es muy corta',
  })
  @MaxLength(100, {
    message:
      'La observacion del jefe de taller no puede superar los 100 caracteres',
  })
  observacionJefe: string;

  @IsOptional()
  @IsString({ message: 'El telefono no fue ingresado' })
  @MinLength(4, {
    message: 'El telefono debe contener al menos 4 caracteres',
  })
  @MaxLength(100, {
    message: 'El telefono debe contener 100 caracteres máximo',
  })
  @IsOptional()
  public telefono: string;
  @IsString()
  @MinLength(4, {
    message: 'El celular debe contener al menos 4 caracteres',
  })
  @MaxLength(100, {
    message: 'El celular debe contener 100 caracteres máximo',
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
  @IsString({ message: 'La formación no ha sido ingresado' })
  @MinLength(7, {
    message: 'La formación es muy corto',
  })
  @MaxLength(100, {
    message: 'La formación no puede superar los 100 caracteres',
  })
  formacion: string;
  @IsString({ message: 'El titulo no ha sido ingresado' })
  @MinLength(7, {
    message: 'El titulo es muy corto',
  })
  @MaxLength(100, {
    message: 'El titulo no puede superar los 100 caracteres',
  })
  titulo: string;

  @IsOptional()
  @IsDateString()
  fechaCreacion: string;
  @IsDateString()
  @IsOptional()
  fechaModificacion?: string;

  @IsBoolean()
  activo: boolean;
}

export default CrearProfesorDto;
