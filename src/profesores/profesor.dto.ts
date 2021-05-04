// import { IsString, IsOptional, IsBoolean, IsDateString, MaxLength, MinLength, IsNumberString } from 'class-validator';
import pkg from 'class-validator';
const { IsString, IsOptional, IsBoolean, IsDateString, MaxLength, MinLength, IsNumberString } = pkg;
class CrearProfesorDto {
  @IsString({ message: 'El nombre completo no ha sido ingresado' })
  @MinLength(7, {
    message: 'El nombre completo  es muy corto',
  })
  @MaxLength(100, {
    message: 'El nombre completo no puede superar los 100 caracteres',
  })
  nombreCompleto: string;
  @IsOptional()
  @IsNumberString({ message: 'El telefono no fue ingresado' })
  @MinLength(4, {
    message: 'El telefono debe contener al menos 4 caracteres',
  })
  @MaxLength(100, {
    message: 'El telefono debe contener 100 caracteres máximo',
  })
  @IsOptional()
  public telefono: string;
  @IsNumberString()
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
  fechaCreacion: Date;
  @IsDateString()
  @IsOptional()
  fechaModificacion?: string;

  @IsBoolean()
  activo: boolean;
}

export default CrearProfesorDto;
