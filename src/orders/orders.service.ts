import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrdersRepositoryService } from './repositories/orders-repository.service';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';
import { CurrenciesEnum } from '../common/enums/currencies.enum';
import { UsersService } from '../users/users.service';
import { Order } from '../common/schemas/order.schema';
import {
  ProjectionFields,
  QueryFilter,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';
import { IPagination } from '../common/interfaces/pagination.interface';
import { ProductsService } from '../products/products.service';
import { AddProductDto } from './dtos/add-product.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly ordersRepositoryService: OrdersRepositoryService,

    private readonly exchangeRateService: ExchangeRatesService,
    private readonly usersService: UsersService,
    private readonly productsService: ProductsService,
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

  async findOneAndUpdate(
    queryFilter: QueryFilter<Order>,
    update: UpdateQuery<Order>,
  ): Promise<Order> {
    this.logger.debug('Updating order.');

    await this.exists(queryFilter);

    const updated = await this.ordersRepositoryService.findOneAndUpdate(
      queryFilter,
      update,
    );

    if (!updated) {
      this.logger.debug(
        `Error updating order found with query: ${JSON.stringify(queryFilter)}`,
      );
      throw new InternalServerErrorException('Error updating order.');
    }

    this.logger.debug('Order updated.');
    return updated;
  }

  async exists(queryFilter: QueryFilter<Order>): Promise<boolean> {
    this.logger.debug('Checking if order exists.');

    const exists = await this.ordersRepositoryService.exists(queryFilter);
    if (!exists) {
      this.logger.debug(
        `Order not found for query: ${JSON.stringify(queryFilter)}`,
      );
      throw new NotFoundException('Order not found.');
    }

    this.logger.debug('Order found.');
    return true;
  }

  async addProduct(
    userId: string,
    orderId: string,
    addProductDto: AddProductDto,
  ): Promise<Order> {
    this.logger.debug('Adding product to order.');

    /**
     * TODO: Validate if the product the user is trying to add
     * exists inside of the products array of the order
     *
     * TODO: If the product exists, then just increment then
     * quantity of existent product
     *
     * TODO: Validate if there is available product in stock
     * before adding it to the order
     */

    const foundProduct = await this.productsService.findOne(
      { _id: addProductDto.productId, user: userId },
      { price: 1 },
    );

    const update = await this.findOneAndUpdate(
      { _id: orderId, user: userId },
      {
        $push: {
          products: {
            product: foundProduct._id,
            unitPrice: foundProduct.price,
            quantity: addProductDto.quantity,
          },
        },
      },
    );

    this.logger.debug('Product added to order.');
    return update;
  }
}
