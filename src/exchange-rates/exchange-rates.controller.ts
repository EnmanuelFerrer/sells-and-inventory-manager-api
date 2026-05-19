import { Controller, Post } from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';
import { ExchangeRate } from '../common/schemas/exchange-rate.schema';
import { CurrenciesEnum } from '../common/enums/currencies.enum';

@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  @Post('update')
  async updateExchangeRate(): Promise<ExchangeRate> {
    await this.exchangeRatesService.getDollarExchangeRate();
    return await this.exchangeRatesService.findLast(CurrenciesEnum.USD);
  }
}
