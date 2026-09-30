import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/baseEntity';
import { Sale } from '../../sales/entities/sale.entity';

@Entity('returns')
export class Return extends BaseEntity {
  @ManyToOne(() => Sale, (sale) => sale.returns)
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @Column()
  sale_id: string;

  @Column({ nullable: true })
  reason: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refund_amount: number;

  @Column({ default: 'pending' })
  status: string;
}
