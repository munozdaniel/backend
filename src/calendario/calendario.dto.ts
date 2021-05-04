import IAlumno from 'alumnos/alumno.interface';
import pkg from 'class-validator';
const { IsString, IsOptional, IsBoolean, IsDateString, MaxLength, MinLength, ValidateNested, Min, IsNumber } = pkg;
// import {
//   IsString,
//   IsOptional,
//   IsBoolean,
//   IsDateString,
//   MaxLength,
//   MinLength,
//   ValidateNested,
//   Min,
//   IsNumber,
// } from "class-validator";
import IProfesor from 'profesores/profesor.interface';
import IPlanillaTaller from '../planillaTaller/planillaTaller.interface';

class CrearAsistenciaDto {
  @ValidateNested()
  planillaTaller: IPlanillaTaller;
  @ValidateNested()
  alumno: IAlumno;
  @ValidateNested()
  profesor: IProfesor;
  @IsString({
    message: 'La forma de examen no ha sido ingresada',
  })
  @MinLength(7, {
    message: 'La forma de examen es muy corta',
  })
  @MaxLength(100, {
    message: 'La forma de examen no puede superar los 100 caracteres',
  })
  formaExamen: string;
  @IsString({
    message: 'El tipo de examen no ha sido ingresado',
  })
  @MinLength(7, {
    message: 'El tipo de examen es muy corto',
  })
  @MaxLength(100, {
    message: 'El tipo de examen no puede superar los 100 caracteres',
  })
  tipoExamen: string;
  @IsBoolean()
  promedia: boolean;
  @IsNumber()
  @Min(0, { message: 'El promedio general tiene que ser mayor a 0' })
  promedioGeneral: number;
  @IsString({
    message: 'La observacion no ha sido ingresada',
  })
  @MinLength(7, {
    message: 'La observacion es muy corta',
  })
  @MaxLength(100, {
    message: 'La observacion no puede superar los 100 caracteres',
  })
  observaciones: string;

  @IsOptional()
  @IsDateString()
  fechaCreacion: string;
  @IsDateString()
  @IsOptional()
  fechaModificacion?: string;

  @IsBoolean()
  activo: boolean;
}

export default CrearAsistenciaDto;
