import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Return } from './entities/return.entity';
import { Sale } from '../sales/entities/sale.entity';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDto } from './dto/update-return.dto';

@Injectable()
export class ReturnsService {
  constructor(
    @InjectRepository(Return)
    private readonly repo: Repository<Return>,
    @InjectRepository(Sale)
    private readonly saleRepo: Repository<Sale>,
  ) {}

  async create(dto: CreateReturnDto): Promise<Return> {
    // GAP-INT-02 fixed: validate that the referenced sale exists and is active
    const sale = await this.saleRepo.findOneBy({
      id: dto.sale_id,
      is_active: true,
    });
    if (!sale)
      throw new NotFoundException(
        `Sale with id "${dto.sale_id}" not found or inactive`,
      );

    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async findAll(): Promise<Return[]> {
    return this.repo.find({
      where: { is_active: true },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Return> {
    const entity = await this.repo.findOneBy({ id });
    if (!entity)
      throw new NotFoundException(`Return with id "${id}" not found`);
    return entity;
  }

  async update(id: string, dto: UpdateReturnDto): Promise<Return> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async remove(id: string): Promise<{ message: string }> {
    const entity = await this.findOne(id);
    entity.is_active = false;
    await this.repo.save(entity);
    return { message: 'Return deactivated successfully' };
  }
}
