import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Sale, SaleSchema } from '../common/schemas/sale.schema';
import { SalesRepositoryService } from './repositories/sales-repository.service';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Sale.name, schema: SaleSchema }]),

    OrdersModule,
    UsersModule,
  ],
  controllers: [SalesController],
  providers: [SalesService, SalesRepositoryService],
  exports: [SalesService],
})
export class SalesModule {}
