import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User } from '../common/schemas/users.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserModel: {
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    exists: jest.Mock;
  };

  const mockUser = {
    _id: 'user-id-123',
    username: 'testuser',
    password: 'hashedpassword',
    rol: 'user',
    isActive: true,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const createQueryMock = (resolvedValue: unknown) => {
      const mockQuery = Promise.resolve(resolvedValue);
      return mockQuery;
    };

    mockUserModel = {
      create: jest.fn().mockResolvedValue(mockUser),
      find: jest.fn().mockImplementation(() => createQueryMock([mockUser])),
      findOne: jest.fn().mockImplementation(() => createQueryMock(mockUser)),
      exists: jest.fn().mockImplementation(() => createQueryMock(true)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        username: 'testuser',
        password: 'Password1!',
      };

      mockUserModel.exists.mockImplementation(() => Promise.resolve(false));

      const result = await service.create(createUserDto);

      expect(mockUserModel.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if user already exists', async () => {
      const createUserDto: CreateUserDto = {
        username: 'testuser',
        password: 'Password1!',
      };

      mockUserModel.exists.mockImplementation(() => Promise.resolve(true));

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const paginationDto: PaginationQueryDto = {
        skip: 0,
        limit: 25,
      };

      const result = await service.findAll({}, {}, {}, paginationDto);

      expect(mockUserModel.find).toHaveBeenCalledWith(
        {},
        {},
        { skip: 0, limit: 25 },
      );
      expect(result.items).toHaveLength(1);
      expect(result.itemsCount).toBe(1);
    });

    it('should handle empty results', async () => {
      mockUserModel.find.mockImplementation(() => Promise.resolve([]));

      const paginationDto: PaginationQueryDto = {
        skip: 0,
        limit: 25,
      };

      const result = await service.findAll({}, {}, {}, paginationDto);

      expect(result.items).toHaveLength(0);
      expect(result.itemsCount).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      const result = await service.findOne({ _id: 'user-id-123' });

      expect(mockUserModel.findOne).toHaveBeenCalledWith(
        { _id: 'user-id-123' },
        {},
        {},
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findOne.mockImplementation(() => Promise.resolve(null));

      await expect(service.findOne({ _id: 'nonexistent' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should accept queryFilter, projection, and options', async () => {
      const queryFilter = { username: 'testuser' };
      const projection = { username: 1 };
      const options = { sort: { username: 1 } };

      await service.findOne(queryFilter, projection, options);

      expect(mockUserModel.findOne).toHaveBeenCalledWith(
        queryFilter,
        projection,
        options,
      );
    });
  });
});
