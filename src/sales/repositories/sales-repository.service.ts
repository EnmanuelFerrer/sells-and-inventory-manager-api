import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { RepositoryService } from '../../common/repository/repository.service';
import { Sale, SaleDocument } from '../../common/schemas/sale.schema';
import { Model } from 'mongoose';

@Injectable()
export class SalesRepositoryService extends RepositoryService<SaleDocument> {
  constructor(
    @InjectModel(Sale.name)
    private readonly saleModel: Model<SaleDocument>,
  ) {
    super(saleModel);
  }
}
