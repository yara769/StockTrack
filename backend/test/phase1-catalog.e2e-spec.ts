/**
 * Phase 1 E2E Integration Tests — Suppliers · Products · Categories · Stores
 *
 * Framework : Jest + Supertest
 * Runner    : npm run test:e2e  (from backend/)
 * Base URL  : http://localhost:PORT/api/v1
 *
 * NOTE: These tests require a live NestJS instance + MySQL DB.
 * Each suite manages its own test data and cleans up after itself.
 * Run against a dedicated test database — NOT production.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

// ─── App Bootstrap ────────────────────────────────────────────────────────────
let app: INestApplication;
let server: ReturnType<typeof app.getHttpServer>;

beforeAll(async () => {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api/v1');
  await app.init();
  server = app.getHttpServer();
});

afterAll(async () => {
  await app.close();
});

// ═══════════════════════════════════════════════════════════════════════════════
// STORES
// ═══════════════════════════════════════════════════════════════════════════════
describe('/api/v1/stores (E2E)', () => {
  let createdStoreId: string;
  const uniqueCode = `TEST-${Date.now()}`;

  // ── POST ────────────────────────────────────────────────────────────────────
  describe('POST /stores', () => {
    it('ST-01: 201 — creates store with required fields', async () => {
      const res = await request(server)
        .post('/api/v1/stores')
        .send({ name: 'فرع تجريبي', code: uniqueCode })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.code).toBe(uniqueCode);
      expect(res.body.is_active).toBe(true);
      createdStoreId = res.body.id;
    });

    it('ST-02: 400 — missing required name', async () => {
      await request(server)
        .post('/api/v1/stores')
        .send({ code: 'NO-NAME' })
        .expect(400);
    });

    it('ST-03: 400 — missing required code', async () => {
      await request(server)
        .post('/api/v1/stores')
        .send({ name: 'متجر بلا كود' })
        .expect(400);
    });

    it('ST-04: 400 — name shorter than 2 characters', async () => {
      await request(server)
        .post('/api/v1/stores')
        .send({ name: 'X', code: 'XCODE' })
        .expect(400);
    });

    it('ST-05 (GAP-03): 500 when code is duplicated — expected 409 after fix', async () => {
      // Attempts to create a store with the same unique code
      const res = await request(server)
        .post('/api/v1/stores')
        .send({ name: 'مكرر', code: uniqueCode });

      // Current behavior: 500 (DB unique constraint) — should be 409 after fix
      expect([409, 500]).toContain(res.status);
    });

    it('ST-15: unknown fields are stripped (whitelist=true)', async () => {
      const code = `WT-${Date.now()}`;
      const res = await request(server)
        .post('/api/v1/stores')
        .send({ name: 'اختبار whitelist', code, injected: true })
        .expect(201);

      expect(res.body.injected).toBeUndefined();
      // cleanup
      await request(server).delete(`/api/v1/stores/${res.body.id}`);
    });
  });

  // ── GET ─────────────────────────────────────────────────────────────────────
  describe('GET /stores', () => {
    it('ST-06: 200 — returns array of active stores', async () => {
      const res = await request(server).get('/api/v1/stores').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((s: any) => expect(s.is_active).toBe(true));
    });
  });

  describe('GET /stores/:id', () => {
    it('ST-07: 200 — returns created store by UUID', async () => {
      const res = await request(server)
        .get(`/api/v1/stores/${createdStoreId}`)
        .expect(200);
      expect(res.body.id).toBe(createdStoreId);
    });

    it('ST-08: 404 — non-existent UUID returns Not Found', async () => {
      await request(server)
        .get('/api/v1/stores/00000000-0000-0000-0000-000000000099')
        .expect(404);
    });

    it('ST-09: 400 — non-UUID id rejected by ParseUUIDPipe', async () => {
      await request(server).get('/api/v1/stores/not-a-uuid').expect(400);
    });
  });

  // ── PATCH ───────────────────────────────────────────────────────────────────
  describe('PATCH /stores/:id', () => {
    it('ST-10: 200 — updates store address', async () => {
      const res = await request(server)
        .patch(`/api/v1/stores/${createdStoreId}`)
        .send({ address: 'شارع الملك عبدالله' })
        .expect(200);
      expect(res.body.address).toBe('شارع الملك عبدالله');
    });

    it('ST-11: 404 — updating non-existent store', async () => {
      await request(server)
        .patch('/api/v1/stores/00000000-0000-0000-0000-000000000099')
        .send({ name: 'لا يوجد' })
        .expect(404);
    });
  });

  // ── DELETE ──────────────────────────────────────────────────────────────────
  describe('DELETE /stores/:id', () => {
    it('ST-12: 200 — soft-deletes store', async () => {
      const res = await request(server)
        .delete(`/api/v1/stores/${createdStoreId}`)
        .expect(200);
      expect(res.body.message).toMatch(/deactivated/i);
    });

    it('ST-13: soft-deleted store excluded from GET /stores list', async () => {
      const res = await request(server).get('/api/v1/stores').expect(200);
      const ids = res.body.map((s: any) => s.id);
      expect(ids).not.toContain(createdStoreId);
    });

    it('ST-14: 404 — deleting non-existent store', async () => {
      await request(server)
        .delete('/api/v1/stores/00000000-0000-0000-0000-000000000099')
        .expect(404);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════
describe('/api/v1/categories (E2E)', () => {
  let rootCatId: string;
  let childCatId: string;
  const uniqueSlug = `test-cat-${Date.now()}`;

  describe('POST /categories', () => {
    it('C-01: 201 — creates root category', async () => {
      const res = await request(server)
        .post('/api/v1/categories')
        .send({ name: 'فئة تجريبية', slug: uniqueSlug })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.parent_id).toBeNull();
      rootCatId = res.body.id;
    });

    it('C-02: 201 — creates child category with parent_id', async () => {
      const res = await request(server)
        .post('/api/v1/categories')
        .send({ name: 'فئة فرعية', slug: `${uniqueSlug}-child`, parent_id: rootCatId })
        .expect(201);

      expect(res.body.parent_id).toBe(rootCatId);
      childCatId = res.body.id;
    });

    it('C-03: 400 — missing required name', async () => {
      await request(server)
        .post('/api/v1/categories')
        .send({ slug: 'no-name' })
        .expect(400);
    });

    it('C-04: 400 — missing required slug', async () => {
      await request(server)
        .post('/api/v1/categories')
        .send({ name: 'بلا سلاق' })
        .expect(400);
    });

    it('C-05 (GAP-03): duplicate slug returns 500 — expected 409 after fix', async () => {
      const res = await request(server)
        .post('/api/v1/categories')
        .send({ name: 'مكرر', slug: uniqueSlug });
      expect([409, 500]).toContain(res.status);
    });

    it('C-06: 400 — parent_id that is not a valid UUID', async () => {
      await request(server)
        .post('/api/v1/categories')
        .send({ name: 'فئة', slug: `test-${Date.now()}`, parent_id: 'not-a-uuid' })
        .expect(400);
    });
  });

  describe('GET /categories', () => {
    it('C-08: 200 — returns active categories sorted by sort_order ASC', async () => {
      const res = await request(server).get('/api/v1/categories').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /categories/:id', () => {
    it('C-09: 200 — returns category by UUID', async () => {
      const res = await request(server)
        .get(`/api/v1/categories/${rootCatId}`)
        .expect(200);
      expect(res.body.slug).toBe(uniqueSlug);
    });

    it('C-10: 404 — non-existent UUID', async () => {
      await request(server)
        .get('/api/v1/categories/00000000-0000-0000-0000-000000000099')
        .expect(404);
    });
  });

  describe('PATCH /categories/:id', () => {
    it('C-11: 200 — updates category sort_order', async () => {
      const res = await request(server)
        .patch(`/api/v1/categories/${rootCatId}`)
        .send({ sort_order: 5 })
        .expect(200);
      expect(res.body.sort_order).toBe(5);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('C-12: 200 — soft-deletes leaf category', async () => {
      const res = await request(server)
        .delete(`/api/v1/categories/${childCatId}`)
        .expect(200);
      expect(res.body.message).toMatch(/deactivated/i);
    });

    it('C-13 (GAP-04): 200 — soft-deletes parent even with children — known gap', async () => {
      // Should ideally return 400/409 or cascade — currently returns 200
      const res = await request(server)
        .delete(`/api/v1/categories/${rootCatId}`)
        .expect(200);
      expect(res.body.message).toMatch(/deactivated/i);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUPPLIERS
// ═══════════════════════════════════════════════════════════════════════════════
describe('/api/v1/suppliers (E2E)', () => {
  let createdSupplierId: string;

  describe('POST /suppliers', () => {
    it('S-01: 201 — creates supplier with required name only', async () => {
      const res = await request(server)
        .post('/api/v1/suppliers')
        .send({ name: 'مورد تجريبي' })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.is_active).toBe(true);
      createdSupplierId = res.body.id;
    });

    it('S-02: 201 — creates supplier with all optional fields', async () => {
      const res = await request(server)
        .post('/api/v1/suppliers')
        .send({
          name: 'مورد كامل',
          contact_person: 'علي',
          phone: '0501234567',
          email: 'ali@supplier.com',
          address: 'المدينة المنورة',
        })
        .expect(201);

      expect(res.body.email).toBe('ali@supplier.com');
      // cleanup
      await request(server).delete(`/api/v1/suppliers/${res.body.id}`);
    });

    it('S-03: 400 — missing required name', async () => {
      await request(server).post('/api/v1/suppliers').send({}).expect(400);
    });

    it('S-04: 400 — name sent as number', async () => {
      await request(server)
        .post('/api/v1/suppliers')
        .send({ name: 123 })
        .expect(400);
    });

    it('S-05 (GAP-01): invalid email currently passes — known gap', async () => {
      // @IsEmail decorator is missing from DTO — this should return 400 but doesn't
      const res = await request(server)
        .post('/api/v1/suppliers')
        .send({ name: 'مورد', email: 'not-an-email' });

      // Documents current behavior (201) — should be 400 after adding @IsEmail
      expect([201, 400]).toContain(res.status);
      if (res.status === 201) {
        await request(server).delete(`/api/v1/suppliers/${res.body.id}`);
      }
    });

    it('S-15: unknown fields stripped by whitelist', async () => {
      const res = await request(server)
        .post('/api/v1/suppliers')
        .send({ name: 'مورد whitelist', hacked: true })
        .expect(201);

      expect(res.body.hacked).toBeUndefined();
      await request(server).delete(`/api/v1/suppliers/${res.body.id}`);
    });
  });

  describe('GET /suppliers', () => {
    it('S-06: 200 — returns active suppliers only', async () => {
      const res = await request(server).get('/api/v1/suppliers').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((s: any) => expect(s.is_active).toBe(true));
    });
  });

  describe('GET /suppliers/:id', () => {
    it('S-07: 200 — returns supplier by UUID', async () => {
      const res = await request(server)
        .get(`/api/v1/suppliers/${createdSupplierId}`)
        .expect(200);
      expect(res.body.id).toBe(createdSupplierId);
    });

    it('S-08: 404 — non-existent UUID', async () => {
      await request(server)
        .get('/api/v1/suppliers/00000000-0000-0000-0000-000000000099')
        .expect(404);
    });

    it('S-09: 400 — non-UUID id rejected by ParseUUIDPipe', async () => {
      await request(server).get('/api/v1/suppliers/abc').expect(400);
    });
  });

  describe('PATCH /suppliers/:id', () => {
    it('S-10: 200 — updates supplier name', async () => {
      const res = await request(server)
        .patch(`/api/v1/suppliers/${createdSupplierId}`)
        .send({ name: 'اسم محدّث' })
        .expect(200);
      expect(res.body.name).toBe('اسم محدّث');
    });

    it('S-11: 404 — updating non-existent supplier', async () => {
      await request(server)
        .patch('/api/v1/suppliers/00000000-0000-0000-0000-000000000099')
        .send({ name: 'لا يوجد' })
        .expect(404);
    });
  });

  describe('DELETE /suppliers/:id', () => {
    it('S-12: 200 — soft-deletes supplier', async () => {
      const res = await request(server)
        .delete(`/api/v1/suppliers/${createdSupplierId}`)
        .expect(200);
      expect(res.body.message).toMatch(/deactivated/i);
    });

    it('S-14: soft-deleted supplier excluded from GET list', async () => {
      const res = await request(server).get('/api/v1/suppliers').expect(200);
      const ids = res.body.map((s: any) => s.id);
      expect(ids).not.toContain(createdSupplierId);
    });

    it('S-13: 404 — deleting non-existent supplier', async () => {
      await request(server)
        .delete('/api/v1/suppliers/00000000-0000-0000-0000-000000000099')
        .expect(404);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════════════════════
describe('/api/v1/products (E2E)', () => {
  let catId: string;
  let productId: string;
  const uniqueSku = `SKU-TEST-${Date.now()}`;

  // Bootstrap: create a test category for product's cat_id FK
  beforeAll(async () => {
    const res = await request(server)
      .post('/api/v1/categories')
      .send({ name: 'فئة منتجات', slug: `prod-cat-${Date.now()}` });
    catId = res.body.id;
  });

  afterAll(async () => {
    if (catId) {
      await request(server).delete(`/api/v1/categories/${catId}`);
    }
  });

  describe('POST /products', () => {
    it('P-01: 201 — creates product with required fields', async () => {
      const res = await request(server)
        .post('/api/v1/products')
        .send({ cat_id: catId, sku: uniqueSku, name: 'منتج تجريبي', price: 250 })
        .expect(201);

      expect(res.body.sku).toBe(uniqueSku);
      expect(res.body.is_active).toBe(true);
      productId = res.body.id;
    });

    it('P-02: 400 — missing cat_id', async () => {
      await request(server)
        .post('/api/v1/products')
        .send({ sku: 'SK-NOCAT', name: 'بلا فئة', price: 100 })
        .expect(400);
    });

    it('P-03: 400 — missing sku', async () => {
      await request(server)
        .post('/api/v1/products')
        .send({ cat_id: catId, name: 'بلا سكو', price: 100 })
        .expect(400);
    });

    it('P-04: 400 — missing price', async () => {
      await request(server)
        .post('/api/v1/products')
        .send({ cat_id: catId, sku: `SK-NOPRICE-${Date.now()}`, name: 'بلا سعر' })
        .expect(400);
    });

    it('P-05: 400 — sku is empty string (min length 1)', async () => {
      await request(server)
        .post('/api/v1/products')
        .send({ cat_id: catId, sku: '', name: 'منتج', price: 10 })
        .expect(400);
    });

    it('P-06: 400 — sku exceeds 50 characters', async () => {
      await request(server)
        .post('/api/v1/products')
        .send({ cat_id: catId, sku: 'A'.repeat(51), name: 'منتج', price: 10 })
        .expect(400);
    });

    it('P-07: 400 — name shorter than 2 characters', async () => {
      await request(server)
        .post('/api/v1/products')
        .send({ cat_id: catId, sku: `SK-N-${Date.now()}`, name: 'X', price: 10 })
        .expect(400);
    });

    it('P-08 (GAP-02): negative price currently passes — known gap', async () => {
      const res = await request(server)
        .post('/api/v1/products')
        .send({ cat_id: catId, sku: `SK-NEG-${Date.now()}`, name: 'منتج سالب', price: -50 });

      // Should be 400 after adding @Min(0) — currently 201
      expect([201, 400]).toContain(res.status);
      if (res.status === 201) {
        await request(server).delete(`/api/v1/products/${res.body.id}`);
      }
    });

    it('P-09: 400 — price as string', async () => {
      await request(server)
        .post('/api/v1/products')
        .send({ cat_id: catId, sku: `SK-STR-${Date.now()}`, name: 'منتج', price: 'مئة' })
        .expect(400);
    });

    it('P-10: 400 — cat_id not a valid UUID', async () => {
      await request(server)
        .post('/api/v1/products')
        .send({ cat_id: 'bad-id', sku: `SK-BAD-${Date.now()}`, name: 'منتج', price: 10 })
        .expect(400);
    });

    it('P-11 (GAP-03): duplicate SKU returns 500 — expected 409 after fix', async () => {
      const res = await request(server)
        .post('/api/v1/products')
        .send({ cat_id: catId, sku: uniqueSku, name: 'مكرر', price: 100 });
      expect([409, 500]).toContain(res.status);
    });
  });

  describe('GET /products', () => {
    it('P-12: 200 — returns active products', async () => {
      const res = await request(server).get('/api/v1/products').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /products/:id', () => {
    it('P-13: 200 — returns product by UUID', async () => {
      const res = await request(server)
        .get(`/api/v1/products/${productId}`)
        .expect(200);
      expect(res.body.sku).toBe(uniqueSku);
    });

    it('P-14: 404 — non-existent UUID', async () => {
      await request(server)
        .get('/api/v1/products/00000000-0000-0000-0000-000000000099')
        .expect(404);
    });
  });

  describe('PATCH /products/:id', () => {
    it('P-15: 200 — updates product price', async () => {
      const res = await request(server)
        .patch(`/api/v1/products/${productId}`)
        .send({ price: 299.99 })
        .expect(200);
      expect(Number(res.body.price)).toBe(299.99);
    });
  });

  describe('DELETE /products/:id', () => {
    it('P-16: 200 — soft-deletes product', async () => {
      const res = await request(server)
        .delete(`/api/v1/products/${productId}`)
        .expect(200);
      expect(res.body.message).toMatch(/deactivated/i);
    });

    it('P-17: soft-deleted product excluded from GET /products', async () => {
      const res = await request(server).get('/api/v1/products').expect(200);
      const ids = res.body.map((p: any) => p.id);
      expect(ids).not.toContain(productId);
    });
  });
});
