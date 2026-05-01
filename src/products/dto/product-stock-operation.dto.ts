import { IsEnum, IsInt, IsNumber, IsPositive, IsString } from 'class-validator';
import { ProductStockOperationsEnum } from '../../common/enums/product-stock-operations.enum';
import { Transform, Type } from 'class-transformer';

export class ProductStockOperationDto {
  @IsString()
  @Transform(({ value }) => (value as string).toLowerCase())
  @IsEnum(ProductStockOperationsEnum)
  operation: ProductStockOperationsEnum;

  @IsNumber()
  @Type(() => Number)
  @IsPositive()
  @IsInt()
  quantity: number;
}
