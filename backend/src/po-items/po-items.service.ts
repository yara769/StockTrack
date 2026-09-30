import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PoItem } from './entities/po-item.entity';
import { CreatePoItemDto } from './dto/create-po-item.dto';
import { UpdatePoItemDto } from './dto/update-po-item.dto';

@Injectable()
export class PoItemsService {
  constructor(
    @InjectRepository(PoItem)
    private readonly repo: Repository<PoItem>,
  ) {}

  async create(dto: CreatePoItemDto): Promise<PoItem> {
    const entity = this.repo.create(dto);
    // GAP-CALC-03 fixed: compute total server-side
    entity.total = dto.qty * dto.unit_cost;
    return this.repo.save(entity);
  }

  async findAll(): Promise<PoItem[]> {
    // GAP-FILTER-02 fixed: filter active records only
    return this.repo.find({
      where: { is_active: true },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<PoItem> {
    const entity = await this.repo.findOneBy({ id });
    if (!entity)
      throw new NotFoundException(`PoItem with id "${id}" not found`);
    return entity;
  }

  async update(id: string, dto: UpdatePoItemDto): Promise<PoItem> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    // Recalculate total if qty or unit_cost changed
    if (dto.qty !== undefined || dto.unit_cost !== undefined) {
      entity.total = entity.qty * entity.unit_cost;
    }
    return this.repo.save(entity);
  }

  async remove(id: string): Promise<{ message: string }> {
    // GAP-DEL-02 fixed: soft-delete instead of hard delete
    const entity = await this.findOne(id);
    entity.is_active = false;
    await this.repo.save(entity);
    return { message: 'PoItem deactivated successfully' };
  }
}
