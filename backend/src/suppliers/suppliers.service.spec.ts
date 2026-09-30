import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SuppliersService } from './suppliers.service';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

// ─── Mock factory ────────────────────────────────────────────────────────────
const mockSupplier = (): Supplier =>
  ({
    id: 'uuid-supplier-1',
    name: 'شركة النور',
    contact_person: 'أحمد',
    phone: '0501234567',
    email: 'info@noor.com',
    address: 'الرياض',
    is_active: true,
    tenant_id: null,
    created_at: new Date(),
    updated_at: new Date(),
    purchaseOrders: [],
  }) as Supplier;

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  delete: jest.fn(),
});

type MockRepo = ReturnType<typeof mockRepo>;

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('SuppliersService', () => {
  let service: SuppliersService;
  let repo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        { provide: getRepositoryToken(Supplier), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
    repo = module.get<MockRepo>(getRepositoryToken(Supplier));
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('S-01: should create and return a supplier with required fields only', async () => {
      const dto: CreateSupplierDto = { name: 'شركة النور' };
      const entity = mockSupplier();
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(entity);
      expect(result).toEqual(entity);
    });

    it('S-02: should create supplier with all optional fields', async () => {
      const dto: CreateSupplierDto = {
        name: 'شركة البدر',
        contact_person: 'سارة',
        phone: '0559999999',
        email: 'sara@badr.com',
        address: 'جدة، شارع فلسطين',
      };
      const entity = { ...mockSupplier(), ...dto };
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(result.contact_person).toBe('سارة');
      expect(result.email).toBe('sara@badr.com');
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('S-06: should return only active suppliers ordered by created_at DESC', async () => {
      const suppliers = [mockSupplier()];
      repo.find.mockResolvedValue(suppliers);

      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalledWith({
        where: { is_active: true },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(suppliers);
    });

    it('should return empty array when no active suppliers exist', async () => {
      repo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('S-07: should return a supplier by valid UUID', async () => {
      const entity = mockSupplier();
      repo.findOneBy.mockResolvedValue(entity);

      const result = await service.findOne('uuid-supplier-1');

      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 'uuid-supplier-1' });
      expect(result).toEqual(entity);
    });

    it('S-08: should throw NotFoundException when supplier does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('non-existent-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('S-14 (GAP-05): should return soft-deleted supplier — known gap', async () => {
      // findOneBy does NOT filter by is_active — soft-deleted records are returned
      const deleted = { ...mockSupplier(), is_active: false };
      repo.findOneBy.mockResolvedValue(deleted);

      const result = await service.findOne('uuid-supplier-1');

      // Documents current (incorrect) behavior — should be fixed to throw 404
      expect(result.is_active).toBe(false);
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('S-10: should update and return the modified supplier', async () => {
      const entity = mockSupplier();
      const dto: UpdateSupplierDto = { name: 'اسم محدّث' };
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, ...dto });

      const result = await service.update('uuid-supplier-1', dto);

      expect(result.name).toBe('اسم محدّث');
    });

    it('S-11: should throw NotFoundException when updating non-existent supplier', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('bad-uuid', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('S-12: should soft-delete supplier (set is_active=false)', async () => {
      const entity = mockSupplier();
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, is_active: false });

      const result = await service.remove('uuid-supplier-1');

      expect(entity.is_active).toBe(false);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: false }),
      );
      expect(result).toEqual({ message: 'Supplier deactivated successfully' });
    });

    it('S-13: should throw NotFoundException when removing non-existent supplier', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.remove('bad-uuid')).rejects.toThrow(NotFoundException);
    });
  });
});
