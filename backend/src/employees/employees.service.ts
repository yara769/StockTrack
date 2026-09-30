import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { Employee } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly repo: Repository<Employee>,
  ) {}

  /** Hash PIN using SHA-256 (one-way, no plaintext stored) */
  private hashPin(pin: string): string {
    return createHash('sha256').update(pin).digest('hex');
  }

  async create(dto: CreateEmployeeDto): Promise<Employee> {
    const payload = { ...dto };
    if (payload.pin) {
      payload.pin = this.hashPin(payload.pin);
    }
    const entity = this.repo.create(payload);
    return this.repo.save(entity);
  }

  async findAll(): Promise<Employee[]> {
    return this.repo.find({
      where: { is_active: true },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Employee> {
    const entity = await this.repo.findOneBy({ id });
    if (!entity)
      throw new NotFoundException(`Employee with id "${id}" not found`);
    return entity;
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    const entity = await this.findOne(id);
    const payload = { ...dto };
    if (payload.pin) {
      payload.pin = this.hashPin(payload.pin);
    }
    Object.assign(entity, payload);
    return this.repo.save(entity);
  }

  async remove(id: string): Promise<{ message: string }> {
    const entity = await this.findOne(id);
    entity.is_active = false;
    await this.repo.save(entity);
    return { message: 'Employee deactivated successfully' };
  }
}
