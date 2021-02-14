import { IsNumber, Min, Max } from 'class-validator';

class CrearCiclolectivoDto {
  @IsNumber()
  @Min(0, { message: 'El ciclo lectivo tiene que ser mayor a 0' })
  anio: number;
}

export default CrearCiclolectivoDto;
