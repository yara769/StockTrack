import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/baseEntity';
import { Sale } from '../../sales/entities/sale.entity';

@Entity('customers')
export class Customer extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'int', default: 0 })
  loyalty_points: number;

  @OneToMany(() => Sale, (sale) => sale.customer)
  sales: Sale[];
}
