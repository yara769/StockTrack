import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/baseEntity';
import { Category } from '../../categories/entities/category.entity';
import { Inventory } from '../../inventory/entities/inventory.entity';
import { SaleItem } from '../../sale-items/entities/sale-item.entity';
import { PoItem } from '../../po-items/entities/po-item.entity';

@Entity('products')
export class Product extends BaseEntity {
  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'cat_id' })
  category: Category;

  @Column()
  cat_id: string;

  @Column({ unique: true })
  sku: string;

  @Column({ nullable: true })
  barcode: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'piece' })
  unit: string;

  @OneToMany(() => Inventory, (inventory) => inventory.product)
  inventory: Inventory[];

  @OneToMany(() => SaleItem, (saleItem) => saleItem.product)
  saleItems: SaleItem[];

  @OneToMany(() => PoItem, (poItem) => poItem.product)
  poItems: PoItem[];
}
