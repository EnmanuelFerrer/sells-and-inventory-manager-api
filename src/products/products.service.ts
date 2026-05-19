import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from '../common/schemas/product.schema';
import {
  ProjectionFields,
  QueryFilter,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';
import { UsersService } from '../users/users.service';
import { BrandsService } from '../brands/brands.service';
import { IPagination } from '../common/interfaces/pagination.interface';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';
import { ProductRepositoryService } from './repositories/product-repository.service';
import { ProductStockOperationsEnum } from '../common/enums/product-stock-operations.enum';
import { ProductStockOperationDto } from './dto/product-stock-operation.dto';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';
import { CurrenciesEnum } from '../common/enums/currencies.enum';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly productRepository: ProductRepositoryService,

    private readonly usersService: UsersService,
    private readonly brandsService: BrandsService,
    private readonly exchangeRatesService: ExchangeRatesService,
  ) {}

  async create(
    userId: string,
    brandId: string,
    createProductDto: CreateProductDto,
  ): Promise<Product> {
    this.logger.debug('Creating product.');

    this.validateCreationData(createProductDto);

    const user = await this.usersService.findOne({ _id: userId });
    const brand = await this.brandsService.findOne({ _id: brandId, user });
    const productExist = await this.productRepository.exists({
      name: { $regex: createProductDto.name, $options: 'i' },
    });
    if (productExist) {
      this.logger.debug(
        `Product whit same name ${createProductDto.name} exist.`,
      );
      throw new ConflictException('Product already exist.');
    }

    const { cost, gain, price } =
      await this.calculateCreationValues(createProductDto);

    const data: Partial<Product> = {
      ...createProductDto,
      user,
      brand,
      cost,
      gain,
      price,
    };

    const product = await this.productRepository.create(data);

    if (!product) {
      this.logger.error('Error creating product.');
      throw new InternalServerErrorException(
        'Error creating product. Try again later.',
      );
    }

    this.logger.debug('Product created.');
    return product;
  }

  async find(
    queryFilter: QueryFilter<Product>,
    projection: ProjectionFields<Product> = {},
    options: QueryOptions<Product> = {},
    paginationDto: PaginationQueryDto,
  ): Promise<IPagination<Product>> {
    this.logger.debug('Finding all products.');

    const products = await this.productRepository.find(
      queryFilter,
      projection,
      options,
      paginationDto,
    );

    if (products.totalItems === 1) {
      this.logger.debug(`${products.totalItems} product found.`);
    } else {
      this.logger.debug(`${products.totalItems} products found.`);
    }

    return products;
  }

  async findOne(
    queryFilter: QueryFilter<Product>,
    projection: ProjectionFields<Product> = {},
    options: QueryOptions<Product> = {},
  ): Promise<Product> {
    this.logger.debug('Finding product.');

    const product = await this.productRepository.findOne(
      queryFilter,
      projection,
      options,
    );
    if (!product) {
      this.logger.debug(
        `Product not found for query: ${JSON.stringify(queryFilter)}.`,
      );
      throw new NotFoundException(`Product not found.`);
    }
    this.logger.debug('Product found.');
    return product;
  }

  async count(queryFilter: QueryFilter<Product>): Promise<number> {
    this.logger.debug('Counting products.');
    const count = await this.productRepository.count(queryFilter);
    this.logger.debug('Products counted.');
    return count;
  }

  async findOneAndUpdate(
    queryFilter: QueryFilter<Product>,
    update: UpdateQuery<Product>,
    options: QueryOptions<Product> = {},
  ): Promise<Product> {
    this.logger.debug('Updating product.');
    const product = await this.productRepository.findOneAndUpdate(
      queryFilter,
      update,
      options,
    );
    if (!product) {
      this.logger.debug(
        `Product not found for query: ${JSON.stringify(queryFilter)}.`,
      );
      throw new NotFoundException(`Product not found.`);
    }
    this.logger.debug('Product updated.');
    return product;
  }

  async stockOperation(
    userId: string,
    productId: string,
    operationDto: ProductStockOperationDto,
  ): Promise<Product> {
    this.logger.debug(
      `Performing stock operation: ${operationDto.operation} for product ID: ${productId}.`,
    );

    const update = { $inc: { stock: 0 } };
    if (operationDto.operation === ProductStockOperationsEnum.INCREMENT) {
      update.$inc.stock = operationDto.quantity;
    } else {
      update.$inc.stock = -operationDto.quantity;
    }

    const product = await this.productRepository.findOneAndUpdate(
      { user: userId, _id: productId },
      update,
    );

    if (!product) {
      this.logger.debug(`Product not found for ID: ${productId}.`);
      throw new NotFoundException(`Product not found.`);
    }

    this.logger.debug(`Updated product stock: ${product.stock}.`);
    return product;
  }

  async exists(queryFilter: QueryFilter<Product>): Promise<boolean> {
    this.logger.debug('Checking if product exists.');
    const product = await this.productRepository.exists(queryFilter);
    if (!product) {
      this.logger.debug(
        `Product not found for filter: ${JSON.stringify(queryFilter)}.`,
      );
      throw new NotFoundException('Product not found.');
    }
    this.logger.debug('Product exist.');
    return true;
  }

  async haveEnoughStock(
    queryFilter: QueryFilter<Product>,
    quantity: number,
  ): Promise<boolean> {
    this.logger.debug(`Checking product availability.`);

    if (quantity <= 0) {
      this.logger.debug(`Quantity must be greater than 0.`);
      throw new ConflictException(`Quantity must be greater than 0.`);
    }
    if (!Number.isInteger(quantity)) {
      this.logger.debug(`Quantity must be an integer.`);
      throw new ConflictException(`Quantity must be an integer.`);
    }

    const product = await this.productRepository.findOne({
      ...queryFilter,
      stock: { $gte: quantity },
    });

    if (!product) {
      this.logger.debug(`Not enough stock for product .`);
      throw new ConflictException(`Not enough stock for product.`);
    }

    this.logger.debug(`Product stock is sufficient for product.`);
    return true;
  }

  async activate(userId: string, productId: string): Promise<Product> {
    this.logger.debug(`Activating product: ${productId}.`);

    const existingProduct = await this.findOne({
      _id: productId,
      user: userId,
    });

    if (!existingProduct) {
      this.logger.debug(`Product not found for ID: ${productId}.`);
      throw new NotFoundException(`Product not found.`);
    }

    if (existingProduct.isActive) {
      this.logger.debug(`Product is already active: ${productId}.`);
      throw new ConflictException(`Product is already active.`);
    }

    const product = await this.findOneAndUpdate(
      { _id: productId, user: userId },
      { $set: { isActive: true } },
    );

    this.logger.debug(`Product activated: ${productId}.`);
    return product;
  }

  async deactivate(userId: string, productId: string): Promise<Product> {
    this.logger.debug(`Deactivating product: ${productId}.`);

    const existingProduct = await this.findOne({
      _id: productId,
      user: userId,
    });

    if (!existingProduct) {
      this.logger.debug(`Product not found for ID: ${productId}.`);
      throw new NotFoundException(`Product not found.`);
    }

    if (!existingProduct.isActive) {
      this.logger.debug(`Product is already inactive: ${productId}.`);
      throw new ConflictException(`Product is already inactive.`);
    }

    const product = await this.findOneAndUpdate(
      { _id: productId, user: userId },
      { $set: { isActive: false } },
    );

    this.logger.debug(`Product deactivated: ${productId}.`);
    return product;
  }

  private validateCreationData(dto: CreateProductDto): void {
    this.logger.debug('Executing data pre-validations.');

    if (dto.cost === 0) {
      if (dto?.gain !== undefined && dto.gain > 0) {
        throw new ConflictException('Gain must be 0 when cost is 0.');
      }
      if (dto?.price !== undefined && dto.price > 0) {
        throw new ConflictException('Price must be 0 when cost is 0.');
      }
    }

    if (dto?.gain === undefined && dto?.price === undefined) {
      throw new ConflictException('Gain or price must be set.');
    }

    if (dto?.gain !== undefined && dto?.price !== undefined) {
      throw new ConflictException(
        'Gain and price cannot be set at the same time.',
      );
    }

    if (dto?.gain !== undefined && dto.gain > 30) {
      throw new ConflictException('Gain must not be greater than 30%');
    }

    if (dto?.price !== undefined) {
      if (dto.price < dto.cost) {
        throw new ConflictException(
          'Price must be greater than or equal to cost.',
        );
      }

      const gain = (Math.abs(dto.price - dto.cost) / dto.cost) * 100;
      if (gain > 30) {
        throw new ConflictException('Gain must not be greater than 30%.');
      }
    }

    this.logger.debug('Pre-validations executed.');
  }

  private async calculateCreationValues(dto: CreateProductDto): Promise<{
    cost: number;
    gain: number;
    price: number;
  }> {
    this.logger.debug('Calculating cost, gain and price final values.');

    if (dto.cost === 0) {
      return {
        cost: 0,
        gain: 0,
        price: 0,
      };
    }

    if (dto?.gain !== undefined) {
      if (dto?.currency !== undefined && dto.currency === CurrenciesEnum.VES) {
        const exchangeRate = await this.exchangeRatesService.findLast(
          CurrenciesEnum.USD,
        );
        dto.cost = dto.cost / exchangeRate.amount;
      }

      const increment = dto.cost * (dto.gain / 100);
      const price = dto.cost + increment;

      return {
        cost: Number(dto.cost.toFixed(2)),
        gain: Number(dto.gain.toFixed(2)),
        price: Number(price.toFixed(2)),
      };
    }

    if (dto?.currency && dto.currency === CurrenciesEnum.VES) {
      const exchangeRate = await this.exchangeRatesService.findLast(
        CurrenciesEnum.USD,
      );

      dto.cost = dto.cost / exchangeRate.amount;
      dto.price = dto.price! / exchangeRate.amount;
    }

    const gain = (Math.abs(dto.price! - dto.cost) / dto.cost) * 100;

    return {
      cost: Number(dto.cost.toFixed(2)),
      gain: Number(gain.toFixed(2)),
      price: Number(dto.price!.toFixed(2)),
    };
  }
}
