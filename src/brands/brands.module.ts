import { Module } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Brand, BrandSchema } from '../common/schemas/brand.schema';
import { UsersModule } from '../users/users.module';
import { BrandsRepositoryService } from './repositories/brands-repository.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Brand.name, schema: BrandSchema }]),

    UsersModule,
  ],
  controllers: [BrandsController],
  providers: [BrandsService, BrandsRepositoryService],
  exports: [BrandsService],
})
export class BrandsModule {}
