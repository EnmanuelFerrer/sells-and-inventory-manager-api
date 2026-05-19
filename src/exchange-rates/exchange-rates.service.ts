import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PuppeteerService } from '../puppeteer/puppeteer.service';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExchangeRatesRepositoryService } from './repositories/exchange-rates-repository.service';
import { CurrenciesEnum } from '../common/enums/currencies.enum';
import { ExchangeRate } from '../common/schemas/exchange-rate.schema';

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
    await this.getDollarExchangeRate();
    this.logger.debug('Initialization tasks completed.');
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async handleCron() {
    this.logger.debug('Daily tasks for 10:00 A.M. started.');
    await this.getDollarExchangeRate();
    this.logger.debug('Daily tasks executed.');
  }

  async getDollarExchangeRate(): Promise<void> {
    this.logger.debug('Getting USD exchange rate.');
    await this.puppeteerService.initializeBrowser();
    const url = this.configService.getOrThrow<string>(
      'CENTRAL_BANK_OF_VENEZUELA_URL',
    );
    const exchangeRate: number | undefined =
      await this.puppeteerService.getDataFrom<number | undefined>(
        url,
        () => {
          const HTMLCollection = document
            .querySelector('#dolar')
            ?.getElementsByClassName('col-sm-6 col-xs-6 centrado')?.[0];
          const HTMLCollectionText = HTMLCollection?.textContent?.trim();
          const exchangeRateText = HTMLCollectionText;
          const exchangeRate = Number(exchangeRateText?.replace(',', '.'));
          if (Number.isNaN(exchangeRate)) {
            return undefined;
          }
          return exchangeRate;
        },
        false,
      );
    if (exchangeRate === undefined) {
      this.logger.error(
        'Failed to obtain USD exchange rate: HTML tag not found.',
      );
      await this.puppeteerService.closeBrowser();
      return;
    }
    this.logger.debug('USD exchange rate obtained.');
    await this.puppeteerService.screenshot(url, 'screenshots', true, {
      height: 700,
      width: 1080,
    });
    await this.puppeteerService.closeBrowser();
    await this.saveExchangeRate(CurrenciesEnum.USD, exchangeRate);
  }

  async saveExchangeRate(
    currency: CurrenciesEnum,
    amount: number,
  ): Promise<void> {
    this.logger.debug(`Saving ${currency} exchange rate.`);
    const exists = await this.exchangeRatesRepository.exists({
      currency,
      amount,
    });
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

  async findLast(currency: CurrenciesEnum): Promise<ExchangeRate> {
    this.logger.debug(`Finding last registered ${currency} exchange rate.`);
    const exchangeRate = await this.exchangeRatesRepository.findOne(
      { currency },
      {},
      { sort: { createdAt: -1 } },
    );
    if (!exchangeRate) {
      this.logger.debug(`Exchange rate not found for currency: ${currency}.`);
      throw new NotFoundException(`Exchange rate not found.`);
    }
    return exchangeRate;
  }
}
