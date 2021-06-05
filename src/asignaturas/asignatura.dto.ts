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
  Min,
  Max,
} from 'class-validator';

class CrearAsignaturaDto {
  @IsString({ message: 'El detalle no ha sido ingresado' })
  @MinLength(5, {
    message: 'El detalle es muy corto',
  })
  @MaxLength(50, {
    message: 'El detalle no puede superar los 50 caracteres',
  })
  public detalle: string;
  @IsString({ message: 'El tipo de asignatura no ha sido ingresado' })
  @MinLength(4, {
    message: 'El tipo de asignatura es muy corto',
  })
  @MaxLength(15, {
    message: 'El tipo de asignatura no puede superar los 15 caracteres',
  })
  public tipoAsignatura: string;
  @IsString({ message: 'El tipo de asignatura no ha sido ingresado' })
  @MinLength(7, {
    message: 'El tipo de ciclo es muy corto',
  })
  @MaxLength(15, {
    message: 'El tipo de ciclo no puede superar los 15 caracteres',
  })
  public tipoCiclo: string;
  @IsString({ message: 'El tipo de formación no ha sido ingresado' })
  @MinLength(7, {
    message: 'El tipo de formación es muy corto',
  })
  @MaxLength(50, {
    message: 'El tipo de formación no puede superar los 50 caracteres',
  })
  public tipoFormacion: string;
  @IsNumber(
    { allowNaN: false },
    {
      message: 'El curso debe ser numerico',
    }
  )
  @Min(1, { message: 'El curso no puede ser menor a 1' })
  @Max(6, { message: 'El curso no puede ser mayor a 6' })
  public curso: number;
  @IsNumber(
    { allowNaN: false },
    {
      message: 'Los meses deben ser numerico',
    }
  )
  @Min(0, { message: 'Los meses no pueden ser menor a 0' })
  @Max(12, { message: 'Los meses no pueden ser mayor a 12' })
  public meses: number;
  @IsNumber(
    { allowNaN: false },
    {
      message: 'Los meses deben ser numerico',
    }
  )
  @Min(0, { message: 'Las horas catedra anuales no pueden ser menor a 0hs' })
  @Max(500, { message: 'La horas catedra anuales no pueden superar las 500hs' })
  public horasCatedraAnuales: number;
  @IsNumber(
    { allowNaN: false },
    {
      message: 'Los meses deben ser numerico',
    }
  )
  @Min(0, { message: 'Las horas catedra semanales no pueden ser menor a 0hs' })
  @Max(500, {
    message: 'La horas catedra semanales no pueden superar las 500hs',
  })
  public horasCatedraSemanales: number;

  @IsOptional()
  @IsDateString()
  fechaCreacion: string;
  @IsDateString()
  @IsOptional()
  fechaModificacion?: string;

  @IsBoolean()
  activo: boolean;
}

export default CrearAsignaturaDto;
