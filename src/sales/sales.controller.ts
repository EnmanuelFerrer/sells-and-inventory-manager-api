import { Controller, Post, Body, Param, Get, Query } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { ParseMongoIdsPipe } from '../common/pipes/parse-mongo-ids.pipe';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';

@Controller('users/:userId/sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  async create(
    @Param('userId', ParseMongoIdsPipe) userId: string,
    @Body() createSaleDto: CreateSaleDto,
  ) {
    return await this.salesService.create(userId, createSaleDto);
  }

  @Get()
  async find(
    @Param('userId', ParseMongoIdsPipe) userId: string,
    @Query() paginationQueryDto: PaginationQueryDto,
  ) {
    return await this.salesService.find(
      { user: userId },
      {},
      {},
      paginationQueryDto,
    );
  }

  @Get(':saleId')
  async findOne(
    @Param('userId', ParseMongoIdsPipe) userId: string,
    @Param('saleId', ParseMongoIdsPipe) saleId: string,
  ) {
    return await this.salesService.findOne({ _id: saleId, user: userId });
  }
}
