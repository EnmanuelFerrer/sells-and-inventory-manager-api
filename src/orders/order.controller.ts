import { Controller, Param, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ParseMongoIdsPipe } from '../common/pipes/parse-mongo-ids.pipe';
import { Order } from '../common/schemas/order.schema';

@Controller('users/:userId/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(
    @Param('userId', ParseMongoIdsPipe) userId: string,
  ): Promise<Order> {
    return await this.ordersService.create(userId);
  }
}
