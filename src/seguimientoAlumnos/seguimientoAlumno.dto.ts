import IAlumno from 'alumnos/alumno.interface';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  MaxLength,
  MinLength,
  IsNumber,
  Min,
  ValidateNested,
  IsDate,
} from 'class-validator';
import IPlanillaTaller from 'planillaTaller/planillaTaller.interface';

class CrearSeguimientoAlumnoDto {
  @ValidateNested() alumno: IAlumno;
  @ValidateNested() planillaTaller: IPlanillaTaller;
  @IsDate() fecha: Date;
  @IsString({
    message: 'El tipo de seguimiento no ha sido ingresado',
  })
  @MinLength(7, {
    message: 'El tipo de seguimiento es muy corto',
  })
  @MaxLength(100, {
    message: 'El tipo de seguimiento no puede superar los 100 caracteres',
  })
  tipoSeguimiento: string;
  @IsNumber()
  @Min(0, { message: 'El ciclo lectivo tiene que ser mayor a 0' })
  cicloLectivo: number;
  @IsBoolean()
  resuelto: boolean;
  @IsString({
    message: 'La observacion no ha sido ingresada',
  })
  @MinLength(7, {
    message: 'La observacion es muy corta',
  })
  @MaxLength(100, {
    message: 'La observacion no puede superar los 100 caracteres',
  })
  observacion: string;
  @IsString({
    message: 'La observacion 2 no ha sido ingresada',
  })
  @MinLength(7, {
    message: 'La observacion 2 es muy corta',
  })
  @MaxLength(100, {
    message: 'La observacion 2 no puede superar los 100 caracteres',
  })
  observacion2: string;
  @IsString({
    message: 'La observacion del jefe de taller no ha sido ingresado',
  })
  @MinLength(7, {
    message: 'La observacion del jefe de taller  es muy corto',
  })
  @MaxLength(100, {
    message: 'La observacion del jefe de taller no puede superar los 100 caracteres',
  })
  observacionJefe: string;

  @IsOptional()
  @IsDate()
  fechaCreacion: string;
  @IsDate()
  @IsOptional()
  fechaModificacion?: string;

  @IsBoolean()
  activo: boolean;
}

export default CrearSeguimientoAlumnoDto;
