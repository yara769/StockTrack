// ── Shared base ───────────────────────────────────────────────────────────────
export interface BaseEntity {
  id: string;
  tenant_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Stores ────────────────────────────────────────────────────────────────────
export interface Store extends BaseEntity {
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  timezone: string;
}
export interface CreateStoreDto {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  timezone?: string;
  is_active?: boolean;
}

// ── Employees ─────────────────────────────────────────────────────────────────
export interface Employee extends BaseEntity {
  store_id: string;
  name: string;
  email: string;
  phone: string | null;
  pin: string | null;
  role: string;
}
export interface CreateEmployeeDto {
  store_id: string;
  name: string;
  email: string;
  phone?: string;
  pin?: string;
  role?: string;
}

// ── Categories ────────────────────────────────────────────────────────────────
export interface Category extends BaseEntity {
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  children?: Category[];
}
export interface CreateCategoryDto {
  parent_id?: string;
  name: string;
  slug: string;
  description?: string;
  sort_order?: number;
}

// ── Products ──────────────────────────────────────────────────────────────────
export interface Product extends BaseEntity {
  cat_id: string;
  sku: string;
  barcode: string | null;
  name: string;
  price: string; // decimal comes back as string from MySQL
  unit: string;
  category?: Category;
}
export interface CreateProductDto {
  cat_id: string;
  sku: string;
  barcode?: string;
  name: string;
  price: number;
  unit?: string;
}

// ── Inventory ─────────────────────────────────────────────────────────────────
export interface InventoryItem extends BaseEntity {
  store_id: string;
  product_id: string;
  quantity: number;
  min_stock: number;
  max_stock: number;
  location: string | null;
  product?: Product;
  store?: Store;
}
export interface CreateInventoryDto {
  store_id: string;
  product_id: string;
  quantity?: number;
  min_stock?: number;
  max_stock?: number;
  location?: string;
}

// ── Suppliers ─────────────────────────────────────────────────────────────────
export interface Supplier extends BaseEntity {
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}
export interface CreateSupplierDto {
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
}

// ── Purchase Orders ───────────────────────────────────────────────────────────
export interface PurchaseOrder extends BaseEntity {
  supplier_id: string;
  store_id: string;
  status: string;
  total: string;
  ordered_at: string | null;
  expected_at: string | null;
  supplier?: Supplier;
  store?: Store;
  items?: PoItem[];
}
export interface CreatePurchaseOrderDto {
  supplier_id: string;
  store_id: string;
  status?: string;
  total?: number;
  ordered_at?: string;
  expected_at?: string;
}

// ── PO Items ──────────────────────────────────────────────────────────────────
export interface PoItem extends BaseEntity {
  po_id: string;
  product_id: string;
  qty: number;
  unit_cost: string;
  received_qty: number;
  total: string;
  product?: Product;
}
export interface CreatePoItemDto {
  po_id: string;
  product_id: string;
  qty: number;        // @Min(1) enforced by backend
  unit_cost: number;  // @Min(0) enforced by backend
  received_qty?: number;
  // total is server-computed (qty * unit_cost) — do not send
}

// ── Customers ─────────────────────────────────────────────────────────────────
export interface Customer extends BaseEntity {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  loyalty_points: number;
}
export interface CreateCustomerDto {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  loyalty_points?: number;
}

// ── Sales ─────────────────────────────────────────────────────────────────────
export interface Sale extends BaseEntity {
  store_id: string;
  cust_id: string | null;
  emp_id: string | null;
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  status: string;
  sold_at: string;
  customer?: Customer;
  cashier?: Employee;
  items?: SaleItem[];
  payments?: Payment[];
  returns?: Return[];
}
export interface CreateSaleDto {
  store_id: string;
  cust_id?: string;
  emp_id?: string;
  subtotal?: number;
  tax?: number;
  discount?: number;
  total?: number;
  status?: string;
}

// ── Sale Items ────────────────────────────────────────────────────────────────
export interface SaleItem extends BaseEntity {
  sale_id: string;
  product_id: string;
  qty: number;
  unit_price: string;
  total: string;
  product?: Product;
}
export interface CreateSaleItemDto {
  sale_id: string;
  product_id: string;
  qty: number;         // @Min(1) enforced by backend
  unit_price: number;  // @Min(0) enforced by backend
  // total is server-computed (qty * unit_price) — do not send
}

// ── Payments ──────────────────────────────────────────────────────────────────
export interface Payment extends BaseEntity {
  sale_id: string;
  method: string;
  amount: string;
  status: string;
  ref: string | null;
  paid_at: string | null;
  sale?: Sale;
}
export interface CreatePaymentDto {
  sale_id: string;
  method?: string;
  amount: number;
  status?: string;
  ref?: string;
  paid_at?: string;
}

// ── Returns ───────────────────────────────────────────────────────────────────
export interface Return extends BaseEntity {
  sale_id: string;
  reason: string | null;
  refund_amount: string;
  status: string;
  sale?: Sale;
}
export interface CreateReturnDto {
  sale_id: string;
  reason?: string;
  refund_amount?: number;
  status?: string;
}
