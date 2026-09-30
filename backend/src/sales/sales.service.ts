import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly repo: Repository<Sale>,
  ) {}

  async create(dto: CreateSaleDto): Promise<Sale> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async findAll(): Promise<Sale[]> {
    return this.repo.find({
      where: { is_active: true },
      order: { sold_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Sale> {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) throw new NotFoundException(`Sale with id "${id}" not found`);
    return entity;
  }

  async update(id: string, dto: UpdateSaleDto): Promise<Sale> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async remove(id: string): Promise<{ message: string }> {
    const entity = await this.findOne(id);
    entity.is_active = false;
    await this.repo.save(entity);
    return { message: 'Sale deactivated successfully' };
  }
}
