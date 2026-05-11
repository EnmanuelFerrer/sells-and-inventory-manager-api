import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsPositive, IsString } from 'class-validator';

export class AddProductDto {
  @IsString()
  @IsMongoId()
  productId: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity: number;
}
