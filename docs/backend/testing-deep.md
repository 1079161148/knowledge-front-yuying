# 🧪 测试体系深化专题（单测 / e2e / 集成 / 门禁）

> "能跑"不代表"对"，更不代表"改了不会坏"。本篇讲后端测试体系：测试金字塔、各层怎么写、Mock 边界、覆盖率与 CI 门禁。覆盖 [NestJS 进阶·测试](nestjs-pro.md) 的深化内容，适合中→高级。
>
> 依据 **[Testing Pyramid（Martin Fowler）](https://martinfowler.com/articles/practical-test-pyramid.html)**、**[NestJS 测试文档](https://docs.nestjs.com/fundamentals/testing)**、**[Jest](https://jestjs.io/)**。

---

## 一、测试金字塔（投入比例）

```
        /\       少量 e2e（端到端，慢但贴近真实）
       /  \      少量集成测试（跨模块/真 DB）
      /────\     大量单元测试（快、隔离、多）
```

- **单测最多**（快、便宜、定位准）：测纯函数/Service 逻辑。
- **集成适中**：测模块协作（Controller+Service+真 DB 子集）。
- **e2e 最少但关键**：测整条链路（HTTP 进来、DB 出去）。

!!! warning "反金字塔（常见错误）"
    - 只写 e2e、不写单测 → 跑得慢、反馈慢、不好定位。
    - 单测里真连生产库 → 慢且污染数据。单测靠 Mock 隔离依赖。

---

## 二、单元测试（Unit Test）

测 Service 逻辑，Mock 掉 Repository/外部依赖。

```ts
describe('PostsService', () => {
  let service: PostsService
  const repo = { find: jest.fn(), save: jest.fn() }
  beforeEach(() => {
    service = new PostsService(repo as any)  // 注入 mock
  })
  it('创建博客归属当前用户', async () => {
    repo.save.mockResolvedValue({ id: '1', authorId: 'u1' })
    const r = await service.create({ title: 't' }, 'u1')
    expect(r.authorId).toBe('u1')         // 防越权逻辑被改坏
    expect(repo.save).toHaveBeenCalled()
  })
})
```

!!! tip "单测要点"
    - 一个用例测**一个行为**，命名说清预期（如"未登录应抛 401"）。
    - Mock 边界：只 Mock **外部/慢/不可控**（DB、Redis、第三方），被测逻辑本身不 Mock。
    - 测**边界与异常**：空值、超长、权限不足、依赖抛错，比 happy path 更重要。

---

## 三、集成测试（Integration Test）

多个模块真协作，用测试库（独立 DB）。

```ts
describe('PostsModule (e2e)', () => {
  let app: INestApplication
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EmailService).useValue({ send: jest.fn() }) // 外部邮件 mock
      .compile()
    app = module.createNestApplication()
    await app.init()
  })
  afterAll(async () => { await app.close() })   // 必须关，否则 Jest 卡住
  it('POST /api/posts 需登录', async () => {
    await request(app.getHttpServer()).post('/api/posts').send({}).expect(401)
  })
})
```

!!! danger "集成/e2e 坑"
    - **不 `app.close()`** → Jest 句柄泄漏，测试进程不退出（卡住 CI）。`afterAll` 必关。
    - **用生产库测试** → 污染真实数据。用 `app_test` 独立库，跑完清空（`beforeEach` truncate）。
    - **只 `imports` 不 mock 外部服务**：发邮件/调第三方在测试环境会真发/超时。用 `overrideProvider` mock。
    - **端口冲突**：e2e 用 `app.getHttpServer()` 不需要真实监听端口，别 `listen` 固定端口。

---

## 四、Mock 边界与契约测试

- **Mock 什么**：慢/不可控/外部（DB、Redis、第三方 API、时间 `Date`、随机 `uuid`）。
- **不 Mock 什么**：被测单元的核心逻辑、纯函数。
- **契约测试**：前端与后端对接口 shape 的约定（如用 OpenAPI/Swagger 生成客户端类型），改 DTO 破坏契约时测试报警。

!!! warning "Mock 的陷阱"
    - Mock 太厚 → 测的是"Mock 行为"而非真实逻辑，上线就崩。Mock 只挡外部，内部链路尽量真。
    - 测试里的 `Date.now()`/`Math.random()` 要让它**可控**（注入或 `jest.spyOn`），否则结果不可复现。

---

## 五、覆盖率与 CI 门禁

```json
// jest.config 覆盖率阈值
{
  "coverageThreshold": {
    "global": { "branches": 80, "functions": 90, "lines": 90 }
  }
}
```

- CI 里跑 `npm test -- --coverage`，低于阈值**阻断合并**。
- 配合 `npm audit` 门禁（见 [最佳实践](best-practices.md)）。

!!! tip "覆盖率的度"
    - 追求高覆盖率是好事，但**别为覆盖率写无意义测试**（只 `expect(true).toBe(true)`）。
    - 关键业务逻辑（鉴权、计费、权限）必须高覆盖；简单的 getter/CRUD 不必死磕 100%。

---

## 六、测试体系 Checklist

- [ ] 测试金字塔：单测多、集成中、e2e 少
- [ ] 单测 Mock 外部依赖，测边界与异常
- [ ] 集成/e2e 用独立测试库，跑完清空
- [ ] `afterAll` 关闭 app，避免 Jest 卡住
- [ ] 外部服务（邮件/第三方）在测试里 override mock
- [ ] 覆盖率阈值 + 门禁，CI 测试不过不合并
- [ ] 契约测试防 DTO 破坏性变更

配合：[NestJS 进阶·测试](nestjs-pro.md)、[最佳实践](best-practices.md)、[部署与运维·CI-CD](deploy-ops.md)。
