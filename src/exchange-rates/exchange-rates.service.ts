import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PuppeteerService } from '../puppeteer/puppeteer.service';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExchangeRatesRepositoryService } from './repositories/exchange-rates-repository.service';
import { CurrenciesEnum } from '../common/enums/currencies.enum';

@Injectable()
export class ExchangeRatesService implements OnModuleInit {
  private readonly logger = new Logger(ExchangeRatesService.name);

  constructor(
    private readonly exchangeRatesRepository: ExchangeRatesRepositoryService,

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

  async getBolivarExchangeRate(): Promise<void> {
    this.logger.debug(
      'About to perform scrapping on Banco Central de Venezuela website to get the exchange rate of VES for USD.',
    );
    await this.puppeteerService.initializeBrowser();
    const url = this.configService.getOrThrow<string>(
      'CENTRAL_BANK_OF_VENEZUELA_URL',
    );
    const exchangeRate: number =
      await this.puppeteerService.getDataFrom<number>(
        url,
        () => {
          const HTMLCollection = document
            .querySelector('#dolar')
            ?.getElementsByClassName('col-sm-6 col-xs-6 centrado')?.[0];
          const HTMLCollectionText = HTMLCollection?.textContent?.trim();
          const exchangeRateText = HTMLCollectionText;
          const exchangeRate = Number(exchangeRateText?.replace(',', '.'));
          return exchangeRate;
        },
        false,
      );
    this.logger.debug('Exchange rate of VES for USD obtained.');
    await this.puppeteerService.screenshot(url, 'screenshots', true);
    await this.puppeteerService.closeBrowser();
    await this.saveExchangeRate(CurrenciesEnum.VES, exchangeRate);
  }

  async saveExchangeRate(
    currency: CurrenciesEnum,
    amount: number,
  ): Promise<void> {
    this.logger.debug(`Saving exchange rate for currency: ${currency}.`);
    const exists = await this.exchangeRatesRepository.exists({ amount });
    if (exists) {
      this.logger.debug(
        'Exchange rate saving aborted because it currently exists.',
      );
      return;
    }
    await this.exchangeRatesRepository.create({
      currency,
      amount,
    });
    this.logger.debug('Exchange rate saved.');
  }
}
