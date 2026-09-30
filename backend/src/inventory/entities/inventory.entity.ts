import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/baseEntity';
import { Store } from '../../stores/entities/store.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('inventory')
@Unique(['store_id', 'product_id'])
export class Inventory extends BaseEntity {
  @ManyToOne(() => Store, (store) => store.inventory)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column()
  store_id: string;

  @ManyToOne(() => Product, (product) => product.inventory)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'int', default: 0 })
  min_stock: number;

  @Column({ type: 'int', default: 0 })
  max_stock: number;

  @Column({ nullable: true })
  location: string;
}
