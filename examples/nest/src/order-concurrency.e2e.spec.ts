import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { unlinkSync, existsSync } from 'node:fs';

import { Test, TestingModule } from '@nestjs/testing';

/**
 * 超卖防护独立 suite：自带一个干净 app 实例。
 * 用 supertest.agent 复用同一个 HTTP server，避免每次 request() 新建
 * listener 导致 ECONNREFUSED。
 */
describe('超卖防护 e2e', () => {
  let app: INestApplication;
  let agent: ReturnType<typeof supertest.agent>;
  const DB = 'order-concurrency-test.db';

  beforeAll(async () => {
    if (existsSync(DB)) unlinkSync(DB);
    process.env.DB_FILE = DB;
    process.env.THROTTLE_LIMIT = '50';

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
    // 关键：用 agent 复用同一个 server 实例，不每次新建 listener
    agent = supertest.agent(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
    if (existsSync(DB)) unlinkSync(DB);
  });

  it('10 个请求争抢 3 件库存，只有 3 单成功', async () => {
    const reqs = Array.from({ length: 10 }, () =>
      agent
        .post('/api/orders')
        .set('x-perms', 'order:create')
        .send({ userId: 2, items: [{ sku: 'SKU-B', qty: 1 }] }),
    );

    const results: supertest.Response[] = [];
    for (const req of reqs) {
      results.push(await req);
    }
    const okCount = results.filter((r) => r.status === 201).length;
    expect(okCount).toBe(3);

    const stock = await agent.get('/api/orders/stock/SKU-B');
    expect(stock.body.data.stock).toBe(0);
  });
});
