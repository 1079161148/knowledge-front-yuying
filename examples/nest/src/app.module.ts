import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { Order, SkuStock } from './order.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PermissionGuard } from './permission.guard';

@Module({
  imports: [
    // SQLite 免配置，clone 下来直接能跑；真实项目换 mysql/postgres 即可。
    // 用 sql.js（纯 JS/WASM）替代 better-sqlite3，Windows 零编译依赖。
    // autoSave=false：数据常驻 WASM 内存即可，避免 export 到磁盘时的阻塞/异常。
    // 生产如需持久化可改为 true 并指定 location 文件路径。
    TypeOrmModule.forRoot({
      type: 'sqljs',
      location: process.env.DB_FILE || 'order.db',
      autoSave: false,
      entities: [Order, SkuStock],
      synchronize: true, // 仅示例：自动建表。生产必须用 migration
      logging: false,
    }),
    TypeOrmModule.forFeature([Order, SkuStock]),

    // 限流：10 秒内最多 5 次（THROTTLE_LIMIT 环境变量可覆盖，测试时会调大）
    ThrottlerModule.forRoot([{
      ttl: 10_000,
      limit: parseInt(process.env.THROTTLE_LIMIT || '5', 10),
    }]),
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    PermissionGuard,
    // ThrottlerGuard 依赖注入容器提供的 options/storage/reflector，
    // 必须用 APP_GUARD 注册，不能 new ThrottlerGuard()
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  /** 写入初始库存（upsert：有则覆盖，无则插入，确保每次启动库存一致） */
  async onModuleInit(): Promise<void> {
    const repo = this.dataSource.getRepository(SkuStock);
    const seeds = [
      { sku: 'SKU-A', stock: 10 },
      { sku: 'SKU-B', stock: 3 },
    ];
    for (const s of seeds) {
      const existing = await repo.findOne({ where: { sku: s.sku } });
      if (existing) {
        await repo.save({ ...existing, stock: s.stock });
      } else {
        await repo.save(repo.create(s));
      }
    }
    console.log('✅ 种子数据已就绪：SKU-A=10, SKU-B=3');
  }
}
