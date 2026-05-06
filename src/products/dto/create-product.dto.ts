import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { CurrenciesEnum } from '../../common/enums/currencies.enum';
import { Transform } from 'class-transformer';

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

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return false;
    return value.toLocaleLowerCase();
  })
  @IsEnum(CurrenciesEnum)
  currency?: CurrenciesEnum;
}
