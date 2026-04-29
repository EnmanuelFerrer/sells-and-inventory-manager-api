import { IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @Length(3, 20)
  name: string;

  @IsNumber()
  @Min(0)
  cost: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  gain?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}
