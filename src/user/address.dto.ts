// import { IsString } from 'class-validator';
import pkg from 'class-validator';
const { IsString  } = pkg;
class CreateAddressDto {
  @IsString()
  public street!: string;
  @IsString()
  public city!: string;
  @IsString()
  public country!: string;
}

export default CreateAddressDto;
