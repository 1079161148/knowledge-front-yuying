# 🐱 NestJS 进阶

> 生产级服务端实战。依据 **[NestJS 官方文档](https://docs.nestjs.com/)**、**[Prisma](https://www.prisma.io/)**、**[TypeORM](https://typeorm.io/)**。本页讲**进阶工程**：数据库、鉴权实战、缓存、队列、微服务、WebSocket、配置、测试、部署、性能。

---

## 1. 数据库集成（TypeORM / Prisma）

**TypeORM（Nest 官方推荐集成）**
```ts
@Module({
  imports: [TypeOrmModule.forRoot({ type: 'postgres', host, port, username, password, database, autoLoadEntities: true, synchronize: false })],
})
// 实体
@Entity() export class User {
  @PrimaryGeneratedColumn() id: number
  @Column({ unique: true }) email: string
  @Column() password: string
}
// 仓储注入
@Injectable() export class UserService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}
  async create(dto: CreateUserDto) { return this.repo.save(dto) }
}
```

**Prisma（类型安全、迁移友好）**
```ts
// schema.prisma 定义模型 → prisma generate/migrate
@Injectable() export class UserService {
  constructor(private prisma: PrismaService) {}
  findAll() { return this.prisma.user.findMany() }
}
```
- 选型：Prisma 类型体验好、迁移顺；TypeORM 装饰器风格、与 Nest DI 天然契合。生产 `synchronize:false`，用迁移（migration）管理表结构。

!!! danger "数据库集成坑（生产事故高发）"
    - **`synchronize:true` 上生产 = 自动改表**：TypeORM 会按实体同步表结构，可能删字段丢数据。生产**必须 false** + 用 migration。
    - **密码字段别明文**：`@Column() password` 存明文即违规。存 `bcrypt` 哈希，且 DTO/Response 里永远别返回 password。
    - **Repository 每次 new**：Repository 应由 Nest DI 注入（`@InjectRepository`），不要每次请求手 `new`，否则失去连接池与事务上下文。
    - **Prisma 客户端要单例**：`PrismaService` 全局复用，别在请求里 `new PrismaClient()`（连接数爆炸）。

---

## 2. 鉴权实战（JWT）

```ts
// auth.service.ts
const token = this.jwtService.sign({ sub: user.id, role: user.role })
// auth.guard.ts：校验 JWT，写入 req.user
@UseGuards(JwtAuthGuard) @Post('login') login(@Body() dto: LoginDto) {}
```
- 密码：`bcrypt.compare(plain, hash)`；refresh token 单独存储/轮转。
- 与 [安全·认证授权](../security/auth.md) 的防护一一对应（HttpOnly Cookie / 短过期）。

!!! warning "JWT 实战要点"
    - Payload 别放敏感信息（JWT 只是 base64 编码，前端可解码）。只放 `sub`(用户ID)、`role` 等非敏感标识。
    - Access Token 短过期（如 15min），Refresh Token 长过期且**服务端存库/Redis** 可吊销。
    - 改密码后要让旧 refresh token 失效（版本号/黑名单）。
    - WS 网关也套 Guard，避免"HTTP 鉴权了、WebSocket 裸连"。

---

## 3. 缓存（Redis）

```ts
@Module({ imports: [CacheModule.register({ store: redisStore, host, port, ttl: 60 }) })
// 使用
@UseInterceptors(CacheInterceptor)   // 自动缓存 GET
@Get() findAll() {}
// 手动
constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}
await this.cache.set('k', v, 60); await this.cache.get('k')
```
- 热点数据走 Redis，降低 DB 压力；注意缓存穿透/击穿/雪崩。

!!! warning "缓存三大灾难（面试常考）"
    - **穿透**：查不存在的数据，缓存和 DB 都没有，请求每次打 DB。→ 缓存空值（短 TTL）或布隆过滤器。
    - **击穿**：某个热点 key 过期瞬间，大量请求同时击穿到 DB。→ 互斥锁（只放一个请求回源）或逻辑过期。
    - **雪崩**：大量 key 同一时间过期/Redis 挂，DB 被冲垮。→ 过期时间加随机抖动；Redis 高可用（哨兵/集群）。
    - 多实例下缓存是共享的（Redis），别用进程内存当缓存（见 cluster 陷阱）。

---

## 4. 队列（BullMQ）

```ts
@Processor('email') export class EmailConsumer {
  @Process() async handle(job: Job) { await sendMail(job.data) }
}
// 入队
@InjectQueue('email') private queue: Queue
await this.queue.add('send', { to: email })
```
- 异步任务（邮件/导出/第三方回调）用队列削峰，失败重试。

!!! tip "队列适用场景"
    - 耗时任务（发邮件、生成报表、视频转码）不要阻塞 HTTP 响应，丢进队列异步做，立即返回"已受理"。
    - 第三方 Webhook/回调高峰用队列削峰，避免打爆下游。
    - 设 `attempts`（重试次数）+ 死信队列，失败任务别丢；消费者要**幂等**（同任务重放不重复副作用）。

---

## 5. 微服务与传输

```ts
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.TCP, options: { host: 'localhost', port: 8877 },
})
```
- 传输：TCP / Redis / NATS / Kafka / gRPC / MQTT。适合把鉴权、通知等拆成独立服务。

!!! warning "微服务不是银弹"
    - **小项目别上微服务**：引入分布式事务、服务发现、链路追踪、网络开销，运维成本指数级上升。先单体模块化（Nest 的 Module 已够清晰）。
    - 跨服务调用要处理**网络失败/超时/重试幂等**，比同进程方法调用复杂得多。
    - 选传输层：内部低延迟用 TCP/NATS；需要持久化/削峰用 Kafka；跨语言用 gRPC。

---

## 6. WebSocket（实时）

```ts
@WebSocketGateway(3001)
export class ChatGateway implements OnGatewayConnection {
  @SubscribeMessage('message') handle(@MessageBody() body: any) {
    return { event: 'message', data: body }
  }
  handleConnection(client: Socket) {}
}
```
- 聊天/推送/实时协作；与 HTTP 鉴权共用 Guard（WS 也支持）。

!!! warning "WebSocket 实战坑"
    - **连接数**：长连接常驻，注意服务端 `max connections` 与内存。心跳（ping/pong）保活、清理断线。
    - **多实例广播**：cluster/多 Pod 下，A 实例的用户收不到 B 实例发的消息。要用 Redis Adapter 做跨实例广播。
    - **鉴权**：WS 握手也要走 Guard，别让未登录用户直接连网关拿数据。

---

## 7. 配置 / 环境变量

```ts
@Module({ imports: [ConfigModule.forRoot({ isGlobal: true })] })
// 使用
constructor(private cfg: ConfigService) {}
this.cfg.get<string>('DATABASE_URL')
```
- 敏感配置走环境变量（`.env` 不入库）；多环境用 `NODE_ENV` 切换。

!!! danger "配置错误会出生产事故"
    - `ConfigModule.forRoot()` 没设 `isGlobal:true` 时，其他模块注入 `ConfigService` 会报"无法解析依赖"——要么全局、要么每个模块都 `imports`。
    - `cfg.get('PORT')` 返回 `string | undefined`，端口/数字要 `parseInt` 或 `|| 3000` 兜底。
    - 别把 `.env` 提交 git；CI/CD 的环境变量在平台后台配，不进仓库。

---

## 8. 测试

```ts
// 单元测试（服务）
const service = new UserService(repoMock)
expect(await service.findAll()).toEqual([])
// 端到端（e2e）
const module = await Test.createTestingModule({ imports: [AppModule] }).compile()
const app = module.createNestApplication(); await app.init()
// supertest 调真实接口
```
- `jest` + `supertest`；mock Provider（`overrideProvider`）；CI 跑测试门禁。

!!! tip "测试避坑"
    - 单测 mock 掉 DB/外部服务（别真连库），保证快且稳定；e2e 测试才起真实 App + 测试库。
    - `beforeEach` 里 `app.init()` 记得 `afterEach` `app.close()`，否则端口/Jest 句柄泄漏导致测试卡住。
    - 测试库用独立库（如 `app_test`），别用生产库，跑完可清空。

---

## 9. 部署与性能

- 反向代理（Nginx）终止 TLS、转发 `/api`；多实例 + `cluster`（或容器编排）。
- 优雅关闭：监听 `SIGTERM`，停止接新请求、排空后再退出。
- 健康检查 `/healthz`、`/health/ready`；PM2 / Docker / K8s。
- 性能：`Compression` 压缩响应、连接池、缓存、避免同步阻塞、限流（`@nestjs/throttler`）。

!!! danger "部署与性能红线"
    - **直接 `node` 跑生产**：进程崩了没人拉起。用 PM2 / Docker `restart: always` / K8s 自愈。
    - **端口硬编码**：用 `process.env.PORT`，容器/K8s 会动态分配；`0.0.0.0` 监听别只 `localhost`（容器内外部访问不到）。
    - **优雅关闭**：监听 `SIGTERM`/`SIGINT`，先停接新请求、排空在途请求再退出，否则滚动发布会丢请求。
    - **健康检查**：`/healthz`（存活）、`/health/ready`（就绪，查 DB/Redis 连通）给 K8s 探针用。
    - **别在容器里 build**：镜像里装 devDependencies 又跑 `nest build`，镜像巨大。用多阶段构建（builder 阶段 build，runner 阶段只装 production 依赖）。

---

## 10. 下一步

- 底层 Node API 看 [Node.js 基础/高级/进阶](nodejs-basic.md)。
- 全链路安全看 [前端安全全集](../security/index.md)。
