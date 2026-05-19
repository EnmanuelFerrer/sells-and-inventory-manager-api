import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './order.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../common/schemas/order.schema';
import { ExchangeRatesModule } from '../exchange-rates/exchange-rates.module';
import { UsersModule } from '../users/users.module';
import { OrdersRepositoryService } from './repositories/orders-repository.service';
import { ProductsModule } from '../products/products.module';
import { Sale, SaleSchema } from '../common/schemas/sale.schema';
import { SalesRepositoryService } from '../sales/repositories/sales-repository.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Sale.name, schema: SaleSchema },
    ]),

    ExchangeRatesModule,
    UsersModule,
    ProductsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepositoryService, SalesRepositoryService],
  exports: [OrdersService],
})
export class OrdersModule {}
