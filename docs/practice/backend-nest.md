# NestJS 真实业务实战

代码在仓库 `examples/nest/`，是**中后台订单服务的真实骨架**（聚焦绕不过的四个点）。

数据库用 SQLite（`better-sqlite3`），**不需要装任何数据库**，clone 下来 `npm i && npm start` 直接能跑；启动时会自动建表并塞入初始库存（`SKU-A` 10 件、`SKU-B` 3 件）。换 MySQL/PG 只需改 `app.module.ts` 里 `TypeOrmModule.forRoot` 的 `type`。

---

## 四个绕不过的实战点

### 1. 请求层（统一响应 / 错误）

**难点**：每个接口自己拼 `{code,message,data}` 会散落各处、前后端联调乱。

**最佳实践**：全局 `ResponseInterceptor` 统一包装成功响应；错误用 `ExceptionFilter` 统一成结构。`main.ts` 里 `useGlobalInterceptors`。

```ts
app.useGlobalInterceptors(new ResponseInterceptor()); // 统一 {code,message,data}
```

### 2. 权限（Guard 校验权限码）

**难点**：前端隐藏按钮只是体验，**抓包直调接口就能越权删数据**。后端必须再校验。

**最佳实践**：`PermissionGuard` + `@RequirePerms('order:delete')`，从 JWT/Session 取权限码校验。

```ts
@RequirePerms('order:delete')
@UseGuards(PermissionGuard)
async deleteOrder() { /* ... */ }
```

> 权限码用 `资源:动作` 粒度；路由用前端动态注册 + 后端 Guard 双保险。

### 3. 限流（ThrottlerGuard）

**难点**：接口被刷导致下游雪崩。

**最佳实践**：`@nestjs/throttler` 的 `ThrottlerGuard` 全局启用，按 IP/用户限流；超限返回 429。分布式部署用 Redis 存储计数。

### 4. 事务（扣库存 + 建订单原子）

**难点**：下单同时要扣库存、建订单，任一步失败必须整体回滚，否则超卖。

**最佳实践**：`DataSource.transaction` 包住多步写操作；库存扣减用**乐观锁**（`WHERE stock >= qty`）防超卖。

```ts
return await this.dataSource.transaction(async (manager) => {
  // 1. 扣库存：靠 WHERE stock >= qty 在并发下防超卖
  for (const it of dto.items) {
    const result = await manager
      .createQueryBuilder()
      .update(SkuStock)
      .set({ stock: () => 'stock - :qty' })
      .where('sku = :sku AND stock >= :qty', { sku: it.sku, qty: it.qty })
      .setParameter('qty', it.qty)
      .execute();

    if (!result.affected) throw new Error(`库存不足或 SKU 不存在: ${it.sku}`);
  }
  // 2. 建订单（同一事务，抛错则一起回滚）
  return await manager.save(manager.create(Order, { ... }));
});
```

**关键点**

- 事务要短：只在事务内做必要写操作，别在里面调外部 HTTP（会长期占连接）。
- 超卖本质是并发写，乐观锁比悲观锁吞吐高，冲突时让用户重试即可。

---

## 运行方式

```bash
cd examples/nest
npm i          # 国内网络慢可加 --registry=https://registry.npmmirror.com
npm start      # 启动在 http://localhost:3000
```

> **Windows 安装注意**：`better-sqlite3` 是原生模块，需要本地编译环境。若 `npm i` 报错或编译失败，二选一：① 安装 **Visual Studio Build Tools**（勾选“使用 C++ 的桌面开发”）；② 直接跳过源码编译用预编译二进制：`npm i --build-from-source=false`。也可用淘宝镜像加速：`npm i --registry=https://registry.npmmirror.com`。

启动后可直接联调（示例为便于 curl，权限从 `x-perms` 请求头读取，真实项目应从 JWT/Session 取）：

```bash
# 1. 查库存 —— 观察统一响应结构 {code,message,data,ts}
curl http://localhost:3000/api/orders/stock/SKU-A

# 2. 不带权限下单 —— 被 Guard 拦截，返回 403
curl -X POST http://localhost:3000/api/orders \
  -H 'Content-Type: application/json' \
  -d '{"userId":1,"items":[{"sku":"SKU-A","qty":2}]}'

# 3. 带权限下单 —— 成功，库存从 10 扣到 8
curl -X POST http://localhost:3000/api/orders \
  -H 'Content-Type: application/json' -H 'x-perms: order:create' \
  -d '{"userId":1,"items":[{"sku":"SKU-A","qty":2}]}'

# 4. 混合下单验回滚 —— SKU-B 只有 3 件，要 99 件必失败，
#    此时 SKU-A 不能被扣掉（事务整体回滚）
curl -X POST http://localhost:3000/api/orders \
  -H 'Content-Type: application/json' -H 'x-perms: order:create' \
  -d '{"userId":1,"items":[{"sku":"SKU-A","qty":1},{"sku":"SKU-B","qty":99}]}'
curl http://localhost:3000/api/orders/stock/SKU-A   # 仍是 8，证明回滚生效

# 5. 连续快速请求超过 5 次/10 秒 —— 触发限流返回 429
```

