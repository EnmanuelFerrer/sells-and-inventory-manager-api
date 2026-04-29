import { Controller, Post, Body, Param, Get, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from '../common/schemas/product.schema';
import { ParseMongoIdsPipe } from '../common/pipes/parse-mongo-ids.pipe';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';
import { IPagination } from '../common/interfaces/pagination.interface';

@Controller('users/:userId/brands/:brandId/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async create(
    @Param('userId', ParseMongoIdsPipe) userId: string,
    @Param('brandId', ParseMongoIdsPipe) brandId: string,
    @Body() createProductDto: CreateProductDto,
  ): Promise<Product> {
    return await this.productsService.create(userId, brandId, createProductDto);
  }

  @Get()
  async find(
    @Param('userId', ParseMongoIdsPipe) userId: string,
    @Query() paginationQueryDto: PaginationQueryDto,
  ): Promise<IPagination<Product>> {
    return await this.productsService.find(
      {
        user: userId,
      },
      {},
      {},
      paginationQueryDto,
    );
  }

  @Get(':productId')
  async findOne(
    @Param('userId', ParseMongoIdsPipe) userId: string,
    @Param('brandId', ParseMongoIdsPipe) brandId: string,
    @Param('productId', ParseMongoIdsPipe) productId: string,
  ): Promise<Product> {
    return await this.productsService.findOne(
      {
        _id: productId,
        'brand._id': brandId,
        users: {
          $elemMatch: { $eq: userId },
        },
      },
      {},
      {},
    );
  }
}
