import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesRepositoryService } from './repositories/sales-repository.service';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Sale } from '../common/schemas/sale.schema';
import { Product } from '../common/schemas/product.schema';
import { ProductStockOperationsEnum } from '../common/enums/product-stock-operations.enum';
import { IPagination } from '../common/interfaces/pagination.interface';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';
import { Types } from 'mongoose';

describe('SalesService', () => {
  let service: SalesService;
  let mockSalesRepository: {
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let mockUsersService: {
    exists: jest.Mock;
  };
  let mockProductsService: {
    count: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    stockOperation: jest.Mock;
  };

  const mockProduct1: Product = {
    _id: new Types.ObjectId(),
    name: 'Product 1',
    cost: 100,
    gain: 20,
    price: 120,
    stock: 10,
    isActive: true,
    user: new Types.ObjectId(),
    brand: new Types.ObjectId(),
  };

  const mockProduct2: Product = {
    _id: new Types.ObjectId(),
    name: 'Product 2',
    cost: 50,
    gain: 10,
    price: 55,
    stock: 5,
    isActive: true,
    user: new Types.ObjectId(),
    brand: new Types.ObjectId(),
  };

  const mockSale: Sale = {
    _id: new Types.ObjectId(),
    user: new Types.ObjectId(),
    saleProducts: [
      {
        product: mockProduct1._id,
        quantity: 2,
        unitPrice: 120,
      },
      {
        product: mockProduct2._id,
        quantity: 1,
        unitPrice: 55,
      },
    ],
    total: 295,
  };

  const mockProductsPagination: IPagination<Product> = {
    items: [mockProduct1, mockProduct2],
    skip: 0,
    limit: 25,
    totalItems: 2,
    totalPages: 1,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockSalesRepository = {
      create: jest.fn().mockResolvedValue(mockSale),
      find: jest.fn().mockResolvedValue({
        items: [mockSale],
        skip: 0,
        limit: 25,
        totalItems: 1,
        totalPages: 1,
      }),
      findOne: jest.fn().mockResolvedValue(mockSale),
    };

    mockUsersService = {
      exists: jest.fn().mockResolvedValue(undefined),
    };

    mockProductsService = {
      count: jest.fn().mockResolvedValue(2),
      find: jest.fn().mockResolvedValue(mockProductsPagination),
      findOne: jest.fn(),
      stockOperation: jest.fn().mockResolvedValue(mockProduct1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        {
          provide: SalesRepositoryService,
          useValue: mockSalesRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = '507f1f77bcf86cd799439011';

    it('should create a sale successfully', async () => {
      const createSaleDto: CreateSaleDto = {
        saleProducts: [
          { productId: mockProduct1._id.toString(), quantity: 2 },
          { productId: mockProduct2._id.toString(), quantity: 1 },
        ],
      };

      mockProductsService.findOne
        .mockResolvedValueOnce(mockProduct1)
        .mockResolvedValueOnce(mockProduct2);

      const result = await service.create(userId, createSaleDto);

      expect(mockUsersService.exists).toHaveBeenCalledWith({ _id: userId });
      expect(mockProductsService.count).toHaveBeenCalled();
      expect(mockProductsService.find).toHaveBeenCalled();
      expect(mockSalesRepository.create).toHaveBeenCalled();
      expect(result).toEqual(mockSale);
    });

    it('should calculate total correctly based on product prices', async () => {
      const createSaleDto: CreateSaleDto = {
        saleProducts: [
          { productId: mockProduct1._id.toString(), quantity: 2 },
          { productId: mockProduct2._id.toString(), quantity: 1 },
        ],
      };

      mockProductsService.findOne
        .mockResolvedValueOnce(mockProduct1)
        .mockResolvedValueOnce(mockProduct2);

      await service.create(userId, createSaleDto);

      expect(mockSalesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: new Types.ObjectId(userId),
          total: 295, // (120 * 2) + (55 * 1)
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          saleProducts: expect.arrayContaining([
            expect.objectContaining({ quantity: 2, unitPrice: 120 }),
            expect.objectContaining({ quantity: 1, unitPrice: 55 }),
          ]),
        }),
      );
    });

    it('should decrement stock for each product', async () => {
      const createSaleDto: CreateSaleDto = {
        saleProducts: [
          { productId: mockProduct1._id.toString(), quantity: 2 },
          { productId: mockProduct2._id.toString(), quantity: 1 },
        ],
      };

      mockProductsService.findOne
        .mockResolvedValueOnce(mockProduct1)
        .mockResolvedValueOnce(mockProduct2);

      await service.create(userId, createSaleDto);

      expect(mockProductsService.stockOperation).toHaveBeenCalledTimes(2);
      expect(mockProductsService.stockOperation).toHaveBeenCalledWith(
        userId,
        mockProduct1._id.toString(),
        {
          operation: ProductStockOperationsEnum.DECREMENT,
          quantity: 2,
        },
      );
      expect(mockProductsService.stockOperation).toHaveBeenCalledWith(
        userId,
        mockProduct2._id.toString(),
        {
          operation: ProductStockOperationsEnum.DECREMENT,
          quantity: 1,
        },
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const createSaleDto: CreateSaleDto = {
        saleProducts: [{ productId: mockProduct1._id.toString(), quantity: 2 }],
      };

      mockUsersService.exists.mockRejectedValue(
        new NotFoundException('User not found.'),
      );

      await expect(service.create(userId, createSaleDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when product is not found', async () => {
      const createSaleDto: CreateSaleDto = {
        saleProducts: [
          { productId: new Types.ObjectId().toString(), quantity: 2 },
        ],
      };

      mockProductsService.count.mockResolvedValue(1);
      mockProductsService.find.mockResolvedValue({
        items: [mockProduct1],
        skip: 0,
        limit: 25,
        totalItems: 1,
        totalPages: 1,
      });

      await expect(service.create(userId, createSaleDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when product does not have enough stock', async () => {
      const createSaleDto: CreateSaleDto = {
        saleProducts: [
          { productId: mockProduct1._id.toString(), quantity: 15 },
        ],
      };

      mockProductsService.count.mockResolvedValue(1);
      mockProductsService.find.mockResolvedValue({
        items: [mockProduct1],
        skip: 0,
        limit: 25,
        totalItems: 1,
        totalPages: 1,
      });

      await expect(service.create(userId, createSaleDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException with multiple error messages', async () => {
      const createSaleDto: CreateSaleDto = {
        saleProducts: [
          { productId: new Types.ObjectId().toString(), quantity: 2 },
          { productId: mockProduct1._id.toString(), quantity: 15 },
        ],
      };

      mockProductsService.count.mockResolvedValue(1);
      mockProductsService.find.mockResolvedValue({
        items: [mockProduct1],
        skip: 0,
        limit: 25,
        totalItems: 1,
        totalPages: 1,
      });

      await expect(service.create(userId, createSaleDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should validate all products before creating sale', async () => {
      const createSaleDto: CreateSaleDto = {
        saleProducts: [
          { productId: mockProduct1._id.toString(), quantity: 2 },
          { productId: mockProduct2._id.toString(), quantity: 3 },
        ],
      };

      mockProductsService.findOne
        .mockResolvedValueOnce(mockProduct1)
        .mockResolvedValueOnce(mockProduct2);

      await service.create(userId, createSaleDto);

      expect(mockProductsService.count).toHaveBeenCalledWith(
        expect.objectContaining({
          user: userId,
          _id: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            $in: expect.arrayContaining([
              mockProduct1._id.toString(),
              mockProduct2._id.toString(),
            ]),
          },
        }),
      );
    });
  });

  describe('find', () => {
    it('should return paginated sales', async () => {
      const paginationDto: PaginationQueryDto = {
        skip: 0,
        limit: 25,
      };

      const result = await service.find(
        { user: 'user-id-123' },
        {},
        {},
        paginationDto,
      );

      expect(mockSalesRepository.find).toHaveBeenCalledWith(
        { user: 'user-id-123' },
        {},
        {},
        { skip: 0, limit: 25 },
      );
      expect(result.items).toHaveLength(1);
      expect(result.totalItems).toBe(1);
    });

    it('should handle empty results', async () => {
      mockSalesRepository.find.mockResolvedValue({
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

      const result = await service.find(
        { user: 'user-id-123' },
        {},
        {},
        paginationDto,
      );

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

      expect(mockSalesRepository.find).toHaveBeenCalledWith(
        queryFilter,
        projection,
        options,
        { skip: 10, limit: 10 },
      );
    });
  });

  describe('findOne', () => {
    it('should return a sale when found', async () => {
      const result = await service.findOne({
        _id: 'sale-id-789',
        user: 'user-id-123',
      });

      expect(mockSalesRepository.findOne).toHaveBeenCalledWith(
        { _id: 'sale-id-789', user: 'user-id-123' },
        {},
        {},
      );
      expect(result).toEqual(mockSale);
    });

    it('should throw NotFoundException when sale not found', async () => {
      mockSalesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne({ _id: 'nonexistent', user: 'user-id-123' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should accept queryFilter, projection, and options', async () => {
      const queryFilter = { _id: 'sale-id-789', user: 'user-id-123' };
      const projection = { saleProducts: 1 };
      const options = { sort: { createdAt: -1 } };

      await service.findOne(queryFilter, projection, options);

      expect(mockSalesRepository.findOne).toHaveBeenCalledWith(
        queryFilter,
        projection,
        options,
      );
    });
  });
});
