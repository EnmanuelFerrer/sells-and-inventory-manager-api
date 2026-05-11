import { Injectable } from '@nestjs/common';
import { OrdersRepositoryService } from './repositories/orders-repository.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepositoryService: OrdersRepositoryService,
  ) {}

  async create() {}
  async find() {}
  async findOne() {}
  async deleteOne() {}

  private async addProduct() {}
  private async checkStock() {}
  private async incrementProductQuantity() {}
  private async decrementProductQuantity() {}
  private async removeProduct() {}
}
