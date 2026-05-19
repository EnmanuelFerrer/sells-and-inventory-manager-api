import { Module } from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';
import { ExchangeRatesController } from './exchange-rates.controller';
import { PuppeteerModule } from '../puppeteer/puppeteer.module';
import { ExchangeRatesRepositoryService } from './repositories/exchange-rates-repository.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ExchangeRate,
  ExchangeRateSchema,
} from '../common/schemas/exchange-rate.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExchangeRate.name, schema: ExchangeRateSchema },
    ]),

    PuppeteerModule,
  ],
  controllers: [ExchangeRatesController],
  providers: [ExchangeRatesService, ExchangeRatesRepositoryService],
  exports: [ExchangeRatesService],
})
export class ExchangeRatesModule {}
