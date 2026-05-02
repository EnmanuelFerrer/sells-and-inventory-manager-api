import { Module } from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';
import { PuppeteerModule } from '../puppeteer/puppeteer.module';

@Module({
  imports: [PuppeteerModule],
  providers: [ExchangeRatesService],
  exports: [ExchangeRatesService],
})
export class ExchangeRatesModule {}
