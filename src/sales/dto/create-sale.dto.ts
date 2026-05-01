import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsMongoId,
  IsNumber,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

class SaleProductDto {
  @IsString()
  @IsMongoId()
  productId: string;

  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class CreateSaleDto {
  @IsDefined()
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => SaleProductDto)
  @ValidateNested({ each: true })
  saleProducts: SaleProductDto[];
}
