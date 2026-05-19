import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersRepositoryService } from './repositories/orders-repository.service';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { SalesRepositoryService } from '../sales/repositories/sales-repository.service';
import { Order } from '../common/schemas/order.schema';
import { Product } from '../common/schemas/product.schema';
import { ExchangeRate } from '../common/schemas/exchange-rate.schema';
import { User } from '../common/schemas/users.schema';
import { CurrenciesEnum } from '../common/enums/currencies.enum';
import { IPagination } from '../common/interfaces/pagination.interface';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';
import { AddProductDto } from './dtos/add-product.dto';
import { RemoveProductDto } from './dtos/remove-product.dto';
import { Types } from 'mongoose';
import { RolesEnum } from '../common/enums/roles.enum';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockOrdersRepository: {
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
    findOneAndDelete: jest.Mock;
    exists: jest.Mock;
  };
  let mockExchangeRatesService: {
    findLast: jest.Mock;
  };
  let mockUsersService: {
    findOne: jest.Mock;
  };
  let mockProductsService: {
    haveEnoughStock: jest.Mock;
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
  };
  let mockSalesRepositoryService: {
    exists: jest.Mock;
  };

  const mockUser: User = {
    _id: new Types.ObjectId(),
    username: 'testuser',
    password: 'hashedpassword',
    rol: RolesEnum.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockExchangeRate: ExchangeRate = {
    _id: new Types.ObjectId(),
    currency: CurrenciesEnum.USD,
    amount: 499.8608,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct: Product = {
    _id: new Types.ObjectId(),
    name: 'Test Product',
    cost: 100,
    gain: 20,
    price: 120,
    stock: 10,
    isActive: true,
    user: mockUser._id,
    brand: new Types.ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrder: Order = {
    _id: new Types.ObjectId(),
    user: mockUser._id,
    exchangeRate: mockExchangeRate._id,
    products: [],
    total: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrderWithProduct: Order = {
    _id: new Types.ObjectId(),
    user: mockUser._id,
    exchangeRate: mockExchangeRate._id,
    products: [
      {
        product: mockProduct._id,
        unitPrice: 120,
        quantity: 2,
      },
    ],
    total: 240,
  };

  const mockPaginatedResult: IPagination<Order> = {
    items: [mockOrder],
    skip: 0,
    limit: 25,
    totalItems: 1,
    totalPages: 1,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockOrdersRepository = {
      create: jest.fn().mockResolvedValue(mockOrder),
      find: jest.fn().mockResolvedValue(mockPaginatedResult),
      findOne: jest.fn().mockResolvedValue(mockOrder),
      findOneAndUpdate: jest.fn().mockResolvedValue(mockOrder),
      findOneAndDelete: jest.fn().mockResolvedValue(mockOrder),
      exists: jest.fn().mockResolvedValue(true),
    };

    mockExchangeRatesService = {
      findLast: jest.fn().mockResolvedValue(mockExchangeRate),
    };

    mockUsersService = {
      findOne: jest.fn().mockResolvedValue(mockUser),
    };

    mockProductsService = {
      haveEnoughStock: jest.fn().mockResolvedValue(true),
      findOne: jest.fn().mockResolvedValue(mockProduct),
      findOneAndUpdate: jest.fn().mockResolvedValue(mockProduct),
    };

    mockSalesRepositoryService = {
      exists: jest.fn().mockResolvedValue(false),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: OrdersRepositoryService,
          useValue: mockOrdersRepository,
        },
        {
          provide: ExchangeRatesService,
          useValue: mockExchangeRatesService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
        {
          provide: SalesRepositoryService,
          useValue: mockSalesRepositoryService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = 'user-id-123';

    it('should create a new order with user and exchange rate', async () => {
      const result = await service.create(userId);

      expect(mockUsersService.findOne).toHaveBeenCalledWith({ _id: userId });
      expect(mockExchangeRatesService.findLast).toHaveBeenCalledWith(
        CurrenciesEnum.USD,
      );
      expect(mockOrdersRepository.create).toHaveBeenCalledWith({
        user: mockUser,
        exchangeRate: mockExchangeRate,
      });
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUsersService.findOne.mockRejectedValue(
        new NotFoundException('User not found.'),
      );

      await expect(service.create(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('find', () => {
    it('should return paginated orders', async () => {
      const paginationDto: PaginationQueryDto = {
        skip: 0,
        limit: 25,
      };

      const result = await service.find({}, {}, {}, paginationDto);

      expect(mockOrdersRepository.find).toHaveBeenCalledWith(
        {},
        {},
        {},
        { skip: 0, limit: 25 },
      );
      expect(result.items).toHaveLength(1);
      expect(result.totalItems).toBe(1);
    });

    it('should handle empty results', async () => {
      mockOrdersRepository.find.mockResolvedValue({
        items: [],
        skip: 0,
        limit: 25,
        totalItems: 0,
        totalPages: 0,
      });

      const paginationDto: PaginationQueryDto = {
        skip: 0,
        limit: 25,
      };

      const result = await service.find({}, {}, {}, paginationDto);

      expect(result.items).toHaveLength(0);
      expect(result.totalItems).toBe(0);
    });

    it('should accept queryFilter, projection, and options', async () => {
      const paginationDto: PaginationQueryDto = {
        skip: 10,
        limit: 10,
      };
      const queryFilter = { user: 'user-id-123' };
      const projection = { total: 1 };
      const options = { sort: { createdAt: -1 } };

      await service.find(queryFilter, projection, options, paginationDto);

      expect(mockOrdersRepository.find).toHaveBeenCalledWith(
        queryFilter,
        projection,
        options,
        { skip: 10, limit: 10 },
      );
    });
  });

  describe('findOne', () => {
    it('should return an order when found', async () => {
      const result = await service.findOne({ _id: 'order-id-123' });

      expect(mockOrdersRepository.findOne).toHaveBeenCalledWith(
        { _id: 'order-id-123' },
        {},
        {},
      );
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when order not found', async () => {
      mockOrdersRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne({ _id: 'nonexistent' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should accept queryFilter, projection, and options', async () => {
      const queryFilter = { _id: 'order-id-123', user: 'user-id-123' };
      const projection = { products: 1 };
      const options = { sort: { createdAt: -1 } };

      await service.findOne(queryFilter, projection, options);

      expect(mockOrdersRepository.findOne).toHaveBeenCalledWith(
        queryFilter,
        projection,
        options,
      );
    });
  });

  describe('findOneAndUpdate', () => {
    it('should update an order and return it', async () => {
      const queryFilter = { _id: 'order-id-123' };
      const update = { $set: { total: 100 } };

      const result = await service.findOneAndUpdate(queryFilter, update);

      expect(mockOrdersRepository.exists).toHaveBeenCalledWith(queryFilter);
      expect(mockOrdersRepository.findOneAndUpdate).toHaveBeenCalledWith(
        queryFilter,
        update,
      );
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockOrdersRepository.exists.mockResolvedValue(false);

      await expect(
        service.findOneAndUpdate(
          { _id: 'nonexistent' },
          { $set: { total: 100 } },
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException when update fails', async () => {
      mockOrdersRepository.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        service.findOneAndUpdate(
          { _id: 'order-id-123' },
          { $set: { total: 100 } },
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('exists', () => {
    it('should return true when order exists', async () => {
      mockOrdersRepository.exists.mockResolvedValue(true);

      const result = await service.exists({ _id: 'order-id-123' });

      expect(mockOrdersRepository.exists).toHaveBeenCalledWith({
        _id: 'order-id-123',
      });
      expect(result).toBe(true);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockOrdersRepository.exists.mockResolvedValue(false);

      await expect(service.exists({ _id: 'nonexistent' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addProduct', () => {
    const userId = 'user-id-123';
    const orderId = 'order-id-123';

    it('should add a new product to an empty order', async () => {
      const addProductDto: AddProductDto = {
        productId: mockProduct._id.toString(),
        quantity: 2,
      };

      mockOrdersRepository.findOne
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockOrder);

      mockOrdersRepository.findOneAndUpdate.mockResolvedValueOnce({
        ...mockOrder,
        products: [
          {
            product: mockProduct._id,
            unitPrice: 120,
            quantity: 2,
          },
        ],
        total: 240,
      });

      const result = await service.addProduct(userId, orderId, addProductDto);

      expect(mockProductsService.haveEnoughStock).toHaveBeenCalledWith(
        { _id: mockProduct._id.toString(), user: userId, isActive: true },
        2,
      );
      expect(mockProductsService.findOne).toHaveBeenCalledWith({
        _id: mockProduct._id.toString(),
        user: userId,
        isActive: true,
      });
      expect(mockProductsService.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockProduct._id.toString(), user: userId, isActive: true },
        { $inc: { stock: -2 } },
      );
      expect(mockOrdersRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: orderId, user: userId },
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          $push: expect.any(Object),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          $set: expect.any(Object),
        }),
      );
      expect(result.total).toBe(240);
    });

    it('should increment quantity when product already exists in order', async () => {
      const addProductDto: AddProductDto = {
        productId: mockProduct._id.toString(),
        quantity: 3,
      };

      mockOrdersRepository.findOne.mockResolvedValueOnce(mockOrderWithProduct);

      mockOrdersRepository.findOneAndUpdate.mockResolvedValueOnce({
        ...mockOrderWithProduct,
        products: [
          {
            product: mockProduct._id,
            unitPrice: 120,
            quantity: 5,
          },
        ],
        total: 600,
      });

      const result = await service.addProduct(userId, orderId, addProductDto);

      expect(mockProductsService.haveEnoughStock).toHaveBeenCalledWith(
        { _id: mockProduct._id.toString(), user: userId, isActive: true },
        3,
      );

      // Verify repository call with correct filter (products.product field)
      expect(mockOrdersRepository.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: orderId,
          user: userId,
          'products.product': mockProduct._id.toString(),
        },
        {
          $set: {
            'products.$.quantity': 5, // 2 (existing) + 3 (new)
            total: 600, // 240 (existing) + 120 * 3 = 600
          },
        },
      );

      // Verify stock is decremented
      expect(mockProductsService.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockProduct._id.toString(), user: userId, isActive: true },
        { $inc: { stock: -3 } },
      );

      expect(result.total).toBe(600);
      expect(result.products[0].quantity).toBe(5);
    });

    it('should throw ConflictException when product does not have enough stock', async () => {
      const addProductDto: AddProductDto = {
        productId: mockProduct._id.toString(),
        quantity: 15,
      };

      mockProductsService.haveEnoughStock.mockRejectedValue(
        new ConflictException('Not enough stock for product.'),
      );

      await expect(
        service.addProduct(userId, orderId, addProductDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      const addProductDto: AddProductDto = {
        productId: mockProduct._id.toString(),
        quantity: 2,
      };

      mockOrdersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addProduct(userId, 'nonexistent-order', addProductDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException when findOneAndUpdate returns null', async () => {
      const addProductDto: AddProductDto = {
        productId: mockProduct._id.toString(),
        quantity: 2,
      };

      // First call to findOne (to get the order)
      mockOrdersRepository.findOne.mockResolvedValueOnce(mockOrder);

      // findOneAndUpdate returns null (update failed)
      mockOrdersRepository.findOneAndUpdate.mockResolvedValueOnce(null);

      await expect(
        service.addProduct(userId, orderId, addProductDto),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw ConflictException when order is already linked to a sale', async () => {
      const addProductDto: AddProductDto = {
        productId: mockProduct._id.toString(),
        quantity: 2,
      };

      mockSalesRepositoryService.exists.mockResolvedValue(true);

      await expect(
        service.addProduct(userId, orderId, addProductDto),
      ).rejects.toThrow(ConflictException);

      expect(mockSalesRepositoryService.exists).toHaveBeenCalledWith({
        order: orderId,
      });
    });
  });

  describe('removeProduct', () => {
    const userId = 'user-id-123';
    const orderId = 'order-id-123';

    it('should remove product completely when quantity equals current quantity', async () => {
      const removeProductDto: RemoveProductDto = {
        productId: mockProduct._id.toString(),
        quantity: 2,
      };

      mockOrdersRepository.findOne
        .mockResolvedValueOnce(mockOrderWithProduct)
        .mockResolvedValueOnce(mockOrderWithProduct);

      mockOrdersRepository.findOneAndUpdate.mockResolvedValueOnce({
        ...mockOrderWithProduct,
        products: [],
        total: 0,
      });

      const result = await service.removeProduct(
        userId,
        orderId,
        removeProductDto,
      );

      expect(mockProductsService.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockProduct._id.toString(), user: userId, isActive: true },
        { $inc: { stock: 2 } },
      );

      expect(result.products).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should decrement quantity when quantity is less than current', async () => {
      const removeProductDto: RemoveProductDto = {
        productId: mockProduct._id.toString(),
        quantity: 1,
      };

      mockOrdersRepository.findOne
        .mockResolvedValueOnce(mockOrderWithProduct)
        .mockResolvedValueOnce(mockOrderWithProduct);

      mockOrdersRepository.findOneAndUpdate.mockResolvedValueOnce({
        ...mockOrderWithProduct,
        products: [
          {
            product: mockProduct._id,
            unitPrice: 120,
            quantity: 1,
          },
        ],
        total: 120,
      });

      const result = await service.removeProduct(
        userId,
        orderId,
        removeProductDto,
      );

      expect(mockProductsService.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockProduct._id.toString(), user: userId, isActive: true },
        { $inc: { stock: 1 } },
      );

      expect(result.products[0].quantity).toBe(1);
      expect(result.total).toBe(120);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      const removeProductDto: RemoveProductDto = {
        productId: mockProduct._id.toString(),
        quantity: 1,
      };

      mockOrdersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeProduct(userId, 'nonexistent-order', removeProductDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when product is not in order', async () => {
      const removeProductDto: RemoveProductDto = {
        productId: new Types.ObjectId().toString(),
        quantity: 1,
      };

      mockOrdersRepository.findOne.mockResolvedValueOnce(mockOrder);

      await expect(
        service.removeProduct(userId, orderId, removeProductDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException when findOneAndUpdate returns null', async () => {
      const removeProductDto: RemoveProductDto = {
        productId: mockProduct._id.toString(),
        quantity: 1,
      };

      mockOrdersRepository.findOne
        .mockResolvedValueOnce(mockOrderWithProduct)
        .mockResolvedValueOnce(mockOrderWithProduct);
      mockOrdersRepository.findOneAndUpdate.mockResolvedValueOnce(null);

      await expect(
        service.removeProduct(userId, orderId, removeProductDto),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw ConflictException when order is already linked to a sale', async () => {
      const removeProductDto: RemoveProductDto = {
        productId: mockProduct._id.toString(),
        quantity: 1,
      };

      mockSalesRepositoryService.exists.mockResolvedValue(true);

      await expect(
        service.removeProduct(userId, orderId, removeProductDto),
      ).rejects.toThrow(ConflictException);

      expect(mockSalesRepositoryService.exists).toHaveBeenCalledWith({
        order: orderId,
      });
    });
  });
});
