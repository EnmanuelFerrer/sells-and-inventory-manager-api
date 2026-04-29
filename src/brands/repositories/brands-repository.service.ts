import { InjectModel } from '@nestjs/mongoose';
import { RepositoryService } from '../../common/repository/repository.service';
import { Brand, BrandDocument } from '../../common/schemas/brand.schema';
import { Model } from 'mongoose';

export class BrandsRepositoryService extends RepositoryService<BrandDocument> {
  constructor(
    @InjectModel(Brand.name) private readonly brandModel: Model<BrandDocument>,
  ) {
    super(brandModel);
  }
}
