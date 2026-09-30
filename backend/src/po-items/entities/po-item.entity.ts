import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/baseEntity';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('po_items')
export class PoItem extends BaseEntity {
  @ManyToOne(() => PurchaseOrder, (po) => po.items)
  @JoinColumn({ name: 'po_id' })
  purchaseOrder: PurchaseOrder;

  @Column()
  po_id: string;

  @ManyToOne(() => Product, (product) => product.poItems)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @Column({ type: 'int', default: 0 })
  qty: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  unit_cost: number;

  @Column({ type: 'int', default: 0 })
  received_qty: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;
}
