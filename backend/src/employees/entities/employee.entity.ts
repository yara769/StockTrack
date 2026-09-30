import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/baseEntity';
import { Store } from '../../stores/entities/store.entity';

@Entity('employees')
export class Employee extends BaseEntity {
  @ManyToOne(() => Store, (store) => store.employees)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column()
  store_id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  pin: string;

  @Column({ default: 'cashier' })
  role: string;
}
