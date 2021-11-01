import { IsString, IsOptional, IsBoolean, IsDateString, MaxLength, MinLength, ValidateNested, Min, IsNumber } from 'class-validator';
import IPlanillaTaller from '../planillaTaller/planillaTaller.interface';

class CrearTemaDto {
  @ValidateNested()
  planillaTaller: IPlanillaTaller;
  @IsDateString()
  fecha: Date;
  @IsString({ message: 'El tema del día no fue ingresado' })
  @MinLength(4, {
    message: 'El tema del día debe contener al menos 4 caracteres',
  })
  @MaxLength(300, {
    message: 'El tema del día debe contener 300 caracteres máximo',
  })
  temaDelDia: string;
  @IsString({ message: 'El tipo de desarrollo no fue ingresado' })
  @MinLength(4, {
    message: 'El tipo de desarrollo debe contener al menos 4 caracteres',
  })
  @MaxLength(300, {
    message: 'El tipo de desarrollo debe contener 300 caracteres máximo',
  })
  tipoDesarrollo: string;
  @IsString({ message: 'La proxima clase no fue ingresada' })
  @MinLength(4, {
    message: 'La proxima clase debe contener al menos 4 caracteres',
  })
  @MaxLength(300, {
    message: 'La proxima clase debe contener 300 caracteres máximo',
  })
  temasProximaClase: string;
  @IsNumber(
    { allowNaN: false },
    {
      message: 'El nro de clase debe ser numerico',
    }
  )
  @Min(0, { message: 'El Nro de clase no puede ser menor a 0' })
  nroClase: number;
  @Min(0, { message: 'La unidad no puede ser menor a 0' })
  @IsNumber(
    { allowNaN: false },
    {
      message: 'La unidad debe ser numerico',
    }
  )
  unidad: number;
  @IsString({
    message: 'El caracter de la clase de taller no ha sido ingresado',
  })
  @MinLength(7, {
    message: 'El caracter de la clase de taller  es muy corto',
  })
  @MaxLength(300, {
    message: 'El caracter de la clase no puede superar los 300 caracteres',
  })
  caracterClase: string;
  @IsString({
    message: 'La observacion del jefe de taller no ha sido ingresado',
  })
  @MinLength(4, {
    message: 'La observacion del jefe de taller  es muy corto',
  })
  @MaxLength(300, {
    message: 'La observacion del jefe de taller no puede superar los 300 caracteres',
  })
  observacionJefe: string;

  @IsOptional()
  @IsDateString()
  fechaCreacion: string;
  @IsDateString()
  @IsOptional()
  fechaModificacion?: string;

  @IsBoolean()
  activo: boolean;
}

export default CrearTemaDto;
