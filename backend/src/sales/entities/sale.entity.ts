import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/baseEntity';
import { Store } from '../../stores/entities/store.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { SaleItem } from '../../sale-items/entities/sale-item.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { Return } from '../../returns/entities/return.entity';

@Entity('sales')
export class Sale extends BaseEntity {
  @ManyToOne(() => Store, (store) => store.sales)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column()
  store_id: string;

  @ManyToOne(() => Customer, (customer) => customer.sales, { nullable: true })
  @JoinColumn({ name: 'cust_id' })
  customer: Customer;

  @Column({ nullable: true })
  cust_id: string;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'emp_id' })
  cashier: Employee;

  @Column({ nullable: true })
  emp_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ default: 'completed' })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  sold_at: Date;

  @OneToMany(() => SaleItem, (saleItem) => saleItem.sale)
  items: SaleItem[];

  @OneToMany(() => Payment, (payment) => payment.sale)
  payments: Payment[];

  @OneToMany(() => Return, (ret) => ret.sale)
  returns: Return[];
}
