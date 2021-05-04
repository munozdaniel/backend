// import {
//   IsString,
//   IsOptional,
//   IsBoolean,
//   IsDateString,
//   MaxLength,
//   MinLength,
// } from 'class-validator';
import pkg from 'class-validator';
const { IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  MaxLength,
  MinLength,} = pkg;
class CrearAlumnoDto {
  @IsString()
  @IsOptional()
  public _id: string;
  @IsString()
  @MinLength(4, {
    message: 'El nombre del Padre/Madre/Tutor es muy corto',
  })
  @MaxLength(50, {
    message: 'El nombre del Padre/Madre/Tutor no puede superar los 9 digitos',
  })
  nombreCompleto: string;
  @IsOptional()
  @IsString()
  @MinLength(4, {
    message: 'El telefono del  Padre/Madre/Tutor debe contener al menos 4 caracteres',
  })
  @MaxLength(50, {
    message: 'El telefono del   Padre/Madre/Tutor debe contener 50 caracteres máximo',
  })
  public telefono: string;
  @IsString()
  @MinLength(4, {
    message: 'El celular del Padre/Madre/Tutor debe contener al menos 4 caracteres',
  })
  @MaxLength(50, {
    message: 'El celular del Padre/Madre/Tutor debe contener 50 caracteres máximo',
  })
  public celular: string;
  @IsString()
  @MinLength(4, {
    message: 'El email del Padre/Madre/Tutor debe contener al menos 4 caracteres',
  })
  @MaxLength(70, {
    message: 'El email del Padre/Madre/Tutor debe contener 70 caracteres máximo',
  })
  public email: string;
  @IsString()
  @MinLength(5, {
    message: 'El tipoAdulto debe contener al menos 5 caracteres',
  })
  @MaxLength(5, {
    message: 'El tipoAdulto debe contener 5 caracteres máximo',
  })
  tipoAdulto: 'TUTOR' | 'PADRE' | 'MADRE';
 
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
