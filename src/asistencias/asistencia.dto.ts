import IAlumno from 'alumnos/alumno.interface';
// import { IsString, IsOptional, IsBoolean, IsDateString, MaxLength, MinLength, ValidateNested, Min, IsNumber } from 'class-validator';
import IPlanillaTaller from '../planillaTaller/planillaTaller.interface';
import pkg from 'class-validator';
const { IsString, IsOptional, IsBoolean, IsDateString, MaxLength, MinLength, ValidateNested, Min, IsNumber } = pkg;
class CrearAsistenciaDto {
  @ValidateNested()
  planillaTaller: IPlanillaTaller;
  @ValidateNested()
  alumno: IAlumno;
  @IsDateString()
  fecha: Date;
  @IsBoolean()
  presente: boolean;
  @IsBoolean()
  llegoTarde: boolean;

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
