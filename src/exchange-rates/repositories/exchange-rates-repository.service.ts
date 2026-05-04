import { Injectable } from '@nestjs/common';
import { RepositoryService } from '../../common/repository/repository.service';
import {
  ExchangeRate,
  ExchangeRateDocument,
} from '../../common/schemas/exchange-rate.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ExchangeRatesRepositoryService extends RepositoryService<ExchangeRateDocument> {
  constructor(
    @InjectModel(ExchangeRate.name)
    private readonly exchangeRateModel: Model<ExchangeRateDocument>,
  ) {
    super(exchangeRateModel);
  }
}
