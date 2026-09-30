"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Receipt, CheckCircle } from "lucide-react";
import {
  useProducts,
  useStores,
  useCustomers,
  useEmployees,
  useCreateSale,
  useCreateSaleItem,
  useCreatePayment,
} from "@/lib/api/hooks";
import type { Product } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

// ── Cart item ────────────────────────────────────────────────────────────────
interface CartItem {
  product: Product;
  qty: number;
}

// ── Payment modal ────────────────────────────────────────────────────────────
interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (method: string, ref: string) => Promise<void>;
  loading: boolean;
}

function PaymentModal({ open, onClose, total, onConfirm, loading }: PaymentModalProps) {
  const [method, setMethod] = useState("cash");
  const [ref, setRef]       = useState("");

  const methods = [
    { value: "cash",   label: "Cash",   icon: <Banknote  size={18} /> },
    { value: "card",   label: "Card",   icon: <CreditCard size={18} /> },
    { value: "transfer", label: "Transfer", icon: <Receipt size={18} /> },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Process Payment" size="sm">
      <div className="space-y-5">
        {/* Total due */}
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: "var(--bg-elevated)" }}
        >
          <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>Total Due</p>
          <p className="text-3xl font-bold" style={{ color: "var(--accent)" }}>
            {formatCurrency(total)}
          </p>
        </div>

        {/* Payment method */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
            Payment Method
          </p>
          <div className="grid grid-cols-3 gap-2">
            {methods.map((m) => (
              <button
                key={m.value}
                onClick={() => setMethod(m.value)}
                className="flex flex-col items-center gap-1.5 rounded-lg py-3 px-2 text-xs font-medium transition-all"
                style={{
                  background: method === m.value ? "var(--accent-muted)" : "var(--bg-elevated)",
                  border:     method === m.value ? "1px solid var(--border-accent)" : "1px solid var(--border)",
                  color:      method === m.value ? "var(--accent)" : "var(--text-secondary)",
                }}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reference */}
        {method !== "cash" && (
          <Input
            label="Reference / Transaction ID"
            placeholder="Optional"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
          />
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            className="flex-1"
            loading={loading}
            icon={<CheckCircle size={16} />}
            onClick={() => onConfirm(method, ref)}
          >
            Confirm Payment
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Invoice modal ────────────────────────────────────────────────────────────
interface InvoiceModalProps {
  open: boolean;
  onClose: () => void;
  saleId: string;
  cart: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
}

function InvoiceModal({ open, onClose, saleId, cart, subtotal, tax, discount, total, paymentMethod }: InvoiceModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Sale Receipt" size="sm">
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center">
          <div
            className="inline-flex items-center justify-center rounded-full mb-3"
            style={{ width: 48, height: 48, background: "var(--accent-muted)" }}
          >
            <CheckCircle size={24} style={{ color: "var(--accent)" }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Payment Successful
          </p>
          <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--text-muted)" }}>
            #{saleId.slice(0, 8).toUpperCase()}
          </p>
        </div>

        {/* Items */}
        <div
          className="rounded-xl overflow-hidden divide-y"
          style={{ borderColor: "var(--border)", border: "1px solid var(--border)" }}
        >
          {cart.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center justify-between px-4 py-2.5 text-sm"
              style={{ background: "var(--bg-elevated)" }}
            >
              <div>
                <p style={{ color: "var(--text-primary)" }}>{item.product.name}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {item.qty} × {formatCurrency(parseFloat(item.product.price as string))}
                </p>
              </div>
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {formatCurrency(item.qty * parseFloat(item.product.price as string))}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-1.5 text-sm">
          {[
            { label: "Subtotal", value: formatCurrency(subtotal) },
            { label: "Tax (15%)", value: formatCurrency(tax) },
            ...(discount > 0 ? [{ label: "Discount", value: `-${formatCurrency(discount)}` }] : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between">
              <span style={{ color: "var(--text-secondary)" }}>{label}</span>
              <span style={{ color: "var(--text-primary)" }}>{value}</span>
            </div>
          ))}
          <div
            className="flex justify-between font-semibold text-base pt-2 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--text-primary)" }}>Total</span>
            <span style={{ color: "var(--accent)" }}>{formatCurrency(total)}</span>
          </div>
        </div>

        <Badge variant="muted" className="w-full justify-center py-1.5">
          Paid via {paymentMethod}
        </Badge>

        <Button variant="secondary" className="w-full" onClick={onClose}>
          New Sale
        </Button>
      </div>
    </Modal>
  );
}

// ── Main POS component ───────────────────────────────────────────────────────
export function POSCheckout() {
  const { data: products }  = useProducts();
  const { data: stores }    = useStores();
  const { data: customers } = useCustomers();
  const { data: employees } = useEmployees();

  const createSale     = useCreateSale();
  const createSaleItem = useCreateSaleItem();
  const createPayment  = useCreatePayment();

  const [search, setSearch]         = useState("");
  const [cart, setCart]             = useState<CartItem[]>([]);
  const [discount, setDiscount]     = useState(0);
  const [storeId, setStoreId]       = useState("");
  const [custId, setCustId]         = useState("");
  const [empId, setEmpId]           = useState("");
  const [paymentOpen, setPaymentOpen]   = useState(false);
  const [invoiceOpen, setInvoiceOpen]   = useState(false);
  const [lastSaleId, setLastSaleId]     = useState("");
  const [lastPayMethod, setLastPayMethod] = useState("cash");
  const [processing, setProcessing]   = useState(false);

  // Computed totals
  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + i.qty * parseFloat(i.product.price as string), 0),
    [cart],
  );
  const taxRate = 0.15;
  const tax     = subtotal * taxRate;
  const total   = subtotal + tax - discount;

  // Product search
  const filteredProducts = useMemo(() => {
    if (!search) return products ?? [];
    const q = search.toLowerCase();
    return (products ?? []).filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode ?? "").includes(q),
    );
  }, [products, search]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const setQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
    } else {
      setCart((prev) =>
        prev.map((i) => (i.product.id === productId ? { ...i, qty } : i)),
      );
    }
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setCustId("");
    setEmpId("");
  };

  const handleConfirmPayment = async (method: string, ref: string) => {
    if (!storeId || cart.length === 0) return;
    setProcessing(true);
    try {
      // 1. Create sale header
      const sale = await createSale.mutateAsync({
        store_id: storeId,
        cust_id:  custId  || undefined,
        emp_id:   empId   || undefined,
        subtotal,
        tax,
        discount,
        total,
        status: "completed",
      });

      // 2. Create sale items — total is server-computed (qty * unit_price)
      await Promise.all(
        cart.map((item) =>
          createSaleItem.mutateAsync({
            sale_id:    sale.id,
            product_id: item.product.id,
            qty:        item.qty,
            unit_price: parseFloat(item.product.price as string),
            // total omitted — backend computes qty * unit_price
          }),
        ),
      );

      // 3. Create payment record
      await createPayment.mutateAsync({
        sale_id: sale.id,
        method,
        amount:  total,
        status:  "completed",
        ref:     ref || undefined,
        paid_at: new Date().toISOString(),
      });

      setLastSaleId(sale.id);
      setLastPayMethod(method);
      setPaymentOpen(false);
      setInvoiceOpen(true);
      clearCart();
    } finally {
      setProcessing(false);
    }
  };

  const storeOptions    = (stores    ?? []).map((s) => ({ label: s.name,             value: s.id }));
  const customerOptions = [{ label: "Walk-in Customer", value: "" }, ...(customers ?? []).map((c) => ({ label: c.name, value: c.id }))];
  const employeeOptions = [{ label: "No Cashier",       value: "" }, ...(employees ?? []).map((e) => ({ label: e.name, value: e.id }))];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 h-full">
      {/* ── Left: Product picker ─────────────────────────────────── */}
      <div className="xl:col-span-3 space-y-4">
        {/* Context selectors */}
        <div className="grid grid-cols-3 gap-3">
          <Select
            label="Store *"
            placeholder="Select store…"
            options={storeOptions}
            value={storeId}
            onChange={setStoreId}
          />
          <Select
            label="Customer"
            options={customerOptions}
            value={custId}
            onChange={setCustId}
          />
          <Select
            label="Cashier"
            options={employeeOptions}
            value={empId}
            onChange={setEmpId}
          />
        </div>

        {/* Search */}
        <Input
          placeholder="Search products by name, SKU or barcode…"
          icon={<Search size={14} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Product grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto scrollable pr-1">
          <AnimatePresence>
            {filteredProducts.map((product, idx) => (
              <motion.button
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.02, duration: 0.15 }}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => addToCart(product)}
                className="flex flex-col items-start rounded-xl p-3 text-left transition-all"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-accent)";
                  e.currentTarget.style.background  = "var(--accent-muted)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.background  = "var(--bg-surface)";
                }}
              >
                <div
                  className="rounded-lg flex items-center justify-center mb-2 text-xs font-bold"
                  style={{
                    width: 36, height: 36,
                    background: "var(--accent-muted)",
                    color: "var(--accent)",
                  }}
                >
                  {product.name.slice(0, 2).toUpperCase()}
                </div>
                <p
                  className="text-xs font-medium leading-tight line-clamp-2 mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {product.name}
                </p>
                <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                  {product.sku}
                </p>
                <p className="text-sm font-bold mt-1.5" style={{ color: "var(--accent)" }}>
                  {formatCurrency(parseFloat(product.price as string))}
                </p>
              </motion.button>
            ))}
          </AnimatePresence>
          {filteredProducts.length === 0 && (
            <div
              className="col-span-full py-10 text-center text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              No products found
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Cart + totals ─────────────────────────────────── */}
      <div
        className="xl:col-span-2 rounded-xl flex flex-col"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Cart header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Cart
          </h3>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs transition-colors"
              style={{ color: "var(--danger)" }}
            >
              Clear all
            </button>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto scrollable px-4 py-3 space-y-2 min-h-0">
          <AnimatePresence>
            {cart.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-32 gap-2"
              >
                <Receipt size={28} style={{ color: "var(--text-muted)" }} />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Add products to start a sale
                </p>
              </motion.div>
            )}
            {cart.map((item) => (
              <motion.div
                key={item.product.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{ background: "var(--bg-elevated)" }}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-medium truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.product.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--accent)" }}>
                    {formatCurrency(parseFloat(item.product.price as string))}
                  </p>
                </div>
                {/* Qty controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setQty(item.product.id, item.qty - 1)}
                    className="flex items-center justify-center rounded-md transition-colors"
                    style={{
                      width: 24, height: 24,
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <Minus size={11} />
                  </button>
                  <span
                    className="text-sm font-semibold w-6 text-center"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.qty}
                  </span>
                  <button
                    onClick={() => setQty(item.product.id, item.qty + 1)}
                    className="flex items-center justify-center rounded-md transition-colors"
                    style={{
                      width: 24, height: 24,
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <Plus size={11} />
                  </button>
                </div>
                {/* Line total */}
                <span
                  className="text-xs font-semibold w-16 text-right"
                  style={{ color: "var(--text-primary)" }}
                >
                  {formatCurrency(item.qty * parseFloat(item.product.price as string))}
                </span>
                <button onClick={() => setQty(item.product.id, 0)}>
                  <Trash2 size={14} style={{ color: "var(--danger)" }} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Totals + checkout */}
        <div
          className="px-5 py-4 border-t space-y-3"
          style={{ borderColor: "var(--border)" }}
        >
          {/* Discount */}
          <div className="flex items-center gap-3">
            <span className="text-xs flex-1" style={{ color: "var(--text-secondary)" }}>Discount</span>
            <input
              type="number"
              min={0}
              value={discount}
              onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
              className="w-24 text-right text-sm rounded-lg px-2 py-1 outline-none"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Summary rows */}
          <div className="space-y-1 text-xs">
            {[
              { label: "Subtotal",  value: formatCurrency(subtotal) },
              { label: "Tax (15%)", value: formatCurrency(tax) },
              ...(discount > 0 ? [{ label: "Discount", value: `-${formatCurrency(discount)}` }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>{label}</span>
                <span style={{ color: "var(--text-secondary)" }}>{value}</span>
              </div>
            ))}
          </div>

          <div
            className="flex justify-between text-base font-bold pt-2 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--text-primary)" }}>Total</span>
            <span style={{ color: "var(--accent)" }}>{formatCurrency(total)}</span>
          </div>

          <Button
            className="w-full"
            size="lg"
            icon={<CreditCard size={18} />}
            disabled={cart.length === 0 || !storeId}
            onClick={() => setPaymentOpen(true)}
          >
            Charge {formatCurrency(total)}
          </Button>

          {(!storeId) && (
            <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
              Select a store to enable checkout
            </p>
          )}
        </div>
      </div>

      {/* Payment modal */}
      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        total={total}
        onConfirm={handleConfirmPayment}
        loading={processing}
      />

      {/* Invoice/receipt modal */}
      <InvoiceModal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        saleId={lastSaleId}
        cart={cart.length > 0 ? cart : []}
        subtotal={subtotal}
        tax={tax}
        discount={discount}
        total={total}
        paymentMethod={lastPayMethod}
      />
    </div>
  );
}
