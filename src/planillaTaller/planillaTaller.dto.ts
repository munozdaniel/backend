import IAsignatura from "../asignaturas/asignatura.interface";
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import IComision from "../comisiones/comision.interface";
import IProfesor from "../profesores/profesor.interface";

class CrearPlanillaTallerDto {
  @ValidateNested()
  asignaturaId: IAsignatura;
  @ValidateNested()
  profesorId: IProfesor;
  @ValidateNested()
  comision: IComision;
  @IsDateString()
  fechaInicio: Date;
  @IsDateString()
  fechaFinalizacion: Date;
  @IsString({ message: "La observación no ha sido ingresado" })
  @MinLength(7, {
    message: "La observación es muy corto",
  })
  @MaxLength(100, {
    message: "La observación no puede superar los 100 caracteres",
  })
  observacion: string;
  @IsString({ message: "El bimestre no ha sido ingresado" })
  @MinLength(4, {
    message: "El bimestre es muy corto",
  })
  @MaxLength(100, {
    message: "El bimestre no puede superar los 100 caracteres",
  })
  bimestre: string;


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