也可以直接跑端到端测试，它把上面五点全断言了一遍（含并发超卖验证）：

```bash
npm test
```

---

## 更多经典核心实战点（可直接并入本骨架）

> 下面四个是后端服务天天要写的硬骨头，给出**可直接贴进 `examples/nest/src` 的完整实现**与踩坑。

### 5. 文件上传（分片 + 秒传 + 断点）

**难点**：大文件直传超时、弱网中断要重传、重复传浪费带宽；和前端 [分片上传](pc/pc-resume-upload.md) 配套。

**最佳实践**：`multer` 收分片 → 落临时目录（命名 `hash_partIndex`）→ 全到齐用 `createReadStream` 流式合并 → 查 hash 命中直接秒传。

```ts
// upload.controller.ts
@Controller('upload')
@UseInterceptors(FileInterceptor('file', { storage: diskStorage({
  destination: './uploads/tmp',
  filename: (req, file, cb) => cb(null, `${req.body.hash}_${req.body.index}`),
}) }))
export class UploadController {
  @Post('chunk')
  uploadChunk(@UploadedFile() file: Express.Multer.File, @Body() b: { hash: string; index: string }) {
    return { ok: true, saved: file.filename }; // 临时片已落盘
  }

  @Post('merge')
  merge(@Body() b: { hash: string; total: number; name: string }) {
    const dir = `./uploads/tmp/${b.hash}`;
    const write = fs.createWriteStream(`./uploads/${b.name}`);
    return new Promise((resolve, reject) => {
      const pipeNext = (i: number) => {
        if (i >= b.total) { write.end(); return resolve({ url: `/files/${b.name}` }); }
        fs.createReadStream(`${dir}_${i}`).pipe(write, { end: false })
          .on('finish', () => pipeNext(i + 1))
          .on('error', reject);
      };
      pipeNext(0);
    });
  }

  @Get('exists')
  exists(@Query('hash') hash: string) {
    return { hit: fs.existsSync(`./uploads/${hash}`), hash }; // 秒传：前端先查
  }
}
```

**踩坑**
- `multer` 默认内存存文件会爆内存 → 用 `diskStorage` 落盘，且加 `limits.fileSize` 防超大。
- 合并用 `pipe(..., { end: false })`，最后一片才 `write.end()`，否则流提前关闭丢数据。
- 分片残留要定时清理（Cron），否则磁盘被临时片占满。

### 6. WebSocket 实时通信（网关 + 鉴权 + 心跳）

**难点**：聊天/弹幕/订单状态推送要双向实时；网关要鉴权（不能裸连）、要心跳保活、要房间隔离。

**最佳实践**：用 `@nestjs/platform-ws` 或 `socket.io`；在 `handleConnection` 里验 JWT；用 `Redis Adapter` 做多实例广播。

```ts
// ws.gateway.ts
@WebSocketGateway({ namespace: '/order', cors: { origin: '*' } })
export class OrderGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;
  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    const user = verifyJwt(token);            // 鉴权失败直接断开
    if (!user) return client.disconnect();
    client.join(`user:${user.id}`);            // 按用户进房间
  }
  // 业务里推送：this.server.to(`user:${id}`).emit('order:paid', payload)
}
```

**踩坑**
- 握手阶段 JWT 要从 `handshake.auth` 或 `Authorization` 头取，别在 `data` 里传（连接后才发）。
- 多 Pod 部署时房间在单实例内存 → 用 `@socket.io/redis-adapter` 跨实例广播，否则 A 实例推不到 B 实例的连接。
- 必须心跳（`pingInterval/pingTimeout`），否则 NAT/代理静默断连，客户端"假在线"。
- 鉴权逻辑见下方第 8 点。

### 7. 缓存（CacheModule + 防穿透/击穿/雪崩）

**难点**：热点数据直查 DB 被打爆；缓存三大经典问题不处理会拖垮整个库。

