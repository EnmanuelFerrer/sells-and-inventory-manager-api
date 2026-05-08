import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';
import { ExchangeRatesRepositoryService } from './repositories/exchange-rates-repository.service';
import { PuppeteerService } from '../puppeteer/puppeteer.service';
import { ConfigService } from '@nestjs/config';
import { ExchangeRate } from '../common/schemas/exchange-rate.schema';
import { CurrenciesEnum } from '../common/enums/currencies.enum';
import { Types } from 'mongoose';

describe('ExchangeRatesService', () => {
  let service: ExchangeRatesService;
  let mockExchangeRatesRepository: {
    create: jest.Mock;
    findOne: jest.Mock;
    exists: jest.Mock;
  };
  let mockPuppeteerService: {
    initializeBrowser: jest.Mock;
    getDataFrom: jest.Mock;
    screenshot: jest.Mock;
    closeBrowser: jest.Mock;
  };
  let mockConfigService: {
    getOrThrow: jest.Mock;
  };

  const mockExchangeRate: ExchangeRate = {
    _id: new Types.ObjectId(),
    currency: CurrenciesEnum.USD,
    amount: 499.8608,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockExchangeRatesRepository = {
      create: jest.fn().mockResolvedValue(mockExchangeRate),
      findOne: jest.fn().mockResolvedValue(mockExchangeRate),
      exists: jest.fn().mockResolvedValue(false),
    };

    mockPuppeteerService = {
      initializeBrowser: jest.fn().mockResolvedValue(undefined),
      getDataFrom: jest.fn().mockResolvedValue(499.8608),
      screenshot: jest.fn().mockResolvedValue(undefined),
      closeBrowser: jest.fn().mockResolvedValue(undefined),
    };

    mockConfigService = {
      getOrThrow: jest.fn().mockReturnValue('https://example.com'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeRatesService,
        {
          provide: ExchangeRatesRepositoryService,
          useValue: mockExchangeRatesRepository,
        },
        {
          provide: PuppeteerService,
          useValue: mockPuppeteerService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ExchangeRatesService>(ExchangeRatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveExchangeRate', () => {
    it('should save exchange rate when it does not exist', async () => {
      mockExchangeRatesRepository.exists.mockResolvedValue(false);

      await service.saveExchangeRate(CurrenciesEnum.USD, 499.8608);

      expect(mockExchangeRatesRepository.exists).toHaveBeenCalledWith({
        currency: CurrenciesEnum.USD,
        amount: 499.8608,
      });
      expect(mockExchangeRatesRepository.create).toHaveBeenCalledWith({
        currency: CurrenciesEnum.USD,
        amount: 499.8608,
      });
    });

    it('should not save exchange rate when it already exists', async () => {
      mockExchangeRatesRepository.exists.mockResolvedValue(true);

      await service.saveExchangeRate(CurrenciesEnum.USD, 499.8608);

      expect(mockExchangeRatesRepository.exists).toHaveBeenCalledWith({
        currency: CurrenciesEnum.USD,
        amount: 499.8608,
      });
      expect(mockExchangeRatesRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findLast', () => {
    it('should return the last exchange rate for a currency', async () => {
      const result = await service.findLast(CurrenciesEnum.USD);

      expect(mockExchangeRatesRepository.findOne).toHaveBeenCalledWith(
        { currency: CurrenciesEnum.USD },
        {},
        { sort: { createdAt: -1 } },
      );
      expect(result).toEqual(mockExchangeRate);
    });

    it('should throw NotFoundException when no exchange rate is found', async () => {
      mockExchangeRatesRepository.findOne.mockResolvedValue(null);

      await expect(service.findLast(CurrenciesEnum.USD)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getDollarExchangeRate', () => {
    it('should fetch and save the dollar exchange rate', async () => {
      mockExchangeRatesRepository.exists.mockResolvedValue(false);

      await service.getDollarExchangeRate();

      expect(mockPuppeteerService.initializeBrowser).toHaveBeenCalled();
      expect(mockPuppeteerService.getDataFrom).toHaveBeenCalled();
      expect(mockPuppeteerService.screenshot).toHaveBeenCalled();
      expect(mockPuppeteerService.closeBrowser).toHaveBeenCalled();
      expect(mockExchangeRatesRepository.create).toHaveBeenCalledWith({
        currency: CurrenciesEnum.USD,
        amount: 499.8608,
      });
    });
  });
});
