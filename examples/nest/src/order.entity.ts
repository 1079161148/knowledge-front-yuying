import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 订单实体。
 *
 * items 用 simple-json 存：示例聚焦事务与超卖，不引入 order_item 子表，
 * 避免为了 demo 铺开一堆表结构。真实项目请拆子表并加索引。
 */
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'simple-json' })
  items: { sku: string; qty: number }[];

  @Column({ default: 'CREATED' })
  status: string;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

/** SKU 库存表：超卖防护的主角 */
@Entity('sku_stock')
export class SkuStock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  sku: string;

  @Column({ type: 'int' })
  stock: number;
}
