import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleItem } from './entities/sale-item.entity';
import { CreateSaleItemDto } from './dto/create-sale-item.dto';
import { UpdateSaleItemDto } from './dto/update-sale-item.dto';

@Injectable()
export class SaleItemsService {
  constructor(
    @InjectRepository(SaleItem)
    private readonly repo: Repository<SaleItem>,
  ) {}

  async create(dto: CreateSaleItemDto): Promise<SaleItem> {
    const entity = this.repo.create(dto);
    // GAP-CALC-02 fixed: compute total server-side
    entity.total = dto.qty * dto.unit_price;
    return this.repo.save(entity);
  }

  async findAll(): Promise<SaleItem[]> {
    // GAP-FILTER-03 fixed: filter active records only
    return this.repo.find({
      where: { is_active: true },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<SaleItem> {
    const entity = await this.repo.findOneBy({ id });
    if (!entity)
      throw new NotFoundException(`SaleItem with id "${id}" not found`);
    return entity;
  }

  async update(id: string, dto: UpdateSaleItemDto): Promise<SaleItem> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    // Recalculate total if qty or unit_price changed
    if (dto.qty !== undefined || dto.unit_price !== undefined) {
      entity.total = entity.qty * entity.unit_price;
    }
    return this.repo.save(entity);
  }

  async remove(id: string): Promise<{ message: string }> {
    // GAP-DEL-03 fixed: soft-delete instead of hard delete
    const entity = await this.findOne(id);
    entity.is_active = false;
    await this.repo.save(entity);
    return { message: 'SaleItem deactivated successfully' };
  }
}
