import { IsString, Length } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @Length(3, 20)
  name: string;
}
