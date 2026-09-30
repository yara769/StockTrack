import { BaseEntity } from '../../common/entities/baseEntity';
import { Employee } from '../../employees/entities/employee.entity';
import { Inventory } from '../../inventory/entities/inventory.entity';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';
import { Sale } from '../../sales/entities/sale.entity';
import { Column, Entity, OneToMany } from "typeorm";  
@Entity("stores")
export class Store extends BaseEntity {
    @Column({ type: 'varchar', length: 100 ,nullable: false})
    name: string;
     @Column({ unique: true })
  code: string;

  @Column({ nullable: true })
  address: string | null;

  @Column({ nullable: true })
  phone: string | null;

  @Column({ default: 'UTC' })
  timezone: string;

  @OneToMany(() => Employee, (employee) => employee.store)
  employees: Employee[];

  @OneToMany(() => Inventory, (inventory) => inventory.store)
  inventory: Inventory[];

  @OneToMany(() => PurchaseOrder, (po) => po.store)
  purchaseOrders : PurchaseOrder[];

  @OneToMany(() => Sale, (sale) => sale.store)
  sales: Sale[];
}


