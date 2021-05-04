// import { IsNumber, Min, Max } from 'class-validator';
import pkg from 'class-validator';
const { IsNumber, Min, Max} = pkg;
class CrearCiclolectivoDto {
  @IsNumber()
  @Min(0, { message: 'El ciclo lectivo tiene que ser mayor a 0' })
  anio: number;
}

export default CrearCiclolectivoDto;
