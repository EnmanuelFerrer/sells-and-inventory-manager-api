import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Sale } from '../common/schemas/sale.schema';
import { SalesRepositoryService } from './repositories/sales-repository.service';
import { UsersService } from '../users/users.service';
import { ProjectionFields, QueryFilter, QueryOptions } from 'mongoose';
import { IPagination } from '../common/interfaces/pagination.interface';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private readonly salesRepository: SalesRepositoryService,

    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
  ) {}

  async create(userId: string, createSaleDto: CreateSaleDto): Promise<Sale> {
    this.logger.debug('Creating sale.');
    const user = await this.usersService.findOne({ _id: userId });
    const order = await this.ordersService.findOne({
      _id: createSaleDto.orderId,
      user: userId,
    });

    if (order.products.length === 0) {
      this.logger.debug(
        'Creating sales whit empty orders is not allowed. Please add products to the order.',
      );
      throw new ConflictException(
        'Creating sales whit empty orders is not allowed. Please add products to the order.',
      );
    }

    const saleExists = await this.exists({
      user: userId,
      order: createSaleDto.orderId,
    });

    if (saleExists) {
      this.logger.debug(
        'The order you try to attach to this sale is currently attached in another sale. Please attach another order.',
      );
      throw new ConflictException(
        'The order you try to attach to this sale is currently attached in another sale. Please attach another order.',
      );
    }

    const createdSale = await this.salesRepository.create({
      user,
      order,
      status: createSaleDto.status,
    });

    this.logger.debug('Sale created.');
    return await this.findOne({ _id: createdSale._id });
  }

  async find(
    queryFilter: QueryFilter<Sale> = {},
    projection: ProjectionFields<Sale> = {},
    options: QueryOptions<Sale> = {},
    paginationDto: PaginationQueryDto,
  ): Promise<IPagination<Sale>> {
    this.logger.debug('Finding sales.');

    const sales = await this.salesRepository.find(
      queryFilter,
      projection,
      options,
      paginationDto,
    );

    if (sales.totalItems === 1) {
      this.logger.debug(`${sales.totalItems} sale found.`);
    } else {
      this.logger.debug(`${sales.totalItems} sales found.`);
    }

    return sales;
  }

  async findOne(
    queryFilter: QueryFilter<Sale>,
    projection: ProjectionFields<Sale> = {},
    options: QueryOptions<Sale> = {},
  ): Promise<Sale> {
    this.logger.debug('Finding sale.');

    const sale = await this.salesRepository.findOne(
      queryFilter,
      projection,
      options,
    );

    if (!sale) {
      this.logger.debug(
        `Sale not found for query: ${JSON.stringify(queryFilter)}.`,
      );
      throw new NotFoundException(`Sale not found.`);
    }

    this.logger.debug('Sale found.');
    return sale;
  }

  async exists(queryFilter: QueryFilter<Sale>): Promise<boolean> {
    this.logger.debug('Checking if sale exists.');
    const sale = await this.salesRepository.exists(queryFilter);
    if (!sale) {
      this.logger.debug(
        `Sale not found for filter: ${JSON.stringify(queryFilter)}.`,
      );
      return false;
    }
    this.logger.debug('Sale exist.');
    return true;
  }
}
