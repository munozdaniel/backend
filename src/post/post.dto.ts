// import { IsString } from 'class-validator';
import pkg from 'class-validator';
const { IsString } = pkg;
class CreatePostDto {
  @IsString()
  public content!: string;

  @IsString()
  public title!: string;
}

export default CreatePostDto;
