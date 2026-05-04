import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PuppeteerService } from '../puppeteer/puppeteer.service';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ExchangeRatesService implements OnModuleInit {
  private readonly logger = new Logger(ExchangeRatesService.name);

  constructor(
    private readonly puppeteerService: PuppeteerService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.logger.debug('Executing module initialization tasks.');
    await this.getBolivarExchangeRate();
    this.logger.debug('Initialization tasks completed.');
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async handleCron() {
    this.logger.debug(
      'Daily cronological task started: Getting VES exchange rate for Dollar.',
    );
    await this.getBolivarExchangeRate();
  }

  async getBolivarExchangeRate(): Promise<number> {
    this.logger.debug(
      'About to perform scrapping on Banco Central de Venezuela website to get the exchange rate of VES for USD.',
    );
    await this.puppeteerService.initializeBrowser();
    const exchangeRate: number =
      await this.puppeteerService.getDataFrom<number>(
        this.configService.getOrThrow<string>('CENTRAL_BANK_OF_VENEZUELA_URL'),
        () => {
          const HTMLCollection = document
            .querySelector('#dolar')
            ?.getElementsByClassName('col-sm-6 col-xs-6 centrado')?.[0];
          const HTMLCollectionText = HTMLCollection?.textContent?.trim();
          const exchangeRateText = HTMLCollectionText;
          const exchangeRate = Number(exchangeRateText?.replace(',', '.'));
          return exchangeRate;
        },
      );
    await this.puppeteerService.closeBrowser();
    this.logger.debug('Exchange rate of VES for USD obtained.');
    return exchangeRate;
  }
}
