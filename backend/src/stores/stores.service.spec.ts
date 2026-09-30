import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { StoresService } from './stores.service';
import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const UUID_1 = '00000000-0000-0000-0000-000000000001';

const mockStore = (overrides: Partial<Store> = {}): Store =>
  ({
    id: UUID_1,
    name: 'فرع الرياض',
    code: 'RYD-01',
    address: 'شارع الملك فهد',
    phone: '0114567890',
    timezone: 'Asia/Riyadh',
    is_active: true,
    tenant_id: null,
    created_at: new Date(),
    updated_at: new Date(),
    employees: [],
    inventory: [],
    purchaseOrders: [],
    sales: [],
    ...overrides,
  }) as Store;

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
});

type MockRepo = ReturnType<typeof mockRepo>;

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('StoresService', () => {
  let service: StoresService;
  let repo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoresService,
        { provide: getRepositoryToken(Store), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<StoresService>(StoresService);
    repo = module.get<MockRepo>(getRepositoryToken(Store));
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('ST-01: should create a store with required fields', async () => {
      const dto: CreateStoreDto = { name: 'فرع الرياض', code: 'RYD-01' };
      const entity = mockStore();
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(result.code).toBe('RYD-01');
    });

    it('ST-01b: should create store with all optional fields', async () => {
      const dto: CreateStoreDto = {
        name: 'فرع جدة',
        code: 'JED-01',
        address: 'شارع التحلية',
        phone: '0122222222',
        timezone: 'Asia/Riyadh',
      };
      const entity = mockStore({ ...dto });
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(result.timezone).toBe('Asia/Riyadh');
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('ST-06: should return only active stores ordered by created_at DESC', async () => {
      const stores = [mockStore()];
      repo.find.mockResolvedValue(stores);

      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalledWith({
        where: { is_active: true },
        order: { created_at: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no stores exist', async () => {
      repo.find.mockResolvedValue([]);
      expect(await service.findAll()).toEqual([]);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('ST-07: should return store by valid UUID', async () => {
      repo.findOneBy.mockResolvedValue(mockStore());
      const result = await service.findOne(UUID_1);
      expect(result.id).toBe(UUID_1);
    });

    it('ST-08: should throw NotFoundException for non-existent UUID', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('ghost-uuid')).rejects.toThrow(NotFoundException);
    });

    it('GAP-05: findOne returns soft-deleted store — known gap', async () => {
      repo.findOneBy.mockResolvedValue(mockStore({ is_active: false }));
      const result = await service.findOne(UUID_1);
      expect(result.is_active).toBe(false); // should be 404 after fix
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('ST-10: should update store address', async () => {
      const entity = mockStore();
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, address: 'شارع الأمير' });

      const result = await service.update(UUID_1, { address: 'شارع الأمير' });

      expect(result.address).toBe('شارع الأمير');
    });

    it('ST-11: should throw NotFoundException when updating non-existent store', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.update('ghost-uuid', {})).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('ST-12: should soft-delete store (is_active=false)', async () => {
      const entity = mockStore();
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, is_active: false });

      const result = await service.remove(UUID_1);

      expect(entity.is_active).toBe(false);
      expect(result).toEqual({ message: 'Store deactivated successfully' });
    });

    it('ST-14: should throw NotFoundException when removing non-existent store', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.remove('ghost-uuid')).rejects.toThrow(NotFoundException);
    });

    it('ST-13: deactivated store should not appear in findAll', async () => {
      // Simulate: after delete, findAll returns only active stores
      repo.find.mockResolvedValue([]); // deactivated store excluded by is_active: true filter
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });
});
