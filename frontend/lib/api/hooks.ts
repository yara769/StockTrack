/**
 * React Query hooks for every backend module.
 * Pattern:
 *   useXxx()        → GET /xxx          (list)
 *   useXxxById(id)  → GET /xxx/:id      (single)
 *   useCreateXxx()  → POST /xxx         (mutation)
 *   useUpdateXxx()  → PATCH /xxx/:id    (mutation)
 *   useDeleteXxx()  → DELETE /xxx/:id   (mutation)
 *
 * All mutations surface errors via the global toast store (GAP-FE-01 fix).
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "./client";
import { toast } from "@/lib/toast";
import type {
  Store, CreateStoreDto,
  Employee, CreateEmployeeDto,
  Category, CreateCategoryDto,
  Product, CreateProductDto,
  InventoryItem, CreateInventoryDto,
  Supplier, CreateSupplierDto,
  PurchaseOrder, CreatePurchaseOrderDto,
  PoItem, CreatePoItemDto,
  Customer, CreateCustomerDto,
  Sale, CreateSaleDto,
  SaleItem, CreateSaleItemDto,
  Payment, CreatePaymentDto,
  Return, CreateReturnDto,
} from "./types";

// ─── Error message extractor ──────────────────────────────────────────────────
function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred";
}

// ─── Generic CRUD factory ─────────────────────────────────────────────────────

function makeHooks<T, C>(resource: string, label: string) {
  const listKey  = [resource];
  const itemKey  = (id: string) => [resource, id];

  function useList() {
    return useQuery<T[]>({
      queryKey: listKey,
      queryFn:  () => client.get<T[]>(`/${resource}`).then((r) => r.data),
    });
  }

  function useById(id: string | undefined) {
    return useQuery<T>({
      queryKey: itemKey(id!),
      queryFn:  () => client.get<T>(`/${resource}/${id}`).then((r) => r.data),
      enabled:  !!id,
    });
  }

  function useCreate() {
    const qc = useQueryClient();
    return useMutation<T, Error, C>({
      mutationFn: (dto) => client.post<T>(`/${resource}`, dto).then((r) => r.data),
      onSuccess:  () => {
        qc.invalidateQueries({ queryKey: listKey });
        toast.success(`${label} created successfully`);
      },
      onError: (err) => toast.error(errMsg(err)),
    });
  }

  function useUpdate() {
    const qc = useQueryClient();
    return useMutation<T, Error, { id: string; dto: Partial<C> }>({
      mutationFn: ({ id, dto }) => client.patch<T>(`/${resource}/${id}`, dto).then((r) => r.data),
      onSuccess:  (_, { id }) => {
        qc.invalidateQueries({ queryKey: listKey });
        qc.invalidateQueries({ queryKey: itemKey(id) });
        toast.success(`${label} updated successfully`);
      },
      onError: (err) => toast.error(errMsg(err)),
    });
  }

  function useDelete() {
    const qc = useQueryClient();
    return useMutation<void, Error, string>({
      mutationFn: (id) => client.delete(`/${resource}/${id}`).then(() => undefined),
      onSuccess:  () => {
        qc.invalidateQueries({ queryKey: listKey });
        toast.success(`${label} deleted`);
      },
      onError: (err) => toast.error(errMsg(err)),
    });
  }

  return { useList, useById, useCreate, useUpdate, useDelete };
}

// ─── Per-module hooks ─────────────────────────────────────────────────────────

const storesHooks         = makeHooks<Store,         CreateStoreDto>        ("stores",          "Store");
const employeesHooks      = makeHooks<Employee,       CreateEmployeeDto>     ("employees",       "Employee");
const categoriesHooks     = makeHooks<Category,       CreateCategoryDto>     ("categories",      "Category");
const productsHooks       = makeHooks<Product,        CreateProductDto>      ("products",        "Product");
const inventoryHooks      = makeHooks<InventoryItem,  CreateInventoryDto>    ("inventory",       "Inventory record");
const suppliersHooks      = makeHooks<Supplier,       CreateSupplierDto>     ("suppliers",       "Supplier");
const purchaseOrdersHooks = makeHooks<PurchaseOrder,  CreatePurchaseOrderDto>("purchase-orders", "Purchase order");
const poItemsHooks        = makeHooks<PoItem,         CreatePoItemDto>       ("po-items",        "PO item");
const customersHooks      = makeHooks<Customer,       CreateCustomerDto>     ("customers",       "Customer");
const salesHooks          = makeHooks<Sale,           CreateSaleDto>         ("sales",           "Sale");
const saleItemsHooks      = makeHooks<SaleItem,       CreateSaleItemDto>     ("sale-items",      "Sale item");
const paymentsHooks       = makeHooks<Payment,        CreatePaymentDto>      ("payments",        "Payment");
const returnsHooks        = makeHooks<Return,         CreateReturnDto>       ("returns",         "Return");

// ─── Named exports for convenience ───────────────────────────────────────────

// Stores
export const useStores        = storesHooks.useList;
export const useStoreById     = storesHooks.useById;
export const useCreateStore   = storesHooks.useCreate;
export const useUpdateStore   = storesHooks.useUpdate;
export const useDeleteStore   = storesHooks.useDelete;

// Employees
export const useEmployees       = employeesHooks.useList;
export const useEmployeeById    = employeesHooks.useById;
export const useCreateEmployee  = employeesHooks.useCreate;
export const useUpdateEmployee  = employeesHooks.useUpdate;
export const useDeleteEmployee  = employeesHooks.useDelete;

// Categories
export const useCategories      = categoriesHooks.useList;
export const useCategoryById    = categoriesHooks.useById;
export const useCreateCategory  = categoriesHooks.useCreate;
export const useUpdateCategory  = categoriesHooks.useUpdate;
export const useDeleteCategory  = categoriesHooks.useDelete;

// Products
export const useProducts        = productsHooks.useList;
export const useProductById     = productsHooks.useById;
export const useCreateProduct   = productsHooks.useCreate;
export const useUpdateProduct   = productsHooks.useUpdate;
export const useDeleteProduct   = productsHooks.useDelete;

// Inventory
export const useInventory       = inventoryHooks.useList;
export const useInventoryById   = inventoryHooks.useById;
export const useCreateInventory = inventoryHooks.useCreate;
export const useUpdateInventory = inventoryHooks.useUpdate;
export const useDeleteInventory = inventoryHooks.useDelete;

// Suppliers
export const useSuppliers       = suppliersHooks.useList;
export const useSupplierById    = suppliersHooks.useById;
export const useCreateSupplier  = suppliersHooks.useCreate;
export const useUpdateSupplier  = suppliersHooks.useUpdate;
export const useDeleteSupplier  = suppliersHooks.useDelete;

// Purchase Orders
export const usePurchaseOrders       = purchaseOrdersHooks.useList;
export const usePurchaseOrderById    = purchaseOrdersHooks.useById;
export const useCreatePurchaseOrder  = purchaseOrdersHooks.useCreate;
export const useUpdatePurchaseOrder  = purchaseOrdersHooks.useUpdate;
export const useDeletePurchaseOrder  = purchaseOrdersHooks.useDelete;

// PO Items
export const usePoItems       = poItemsHooks.useList;
export const usePoItemById    = poItemsHooks.useById;
export const useCreatePoItem  = poItemsHooks.useCreate;
export const useUpdatePoItem  = poItemsHooks.useUpdate;
export const useDeletePoItem  = poItemsHooks.useDelete;

// Customers
export const useCustomers       = customersHooks.useList;
export const useCustomerById    = customersHooks.useById;
export const useCreateCustomer  = customersHooks.useCreate;
export const useUpdateCustomer  = customersHooks.useUpdate;
export const useDeleteCustomer  = customersHooks.useDelete;

// Sales
export const useSales        = salesHooks.useList;
export const useSaleById     = salesHooks.useById;
export const useCreateSale   = salesHooks.useCreate;
export const useUpdateSale   = salesHooks.useUpdate;
export const useDeleteSale   = salesHooks.useDelete;

// Sale Items
export const useSaleItems       = saleItemsHooks.useList;
export const useSaleItemById    = saleItemsHooks.useById;
export const useCreateSaleItem  = saleItemsHooks.useCreate;
export const useUpdateSaleItem  = saleItemsHooks.useUpdate;
export const useDeleteSaleItem  = saleItemsHooks.useDelete;

// Payments
export const usePayments       = paymentsHooks.useList;
export const usePaymentById    = paymentsHooks.useById;
export const useCreatePayment  = paymentsHooks.useCreate;
export const useUpdatePayment  = paymentsHooks.useUpdate;
export const useDeletePayment  = paymentsHooks.useDelete;

// Returns
export const useReturns       = returnsHooks.useList;
export const useReturnById    = returnsHooks.useById;
export const useCreateReturn  = returnsHooks.useCreate;
export const useUpdateReturn  = returnsHooks.useUpdate;
export const useDeleteReturn  = returnsHooks.useDelete;
