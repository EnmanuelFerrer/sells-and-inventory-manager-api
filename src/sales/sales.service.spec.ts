import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesRepositoryService } from './repositories/sales-repository.service';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Sale } from '../common/schemas/sale.schema';
import { Order } from '../common/schemas/order.schema';
import { User } from '../common/schemas/users.schema';
import { Product } from '../common/schemas/product.schema';
import { SaleStatusesEnum } from '../common/enums/sale-statuses.enum';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';
import { Types } from 'mongoose';
import { RolesEnum } from '../common/enums/roles.enum';

describe('SalesService', () => {
  let service: SalesService;
  let mockSalesRepository: {
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    exists: jest.Mock;
  };
  let mockUsersService: {
    findOne: jest.Mock;
  };
  let mockOrdersService: {
    findOne: jest.Mock;
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

  const mockProduct: Product = {
    _id: new Types.ObjectId(),
    name: 'Product 1',
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
    exchangeRate: new Types.ObjectId(),
    products: [{ product: mockProduct._id, quantity: 2, unitPrice: 120 }],
    total: 240,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSale: Sale = {
    _id: new Types.ObjectId(),
    user: mockUser._id,
    order: mockOrder._id,
    status: SaleStatusesEnum.COMPLETED,
    createdAt: new Date(),
    updatedAt: new Date(),
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
      exists: jest.fn().mockResolvedValue(false),
    };

    mockUsersService = {
      findOne: jest.fn().mockResolvedValue(mockUser),
    };

    mockOrdersService = {
      findOne: jest.fn().mockResolvedValue(mockOrder),
      exists: jest.fn().mockResolvedValue(false),
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
          provide: OrdersService,
          useValue: mockOrdersService,
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
        orderId: mockOrder._id.toString(),
        status: SaleStatusesEnum.COMPLETED,
      };

      const result = await service.create(userId, createSaleDto);

      expect(mockUsersService.findOne).toHaveBeenCalledWith({ _id: userId });
      expect(mockOrdersService.findOne).toHaveBeenCalledWith({
        _id: mockOrder._id.toString(),
        user: userId,
      });
      expect(mockSalesRepository.create).toHaveBeenCalledWith({
        user: mockUser,
        order: mockOrder,
        status: SaleStatusesEnum.COMPLETED,
      });
      expect(result).toEqual(mockSale);
    });

    it('should calculate total correctly from order products', async () => {
      const createSaleDto: CreateSaleDto = {
        orderId: mockOrder._id.toString(),
        status: SaleStatusesEnum.COMPLETED,
      };

      await service.create(userId, createSaleDto);

      expect(mockSalesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
          order: mockOrder,
          status: SaleStatusesEnum.COMPLETED,
        }),
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const createSaleDto: CreateSaleDto = {
        orderId: mockOrder._id.toString(),
        status: SaleStatusesEnum.COMPLETED,
      };

      mockUsersService.findOne.mockRejectedValue(
        new NotFoundException('User not found.'),
      );

      await expect(service.create(userId, createSaleDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when order has no products', async () => {
      const createSaleDto: CreateSaleDto = {
        orderId: mockOrder._id.toString(),
        status: SaleStatusesEnum.COMPLETED,
      };

      mockOrdersService.findOne.mockResolvedValue({
        ...mockOrder,
        products: [],
      });

      await expect(service.create(userId, createSaleDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when sale already exists for order', async () => {
      const createSaleDto: CreateSaleDto = {
        orderId: mockOrder._id.toString(),
        status: SaleStatusesEnum.COMPLETED,
      };

      mockSalesRepository.exists.mockResolvedValue(true);

      await expect(service.create(userId, createSaleDto)).rejects.toThrow(
        ConflictException,
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

  describe('exists', () => {
    it('should return true when sale exists', async () => {
      mockSalesRepository.exists.mockResolvedValue(true);

      const result = await service.exists({ _id: 'sale-id-123' });

      expect(mockSalesRepository.exists).toHaveBeenCalledWith({
        _id: 'sale-id-123',
      });
      expect(result).toBe(true);
    });

    it('should return false when sale does not exist', async () => {
      mockSalesRepository.exists.mockResolvedValue(false);

      const result = await service.exists({ _id: 'nonexistent' });

      expect(result).toBe(false);
    });
  });
});
