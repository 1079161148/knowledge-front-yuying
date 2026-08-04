import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { unlinkSync, existsSync } from 'node:fs';

/**
 * 端到端测试即文档：跑通即证明四个实战点都真的生效。
 * 用独立的 test.db，避免污染开发库。
 *
 * ⚠️ 关键：AppModule 的 @Module 装饰器在 import 时就会固化
 * process.env.DB_FILE 的值（取不到就是默认 'order.db'），
 * 所以这里必须用动态 import 在设好 env 之后再加载模块。
 */
describe('订单服务 e2e', () => {
  let app: INestApplication;
  let agent: ReturnType<typeof supertest.agent>;
  const DB = 'order-test.db';

  beforeAll(async () => {
    // 监听进程级未捕获异常，帮定位是什么炸了
    process.on('unhandledRejection', (reason) => {
      console.error('🔥 UNHANDLED REJECTION:', reason);
    });
    process.on('uncaughtException', (error) => {
      console.error('💥 UNCAUGHT EXCEPTION:', error);
    });

    // 1. 先清理可能残留的测试库
    if (existsSync(DB)) unlinkSync(DB);

    // 2. 在模块 import 之前设定环境变量（关键：必须早于模块加载）
    process.env.DB_FILE = DB;
    process.env.THROTTLE_LIMIT = '50'; // 并发测试需要 10 请求同时到达，调大限流上限

    // 3. 动态 import，让 TypeOrmModule.forRoot 和 ThrottlerModule 读到正确的 env
    const [{ AppModule }, { ResponseInterceptor, AllExceptionsFilter }] =
      await Promise.all([
        import('./app.module'),
        import('./response.interceptor'),
      ]);

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());
    // 必须真正 listen 到随机端口，server 才处于 listening 状态，
    // 否则 supertest 请求会 ECONNREFUSED（app.init() 不会 listen）。
    await app.listen(0);
    // 复用同一个 server 实例，避免每次 request() 新建 listener 导致 ECONNREFUSED
    agent = supertest.agent(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
    if (existsSync(DB)) unlinkSync(DB);
  });

  it('响应层：成功响应被统一包装成 {code,message,data,ts}', async () => {
    const res = await agent
      .get('/api/orders/stock/SKU-A')
      .expect(200);

    expect(res.body.code).toBe(0);
    expect(res.body.message).toBe('ok');
    expect(res.body.data).toEqual({ sku: 'SKU-A', stock: 10 });
    expect(typeof res.body.ts).toBe('number');
  });

  it('权限层：缺少 order:create 权限时被 Guard 拦截为 403', async () => {
    const res = await agent
      .post('/api/orders')
      .send({ userId: 1, items: [{ sku: 'SKU-A', qty: 1 }] })
      .expect(403);

    expect(res.body.code).toBe(403);
    expect(res.body.message).toContain('order:create');
  });

  it('事务层：下单成功后库存被正确扣减', async () => {
    const res = await agent
      .post('/api/orders')
      .set('x-perms', 'order:create')
      .send({ userId: 1, items: [{ sku: 'SKU-A', qty: 4 }] })
      .expect(201);

    expect(res.body.data.status).toBe('CREATED');

    const stock = await agent.get('/api/orders/stock/SKU-A');
    expect(stock.body.data.stock).toBe(6); // 10 - 4
  });

  it('事务层：库存不足时整体回滚，已扣的库存必须复原', async () => {
    // SKU-A 剩 6、SKU-B 只有 3。请求 B 要 99 件必失败，
    // 此时前一步扣掉的 SKU-A 必须回滚，否则就是脏扣。
    await agent
      .post('/api/orders')
      .set('x-perms', 'order:create')
      .send({
        userId: 1,
        items: [
          { sku: 'SKU-A', qty: 2 },
          { sku: 'SKU-B', qty: 99 },
        ],
      })
      .expect(500);

    const stock = await agent.get('/api/orders/stock/SKU-A');
    expect(stock.body.data.stock).toBe(6); // 仍是 6，证明回滚生效
  });
});
