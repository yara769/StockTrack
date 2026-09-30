import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/baseEntity';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';

@Entity('suppliers')
export class Supplier extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  contact_person: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @OneToMany(() => PurchaseOrder, (po) => po.supplier)
  purchaseOrders: PurchaseOrder[];
}
