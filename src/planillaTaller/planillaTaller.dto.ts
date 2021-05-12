import IAsignatura from '../asignaturas/asignatura.interface';
import { IsString, IsOptional, IsBoolean, IsDateString, MaxLength, MinLength, ValidateNested, IsNumber } from 'class-validator';
import IProfesor from '../profesores/profesor.interface';
import ICurso from '../cursos/curso.interface';
import ICicloLectivo from '../ciclolectivos/ciclolectivo.interface';

class CrearPlanillaTallerDto {
  @ValidateNested()
  asignaturaId: IAsignatura;
  @ValidateNested()
  profesorId: IProfesor;
  @ValidateNested()
  @IsOptional()
  curso: ICurso;
  @ValidateNested()
  @IsOptional()
  cicloLectivo: ICicloLectivo;
  @IsDateString()
  fechaInicio: Date;
  @IsDateString()
  fechaFinalizacion: Date;
  @IsString({ message: 'La observación no ha sido ingresado' })
  @MinLength(7, {
    message: 'La observación es muy corto',
  })
  @MaxLength(100, {
    message: 'La observación no puede superar los 100 caracteres',
  })
  observacion: string;
  @IsString({ message: 'El bimestre no ha sido ingresado' })
  @MinLength(4, {
    message: 'El bimestre es muy corto',
  })
  @MaxLength(100, {
    message: 'El bimestre no puede superar los 100 caracteres',
  })
  bimestre: string;
  @IsString({ message: 'El tipo de calendario no ha sido ingresado' })
  @IsOptional()
  tipoCalendario?: string;
  @IsString({ message: 'El turno no ha sido ingresado' })
  @MinLength(4, {
    message: 'El turno es muy corto',
  })
  @MaxLength(100, {
    message: 'El turno no puede superar los 100 caracteres',
  })
  @IsOptional()
  turno: string;
  @IsOptional()
  @IsDateString()
  fechaCreacion: string;
  @IsDateString()
  @IsOptional()
  fechaModificacion?: string;

  @IsBoolean()
  activo: boolean;
}

export default CrearPlanillaTallerDto;
