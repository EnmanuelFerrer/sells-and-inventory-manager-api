import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../common/schemas/product.schema';
import { UsersModule } from '../users/users.module';
import { BrandsModule } from '../brands/brands.module';
import { ProductRepositoryService } from './repositories/product-repository.service';
import { ExchangeRatesModule } from '../exchange-rates/exchange-rates.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),

    UsersModule,
    BrandsModule,
    ExchangeRatesModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductRepositoryService],
  exports: [ProductsService],
})
export class ProductsModule {}
