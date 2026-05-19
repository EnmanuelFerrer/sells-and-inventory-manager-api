import { Type } from 'class-transformer';
import { IsInt, IsPositive, Min } from 'class-validator';

export class ModifyStockDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsPositive()
  quantity: number;
}
