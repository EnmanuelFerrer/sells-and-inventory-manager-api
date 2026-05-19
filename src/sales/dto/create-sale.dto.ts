import { IsEnum, IsMongoId, IsString } from 'class-validator';
import { SaleStatusesEnum } from '../../common/enums/sale-statuses.enum';
import { Transform } from 'class-transformer';

export class CreateSaleDto {
  @IsMongoId()
  orderId: string;

  @Transform(({ value }) => {
    if (typeof value !== 'string') return false;
    return value.toLocaleLowerCase();
  })
  @IsString()
  @IsEnum(SaleStatusesEnum)
  status: SaleStatusesEnum;
}
