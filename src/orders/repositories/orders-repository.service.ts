import { Injectable } from '@nestjs/common';
import { RepositoryService } from '../../common/repository/repository.service';
import { Order, OrderDocument } from '../../common/schemas/order.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class OrdersRepositoryService extends RepositoryService<OrderDocument> {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
  ) {
    super(orderModel);
  }
}
