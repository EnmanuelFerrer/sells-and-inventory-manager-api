import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsString, Min, IsPositive } from 'class-validator';

export class RemoveProductDto {
  @IsString()
  @IsMongoId()
  productId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsPositive()
  quantity: number;
}
