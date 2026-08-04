import { Injectable, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, SkuStock } from './order.entity';

/**
 * 中后台真实业务骨架：订单服务
 * 覆盖四个绕不过的实战点：
 *  1) 请求层（全局拦截器统一响应/错误）—— 见 response.interceptor.ts
 *  2) 权限（Guard 校验权限码）—— 见 permission.guard.ts
 *  3) 限流（ThrottlerGuard）—— 见 app.module.ts
 *  4) 事务（DataSource.transaction 保证 扣库存+建订单 原子）—— 本文件
 */
@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 创建订单：事务内扣库存 + 建订单，任一步失败整体回滚。
   *
   * 权限校验交给 PermissionGuard（见 order.controller.ts 的 @RequirePerms），
   * Service 层不再重复判权 —— 判权散落在 Service 里会导致内部调用绕过、
   * 且同一规则多处维护。
   */
  async createOrder(dto: {
    userId: number;
    items: { sku: string; qty: number }[];
  }): Promise<Order> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const manager = qr.manager;

      // 1. 扣库存：乐观锁，靠 WHERE stock >= qty 在并发下防超卖
      for (const it of dto.items) {
        const result = await manager
          .createQueryBuilder()
          .update(SkuStock)
          .set({ stock: () => 'stock - :qty' })
          .where('sku = :sku AND stock >= :qty', { sku: it.sku, qty: it.qty })
          .execute();

        if (!result.affected) {
          throw new InternalServerErrorException(`库存不足或 SKU 不存在: ${it.sku}`);
        }
      }

      // 2. 建订单
      const order = manager.create(Order, {
        userId: dto.userId,
        items: dto.items,
        status: 'CREATED',
      });
      const saved = await manager.save(order);

      await qr.commitTransaction();
      this.logger.log(`订单创建成功 id=${saved.id} user=${dto.userId}`);
      return saved;
    } catch (err) {
      await qr.rollbackTransaction().catch((e) =>
        this.logger.warn(`回滚失败: ${(e as Error).message}`),
      );
      throw err;
    } finally {
      // release 必须 try-catch：sql.js 单连接模式下回滚后 release
      // 可能抛错，不加保护会导致未捕获异常直接崩掉 NestJS 进程
      try {
        await qr.release();
      } catch (e) {
        this.logger.warn(`QueryRunner 释放失败: ${(e as Error).message}`);
      }
    }
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException(`订单 ${id} 不存在`);
    return order;
  }

  /** 查询库存，便于验证事务回滚后库存是否复原 */
  async stockOf(sku: string): Promise<number> {
    const row = await this.dataSource
      .getRepository(SkuStock)
      .findOne({ where: { sku } });
    if (!row) throw new NotFoundException(`SKU ${sku} 不存在`);
    return row.stock;
  }
}
