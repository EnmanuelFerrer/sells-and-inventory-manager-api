import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Sale } from '../common/schemas/sale.schema';
import { SalesRepositoryService } from './repositories/sales-repository.service';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { QueryFilter, Types } from 'mongoose';
import { Product } from '../common/schemas/product.schema';
import { ProductStockOperationsEnum } from '../common/enums/product-stock-operations.enum';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private readonly salesRepository: SalesRepositoryService,

    private readonly usersService: UsersService,
    private readonly productsService: ProductsService,
  ) {}

  async create(userId: string, createSaleDto: CreateSaleDto): Promise<Sale> {
    this.logger.debug('Creating sale.');
    await this.usersService.exists({ _id: userId });
    await this.validateCreationData(userId, createSaleDto);
    const data: Partial<Sale> = await this.generateCreationData(
      userId,
      createSaleDto,
    );
    const sale = await this.salesRepository.create(data);
    this.logger.debug('Sale created.');
    return sale;
  }

  private async validateCreationData(
    userId: string,
    dto: CreateSaleDto,
  ): Promise<void> {
    const productsIds = dto.saleProducts.map(
      (saleProduct) => saleProduct.productId,
    );
    const query: QueryFilter<Product> = {
      user: userId,
      _id: { $in: productsIds },
    };
    const totalProducts = await this.productsService.count(query);
    const products = await this.productsService.find(
      query,
      {},
      {},
      { limit: totalProducts },
    );

    const errorMessages: string[] = [];

    for (const saleProduct of dto.saleProducts) {
      const productInDB = products.items.find((p) =>
        p._id.equals(saleProduct.productId),
      );

      if (!productInDB) {
        errorMessages.push(
          `Product with ID ${saleProduct.productId.toString()} not found.`,
        );
      }

      if (productInDB && productInDB.stock < saleProduct.quantity) {
        errorMessages.push(
          `Product with ID ${saleProduct.productId.toString()} does not have enough stock.`,
        );
      }
    }

    if (errorMessages.length > 0) {
      throw new ConflictException(errorMessages);
    }
  }

  private async generateCreationData(
    userId: string,
    dto: CreateSaleDto,
  ): Promise<Partial<Sale>> {
    const data: Partial<Sale> = {
      user: new Types.ObjectId(userId),
      saleProducts: [],
      total: 0,
    };

    for (const saleProduct of dto.saleProducts) {
      const product = await this.productsService.findOne({
        _id: saleProduct.productId,
      });

      data.saleProducts!.push({
        product: product._id,
        quantity: saleProduct.quantity,
        unitPrice: product.price,
      });
      data.total! += Number((product.price * saleProduct.quantity).toFixed(2));

      await this.productsService.stockOperation(
        userId,
        product._id.toString(),
        {
          operation: ProductStockOperationsEnum.DECREMENT,
          quantity: saleProduct.quantity,
        },
      );
    }

    return data;
  }
}
