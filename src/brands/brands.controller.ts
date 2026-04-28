import { Controller, Post, Body, Param, Get, Query } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { Brand } from '../common/schemas/brand.schema';
import { ParseMongoIdsPipe } from '../common/pipes/parse-mongo-ids.pipe';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';
import { IPagination } from '../common/interfaces/pagination.interface';

@Controller('users/:userId/brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  async create(
    @Param('userId', ParseMongoIdsPipe) userId: string,
    @Body() createBrandDto: CreateBrandDto,
  ): Promise<Brand> {
    return await this.brandsService.create(userId, createBrandDto);
  }

  @Get()
  async findAll(
    @Param('userId', ParseMongoIdsPipe) userId: string,
    @Query() paginationQueryDto: PaginationQueryDto,
  ): Promise<IPagination<Brand>> {
    return await this.brandsService.findAll(
      {
        users: {
          $elemMatch: { $eq: userId },
        },
      },
      {},
      {},
      paginationQueryDto,
    );
  }

  @Get(':brandId')
  async findOne(
    @Param('userId', ParseMongoIdsPipe) userId: string,
    @Param('brandId', ParseMongoIdsPipe) brandId: string,
  ): Promise<Brand> {
    return await this.brandsService.findOne(
      {
        _id: brandId,
        users: {
          $elemMatch: { $eq: userId },
        },
      },
      {},
      {},
    );
  }
}
