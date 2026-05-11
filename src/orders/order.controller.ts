import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ParseMongoIdsPipe } from '../common/pipes/parse-mongo-ids.pipe';
import { Order } from '../common/schemas/order.schema';
import { IPagination } from '../common/interfaces/pagination.interface';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';
import { AddProductDto } from './dtos/add-product.dto';

@Controller('users/:userId/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(
    @Param('userId', ParseMongoIdsPipe) userId: string,
  ): Promise<Order> {
    return await this.ordersService.create(userId);
  }

  @Get()
  async find(
    @Param('userId', ParseMongoIdsPipe) userId: string,
    @Query() paginationQueryDto: PaginationQueryDto,
  ): Promise<IPagination<Order>> {
    return await this.ordersService.find(
      { user: userId },
      {},
      { sort: { createdAt: -1 } },
      paginationQueryDto,
    );
  }

  @Get(':orderId')
  async findOne(
    @Param('userId', ParseMongoIdsPipe) userId: string,
    @Param('orderId', ParseMongoIdsPipe) orderId: string,
  ): Promise<Order> {
    return await this.ordersService.findOne(
      {
        _id: orderId,
        user: userId,
      },
      {},
      {},
    );
  }

  @Patch(':orderId')
  async addProduct(
    @Param('userId', ParseMongoIdsPipe) userId: string,
    @Param('orderId', ParseMongoIdsPipe) orderId: string,
    @Body() addProductDto: AddProductDto,
  ): Promise<Order> {
    return await this.ordersService.addProduct(userId, orderId, addProductDto);
  }
}
