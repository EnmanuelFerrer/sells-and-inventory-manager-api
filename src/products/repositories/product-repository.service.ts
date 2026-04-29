import { Injectable } from '@nestjs/common';
import { RepositoryService } from '../../common/repository/repository.service';
import { Product, ProductDocument } from '../../common/schemas/product.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ProductRepositoryService extends RepositoryService<ProductDocument> {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {
    super(productModel);
  }
}
