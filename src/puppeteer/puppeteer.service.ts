import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

@Injectable()
export class PuppeteerService {
  private readonly logger = new Logger(PuppeteerService.name);
  private browser: puppeteer.Browser;

  async initializeBrowser() {
    this.logger.debug('Initializing Puppeteer browser.');
    this.browser = await puppeteer.launch({ headless: false });
    this.logger.debug('Puppeteer browser initialized.');
  }

  async newPage() {
    this.logger.debug('Creating new Puppeteer browser page.');
    const page = await this.browser.newPage();
    this.logger.debug('Puppeteer browser page created.');
    return page;
  }

  async screenshot(url: string, dir: string) {
    if (!this.browser) {
      this.logger.error('Puppeteer browser must be initialized.');
      throw new InternalServerErrorException(
        'Puppeteer browser initialization error.',
      );
    }
    this.logger.debug(`Taking screenshot of website: ${url}.`);
    await fs.mkdir(dir, { recursive: true });
    const screenshotFilePath = path.join(dir, `screenshot-${Date.now()}.png`);
    const page = await this.newPage();
    await page.goto(url);
    await page.screenshot({
      path: screenshotFilePath,
      captureBeyondViewport: true,
    });
    await page.close();
    this.logger.debug(
      `Screenshot taken successfully and saved in ${screenshotFilePath}.`,
    );
  }

  async getDataFrom<T>(url: string, gotoCode: () => T): Promise<T> {
    if (!this.browser) {
      this.logger.error('Puppeteer browser must be initialized.');
      throw new InternalServerErrorException(
        'Puppeteer browser initialization error.',
      );
    }
    this.logger.debug(`About to get data from website: ${url}.`);
    const page = await this.newPage();
    await this.newPage();
    await page.goto(url);
    const result = await page.evaluate(gotoCode);
    await page.close();
    this.logger.debug('Data obtained successfully.');
    return result;
  }

  async closeBrowser() {
    this.logger.debug('Closing Puppeteer browser.');
    await this.browser.close();
    this.logger.debug('Puppeteer browser closed.');
  }
}
