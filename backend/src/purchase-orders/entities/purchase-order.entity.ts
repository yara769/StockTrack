import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/baseEntity';
import { Store } from '../../stores/entities/store.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { PoItem } from '../../po-items/entities/po-item.entity';

@Entity('purchase_orders')
export class PurchaseOrder extends BaseEntity {
  @ManyToOne(() => Supplier, (supplier) => supplier.purchaseOrders)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column()
  supplier_id: string;

  @ManyToOne(() => Store, (store) => store.purchaseOrders)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column()
  store_id: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'timestamp', nullable: true })
  ordered_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  expected_at: Date;

  @OneToMany(() => PoItem, (poItem) => poItem.purchaseOrder)
  items: PoItem[];
}
