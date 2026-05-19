import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsPositive, IsString, Min } from 'class-validator';

export class AddProductDto {
  @IsString()
  @IsMongoId()
  productId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsPositive()
  quantity: number;
}
