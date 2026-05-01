import { Controller, Post, Body, Param } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { ParseMongoIdsPipe } from '../common/pipes/parse-mongo-ids.pipe';

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
}
