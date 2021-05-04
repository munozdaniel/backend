// import { IsString } from 'class-validator';
import pkg from 'class-validator';
const { IsString } = pkg;
class LogInDto {
  @IsString()
  public email: string;

  @IsString()
  public password: string;
}

export default LogInDto;
