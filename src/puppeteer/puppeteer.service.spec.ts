import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { PuppeteerService } from './puppeteer.service';
import * as puppeteer from 'puppeteer';

jest.mock('puppeteer', () => ({
  launch: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

describe('PuppeteerService', () => {
  let service: PuppeteerService;
  let mockBrowser: {
    newPage: jest.Mock;
    pages: jest.Mock;
    close: jest.Mock;
  };
  let mockPage: {
    setViewport: jest.Mock;
    goto: jest.Mock;
    screenshot: jest.Mock;
    evaluate: jest.Mock;
    close: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPage = {
      setViewport: jest.fn().mockResolvedValue(undefined),
      goto: jest.fn().mockResolvedValue(undefined),
      screenshot: jest.fn().mockResolvedValue(undefined),
      evaluate: jest.fn().mockResolvedValue(499.8608),
      close: jest.fn().mockResolvedValue(undefined),
    };

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      pages: jest.fn().mockResolvedValue([mockPage]),
      close: jest.fn().mockResolvedValue(undefined),
    };

    (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);

    const module: TestingModule = await Test.createTestingModule({
      providers: [PuppeteerService],
    }).compile();

    service = module.get<PuppeteerService>(PuppeteerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initializeBrowser', () => {
    it('should initialize the browser', async () => {
      await service.initializeBrowser();

      expect(puppeteer.launch).toHaveBeenCalledWith({ headless: false });
    });
  });

  describe('newPage', () => {
    it('should create a new page', async () => {
      await service.initializeBrowser();
      const page = await service.newPage();

      expect(mockBrowser.newPage).toHaveBeenCalled();
      expect(page).toBeDefined();
    });
  });

  describe('screenshot', () => {
    it('should throw InternalServerErrorException when browser is not initialized', async () => {
      await expect(
        service.screenshot('https://example.com', 'screenshots'),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should take a screenshot successfully', async () => {
      await service.initializeBrowser();

      await service.screenshot('https://example.com', 'screenshots', true, {
        height: 700,
        width: 1080,
      });

      expect(mockPage.setViewport).toHaveBeenCalledWith({
        height: 700,
        width: 1080,
      });
      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com');
      expect(mockPage.screenshot).toHaveBeenCalled();
      expect(mockPage.close).toHaveBeenCalled();
    });

    it('should use default viewport when not provided', async () => {
      await service.initializeBrowser();

      await service.screenshot('https://example.com', 'screenshots');

      expect(mockPage.setViewport).toHaveBeenCalledWith({
        width: 640,
        height: 480,
      });
    });
  });

  describe('getDataFrom', () => {
    it('should throw InternalServerErrorException when browser is not initialized', async () => {
      await expect(
        service.getDataFrom('https://example.com', () => 499.8608),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should get data from URL successfully', async () => {
      await service.initializeBrowser();

      const result = await service.getDataFrom(
        'https://example.com',
        () => 499.8608,
        true,
      );

      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com');
      expect(mockPage.evaluate).toHaveBeenCalled();
      expect(mockPage.close).toHaveBeenCalled();
      expect(result).toBe(499.8608);
    });

    it('should not close page when closePage is false', async () => {
      await service.initializeBrowser();

      await service.getDataFrom('https://example.com', () => 499.8608, false);

      expect(mockPage.close).not.toHaveBeenCalled();
    });
  });

  describe('closeBrowser', () => {
    it('should close the browser', async () => {
      await service.initializeBrowser();

      await service.closeBrowser();

      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });
});
