import {
  ConflictException,
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
import { SalesRepositoryService } from '../sales/repositories/sales-repository.service';
import { AddProductDto } from './dtos/add-product.dto';
import { RemoveProductDto } from './dtos/remove-product.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly ordersRepositoryService: OrdersRepositoryService,
    private readonly salesRepositoryService: SalesRepositoryService,

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

    const orderExists = await this.salesRepositoryService.exists({
      order: orderId,
    });
    if (orderExists) {
      this.logger.debug(
        'Order is already linked to a sale and cannot be modified.',
      );
      throw new ConflictException(
        'Order is already linked to a sale and cannot be modified.',
      );
    }

    const { productId, quantity: quantityToAdd } = addProductDto;
    const productQuery = { _id: productId, user: userId, isActive: true };
    const orderQuery = { _id: orderId, user: userId };

    await this.productsService.haveEnoughStock(productQuery, quantityToAdd);
    const foundProduct = await this.productsService.findOne(productQuery);
    const order = await this.findOne(orderQuery);

    if (order.products.length > 0) {
      const productsInOrder = order.products;

      const existentProductInOrder = productsInOrder.find(
        (p) => p.product._id.toString() === productId,
      )!;

      if (existentProductInOrder !== undefined) {
        const update = await this.findOneAndUpdate(
          { ...orderQuery, 'products.product': productId },
          {
            $set: {
              'products.$.quantity':
                existentProductInOrder.quantity + quantityToAdd,
              total: order.total + foundProduct.price * quantityToAdd,
            },
          },
        );

        await this.productsService.findOneAndUpdate(productQuery, {
          $inc: { stock: -quantityToAdd },
        });

        this.logger.debug('Product added to order.');
        return update;
      }
    }

    const update = await this.findOneAndUpdate(orderQuery, {
      $push: {
        products: {
          product: foundProduct._id,
          unitPrice: foundProduct.price,
          quantity: quantityToAdd,
        },
      },
      $set: { total: order.total + foundProduct.price * quantityToAdd },
    });

    await this.productsService.findOneAndUpdate(productQuery, {
      $inc: { stock: -quantityToAdd },
    });

    this.logger.debug('Product added to order.');
    return update;
  }

  async removeProduct(
    userId: string,
    orderId: string,
    removeProductDto: RemoveProductDto,
  ): Promise<Order> {
    this.logger.debug('Removing product from order.');

    const orderExists = await this.salesRepositoryService.exists({
      order: orderId,
    });
    if (orderExists) {
      this.logger.debug(
        'Order is already linked to a sale and cannot be modified.',
      );
      throw new ConflictException(
        'Order is already linked to a sale and cannot be modified.',
      );
    }

    const { productId, quantity: quantityToRemove } = removeProductDto;
    const productQuery = { _id: productId, user: userId, isActive: true };
    const orderQuery = { _id: orderId, user: userId };

    const order = await this.findOne(orderQuery);

    const productInOrder = order.products.find(
      (p) => p.product._id.toString() === productId,
    );

    if (!productInOrder) {
      this.logger.debug(`Product not found in order: ${productId}`);
      throw new NotFoundException('Product not found in order.');
    }

    const currentQuantity = productInOrder.quantity;

    if (quantityToRemove >= currentQuantity) {
      const quantityToRestore = currentQuantity;

      const update = await this.findOneAndUpdate(orderQuery, {
        $pull: { products: { product: productId } },
        $set: {
          total: order.total - productInOrder.unitPrice * quantityToRestore,
        },
      });

      await this.productsService.findOneAndUpdate(productQuery, {
        $inc: { stock: quantityToRestore },
      });

      this.logger.debug('Product removed from order.');
      return update;
    }

    const newQuantity = currentQuantity - quantityToRemove;
    const totalReduction = productInOrder.unitPrice * quantityToRemove;

    const update = await this.findOneAndUpdate(
      { ...orderQuery, 'products.product': productId },
      {
        $set: {
          'products.$.quantity': newQuantity,
          total: order.total - totalReduction,
        },
      },
    );

    await this.productsService.findOneAndUpdate(productQuery, {
      $inc: { stock: quantityToRemove },
    });

    this.logger.debug('Product quantity decremented in order.');
    return update;
  }
}
