import { Injectable, Logger } from '@nestjs/common';
import { OrdersRepositoryService } from './repositories/orders-repository.service';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';
import { CurrenciesEnum } from '../common/enums/currencies.enum';
import { UsersService } from '../users/users.service';
import { Order } from '../common/schemas/order.schema';

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

  async find() {}
  async findOne() {}
  async deleteOne() {}

  private async addProduct() {}
  private async checkStock() {}
  private async incrementProductQuantity() {}
  private async decrementProductQuantity() {}
  private async removeProduct() {}
}
