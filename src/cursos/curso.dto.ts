 import { IsString, IsOptional, IsBoolean, IsDateString, MaxLength, MinLength, IsNumber, Min, ValidateNested } from 'class-validator';

class CrearCursoDto {
  @IsString({ message: 'La comision no ha sido ingresada' })
  @MinLength(1, {
    message: 'La comision es muy corto',
  })
  @MaxLength(2, {
    message: 'La comision no puede superar los 100 caracteres',
  })
  comision: string;
  // @IsNumber()
  // cicloLectivo: number;
  @IsNumber()
  @Min(0, { message: 'El curso tiene que ser mayor a 0' })
  curso: number;
  @IsNumber()
  @Min(0, { message: 'La division tiene que ser mayor a 0' })
  division: number;

  @IsOptional()
  @IsDateString()
  fechaCreacion: string;
  @IsDateString()
  @IsOptional()
  fechaModificacion?: string;

  @IsBoolean()
  activo: boolean;
}

export default CrearCursoDto;
