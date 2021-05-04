// import { ArrayMaxSize, ArrayMinSize, IsBoolean, IsDateString, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { rolesEnum } from '../utils/roles.enum';
import pkg from 'class-validator';
const { ArrayMaxSize, ArrayMinSize, IsBoolean, IsDateString, IsNumber, IsOptional, IsString, ValidateNested  } = pkg;
class UsuarioDto {
  @IsString({ message: 'El email es requerido' })
  email: string;
  @IsString({ message: 'El password es requerido' })
  password: string;
  @IsString({ message: 'El nombre es requerido' })
  nombre: string;
  @IsString({ message: 'El apellido es requerido' })
  apellido: string;
  @IsOptional()
  @IsString({ message: 'El telefono es requerido' })
  telefono: string;
  @IsOptional()
  @IsString()
  rol: rolesEnum;
  @IsOptional()
  @IsString()
  identificacion?: string; // dni
  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;
  // tipo_identificacion:string;

  @IsBoolean()
  @IsOptional()
  perfilCompleto: boolean; // Controla qeu todos los campos requeridos para una compra sean cargados

  @IsString()
  @IsOptional()
  observacion?: string; // Agregado por el dueño del comercio
  @IsString()
  @IsOptional()
  totalGastado: string;
  @IsNumber()
  @IsOptional()
  ultimaCompra?: number; // id de la ultima orden
  @IsOptional()
  @IsBoolean()
  public tarjetaGuardada?: boolean;

  @IsOptional()
  @IsDateString({ message: 'La fecha de creacion tiene que ser un string' })
  fechaCreacion: string;
  @IsOptional()
  @IsString({ message: 'El id del usuario creador tiene que ser un string' })
  usuarioCreacion: string; // ObjectId string

  @IsDateString({ message: 'La fecha de modificacion tiene que ser un string' })
  @IsOptional()
  fechaModificacion?: string;
  @IsString({ message: 'El id del usuario modificador tiene que ser un string' })
  @IsOptional()
  usuarioModificacion?: string;
  @IsBoolean({ message: 'Activo debe ser un booleano' })
  activo: boolean;
}

export default UsuarioDto;
