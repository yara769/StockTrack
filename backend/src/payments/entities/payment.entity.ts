import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/baseEntity';
import { Sale } from '../../sales/entities/sale.entity';

@Entity('payments')
export class Payment extends BaseEntity {
  @ManyToOne(() => Sale, (sale) => sale.payments)
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @Column()
  sale_id: string;

  @Column({ default: 'cash' })
  method: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ default: 'completed' })
  status: string;

  @Column({ nullable: true })
  ref: string;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date;
}
