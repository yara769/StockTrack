import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer) private readonly repo: Repository<Customer>,
  ) {}
  async create(dto: CreateCustomerDto): Promise<Customer> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }
  async findAll(): Promise<Customer[]> {
    return this.repo.find({
      where: { is_active: true },
      order: { created_at: 'DESC' },
    });
  }
  async findOne(id: string): Promise<Customer> {
    const entity = await this.repo.findOneBy({ id });
    if (!entity)
      throw new NotFoundException(`Customer with id "${id}" not found`);
    return entity;
  }
  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }
  async remove(id: string): Promise<{ message: string }> {
    const entity = await this.findOne(id);
    entity.is_active = false;
    await this.repo.save(entity);
    return { message: 'Customer deactivated successfully' };
  }
}
