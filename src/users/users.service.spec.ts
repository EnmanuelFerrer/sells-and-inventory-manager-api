import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepositoryService } from './repositories/users-repository.service';
import { User } from '../common/schemas/users.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';
import { IPagination } from '../common/interfaces/pagination.interface';
import { RolesEnum } from '../common/enums/roles.enum';
import { Types } from 'mongoose';

describe('UsersService', () => {
  let service: UsersService;
  let mockUsersRepository: {
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    exists: jest.Mock;
  };

  const mockUser = {
    _id: new Types.ObjectId(),
    username: 'testuser',
    password: 'hashedpassword',
    rol: RolesEnum.USER,
    isActive: true,
  };

  const mockPaginatedResult: IPagination<User> = {
    items: [mockUser],
    skip: 0,
    limit: 25,
    totalItems: 1,
    totalPages: 1,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockUsersRepository = {
      create: jest.fn().mockResolvedValue(mockUser),
      find: jest.fn().mockResolvedValue(mockPaginatedResult),
      findOne: jest.fn().mockResolvedValue(mockUser),
      exists: jest.fn().mockResolvedValue(false),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepositoryService,
          useValue: mockUsersRepository,
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

      mockUsersRepository.exists.mockResolvedValue(false);

      const result = await service.create(createUserDto);

      expect(mockUsersRepository.exists).toHaveBeenCalledWith({
        username: createUserDto.username,
      });
      expect(mockUsersRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if user already exists', async () => {
      const createUserDto: CreateUserDto = {
        username: 'testuser',
        password: 'Password1!',
      };

      mockUsersRepository.exists.mockResolvedValue(true);

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

      expect(mockUsersRepository.find).toHaveBeenCalledWith(
        {},
        {},
        { skip: 0, limit: 25 },
      );
      expect(result.items).toHaveLength(1);
      expect(result.totalItems).toBe(1);
    });

    it('should handle empty results', async () => {
      mockUsersRepository.find.mockResolvedValue({
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

      const result = await service.findAll({}, {}, {}, paginationDto);

      expect(result.items).toHaveLength(0);
      expect(result.totalItems).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      const result = await service.findOne({ _id: 'user-id-123' });

      expect(mockUsersRepository.findOne).toHaveBeenCalledWith(
        { _id: 'user-id-123' },
        {},
        {},
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne({ _id: 'nonexistent' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should accept queryFilter, projection, and options', async () => {
      const queryFilter = { username: 'testuser' };
      const projection = { username: 1 };
      const options = { sort: { username: 1 } };

      await service.findOne(queryFilter, projection, options);

      expect(mockUsersRepository.findOne).toHaveBeenCalledWith(
        queryFilter,
        projection,
        options,
      );
    });
  });
});
