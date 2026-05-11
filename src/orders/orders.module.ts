import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './order.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../common/schemas/order.schema';
import { ExchangeRatesModule } from '../exchange-rates/exchange-rates.module';
import { UsersModule } from '../users/users.module';
import { OrdersRepositoryService } from './repositories/orders-repository.service';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),

    ExchangeRatesModule,
    UsersModule,
    ProductsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepositoryService],
  exports: [OrdersService],
})
export class OrdersModule {}