**最佳实践**：`@nestjs/cache-manager` + Redis；读走 Cache-Aside；防穿透（空值缓存）、防击穿（互斥锁）、防雪崩（TTL 加随机抖动）。

```ts
@Injectable()
export class SkuService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async getSku(sku: string) {
    let v = await this.cache.get(sku);
    if (v !== undefined) return v;                  // 命中
    v = await this.repo.findOne(sku);
    if (!v) {                                       // 防穿透：空值也缓存短 TTL
      await this.cache.set(sku, null, 60);
      return null;
    }
    await this.cache.set(sku, v, 300 + Math.floor(Math.random() * 60)); // 防雪崩：TTL 抖动
    return v;
  }
}
```

**踩坑**
- 缓存与 DB 不一致 → 写操作后删缓存（Cache-Aside），或直接更新（见 [Java 缓存一致性](java/cache-consistency.md)）。
- 热点 key 过期瞬间高并发回源 = 击穿 → 用单飞/互斥锁（如 Redis `SET NX`）只放一个请求回源。
- `cache-manager` v5 默认内存，生产必须换 Redis store，否则多实例各存各的。

### 8. Auth / JWT 无感刷新（双 Token）

**难点**：accessToken 短命（15min）过期导致频繁登录；refreshToken 被盗风险；前端 [无感刷新](pc/pc-request-layer.md) 要后端配合。

**最佳实践**：`accessToken`（短）+ `refreshToken`（长，存 HttpOnly Cookie）；access 过期用 refresh 换发，refresh 用一次性或轮换策略防重放。

```ts
// auth.service.ts
async refresh(rt: string) {
  const payload = this.jwt.verify(rt, { secret: REFRESH_SECRET });
  const stored = await this.redis.get(`rt:${payload.sub}`);
  if (!stored || stored !== rt) throw new UnauthorizedException('refresh 失效'); // 轮换：旧 rt 作废
  await this.redis.del(`rt:${payload.sub}`);        // 用即废，防重放
  const newRt = this.issueRt(payload.sub);
  await this.redis.set(`rt:${payload.sub}`, newRt, 'EX', 7 * 86400);
  return { accessToken: this.issueAt(payload.sub), refreshToken: newRt };
}
```

**踩坑**
- refreshToken 放 localStorage 易被 XSS 偷 → 放 **HttpOnly Cookie**（前端 JS 读不到）。
- 单飞刷新：多个请求同时 access 过期，后端应让它们复用同一次 refresh（见前端 [single-flight](pc/pc-request-layer.md)），别刷 N 次。
- refresh 不校验吊销（用户改密/登出）→ 用 Redis 存有效 rt，改密时清掉全设备 rt。
- 多端登录互踢：rt 以 `userId` 为 key 单值存，新登录覆盖旧 rt（或存集合允多端）。

### 踩坑记录

**坑 1：`new ThrottlerGuard()` 会在首个请求时崩**

原来 `main.ts` 里写的是 `app.useGlobalGuards(new ThrottlerGuard())`。`ThrottlerGuard` 需要容器注入 `options`、`storageService`、`reflector` 三个依赖，手动 new 出来这些全是 undefined。正确做法是在 Module 里用 `APP_GUARD` 注册，让 Nest 完成注入：

```ts
providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }]
```

**坑 2：`$1/$2` 是 PostgreSQL 占位符，且 `affectedRows` 取不到**

原来的裸 SQL 用 `$1/$2` 占位并判断 `res[0]?.affectedRows === 0`——占位符语法各数据库不通用（MySQL/SQLite 用 `?`），而 `affectedRows` 的返回结构也随驱动而异，在 PG 下 `res[0]` 根本不是这个形状。判定失效意味着**库存不足时不会抛错，直接超卖**。改用 QueryBuilder 后由 TypeORM 统一成 `result.affected`，跨数据库一致。

**坑 3：`Reflect.metadata` 配 `Reflector.get` 不可靠**

`RequirePerms` 原本用裸 `Reflect.metadata(PERMS_KEY, perms)`，它返回的装饰器签名与 Nest 的 `Reflector` 读取约定不完全一致。应该用官方配套的 `SetMetadata`。

**坑 4：权限判断别写在 Service 里**

原 `createOrder` 里有一段 `if (!dto.perms.includes('order:create')) throw`，把权限码当业务参数传进来。这样内部调用可以随便伪造 `perms` 绕过，且同一规则在 Guard 和 Service 两处维护。已移到 Controller 的 `@RequirePerms` 统一处理。
