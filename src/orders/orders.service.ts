import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrdersRepositoryService } from './repositories/orders-repository.service';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';
import { CurrenciesEnum } from '../common/enums/currencies.enum';
import { UsersService } from '../users/users.service';
import { Order } from '../common/schemas/order.schema';
import { ProjectionFields, QueryFilter, QueryOptions } from 'mongoose';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';
import { IPagination } from '../common/interfaces/pagination.interface';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly ordersRepositoryService: OrdersRepositoryService,

    private readonly exchangeRateService: ExchangeRatesService,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string): Promise<Order> {
    this.logger.debug('Creating Order.');

    const [user, exchangeRate] = await Promise.all([
      this.usersService.findOne({ _id: userId }),
      this.exchangeRateService.findLast(CurrenciesEnum.USD),
    ]);

    const order = await this.ordersRepositoryService.create({
      user,
      exchangeRate,
    });

    this.logger.debug('Order created.');
    return order;
  }

  async find(
    queryFilter: QueryFilter<Order> = {},
    projection: ProjectionFields<Order> = {},
    options: QueryOptions<Order> = {},
    paginationDto: PaginationQueryDto,
  ): Promise<IPagination<Order>> {
    this.logger.debug('Finding orders.');

    const orders = await this.ordersRepositoryService.find(
      queryFilter,
      projection,
      options,
      paginationDto,
    );

    if (orders.totalItems === 1) {
      this.logger.debug(`${orders.totalItems} order found.`);
    } else {
      this.logger.debug(`${orders.totalItems} orders found.`);
    }

    return orders;
  }

  async findOne(
    queryFilter: QueryFilter<Order>,
    projection: ProjectionFields<Order> = {},
    options: QueryOptions<Order> = {},
  ): Promise<Order> {
    this.logger.debug('Finding order.');

    const order = await this.ordersRepositoryService.findOne(
      queryFilter,
      projection,
      options,
    );

    if (!order) {
      this.logger.debug(
        `Order not found for query: ${JSON.stringify(queryFilter)}`,
      );
      throw new NotFoundException('Order not found.');
    }

    this.logger.debug('Order found.');
    return order;
  }

  async deleteOne() {}

  private async addProduct() {}
  private async checkStock() {}
  private async incrementProductQuantity() {}
  private async decrementProductQuantity() {}
  private async removeProduct() {}
}
