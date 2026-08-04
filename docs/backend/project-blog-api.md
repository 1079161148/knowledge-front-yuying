# 🛠️ 实战：从 0 搭一个完整博客 API（综合串讲）

> 前面各章讲了分散的知识点，本篇把它们**串成一个可运行的真实项目**：用户注册登录（JWT）+ 博客 CRUD + 鉴权守卫 + 参数校验 + 统一响应/异常处理 + Redis 缓存 + 限流。学完你就能照葫芦画瓢搭任何业务后端。
>
> 技术栈：**NestJS + TypeORM + PostgreSQL + Redis + class-validator + @nestjs/throttler**。所有代码省略 import，重点看"怎么组织、每步为什么"。

---

## 一、项目初始化与分层结构

```bash
npm i -g @nestjs/cli
nest new blog-api
cd blog-api
npm i @nestjs/typeorm typeorm pg @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm i @nestjs/throttler cache-manager @nestjs/cache-manager redis class-validator class-transformer
```

目录（标准 Nest 分层，对应 [架构模式](architecture.md)）：

```
src/
  main.ts                # 入口：全局管道/守卫/拦截器/中间件
  app.module.ts          # 根模块，聚合下面所有模块
  auth/                  # 认证模块
    auth.module.ts  auth.service.ts  auth.controller.ts
    dto/login.dto.ts  jwt.strategy.ts  jwt-auth.guard.ts
  users/                 # 用户模块
    users.module.ts  users.service.ts  users.controller.ts
    user.entity.ts  dto/create-user.dto.ts
  posts/                 # 博客模块
    posts.module.ts  posts.service.ts  posts.controller.ts
    post.entity.ts  dto/create-post.dto.ts
  common/                # 横切：拦截器/过滤器/装饰器
    response.interceptor.ts  all-exceptions.filter.ts
```

!!! tip "为什么这样拆"
    - 每个**业务域一个 Module**，内部 Controller(薄)/Service(业务)/Entity(数据) 三层。
    - `common/` 放**所有模块共用**的横切逻辑（统一响应、统一异常），避免重复。
    - 跨模块用 Service 必须 `exports`+`imports`（见 [NestJS 基础·DI 坑](nestjs-basic.md)）。

---

## 二、全局装配（main.ts）

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api')                       // 所有路由前缀 /api
  app.useGlobalPipes(new ValidationPipe({          // 全局校验（见高级·坑）
    whitelist: true, transform: true, forbidNonWhitelisted: true,
  }))
  app.useGlobalFilters(new AllExceptionsFilter())  // 统一异常
  app.useGlobalInterceptors(new ResponseInterceptor()) // 统一响应
  app.use(helmet())                                // 安全头（见上线防护）
  app.enableCors({ origin: ['https://your.site'], credentials: true })
  await app.listen(process.env.PORT ?? 3000)       // 端口走环境变量
}
```

!!! warning "全局 vs 局部"
    - `useGlobalPipes` 在 `main.ts` 注册的全局管道**不走 DI 注入**（无法注入 ConfigService）。若管道需要依赖，要在 `AppModule` 的 `providers` 里 `provide: APP_PIPE` 注册。
    - 前缀 `/api` 要和前端约定一致，否则联调 404。

---

## 三、用户模块：注册 + 实体 + DTO 校验

`users/user.entity.ts`：
```ts
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ unique: true }) email: string
  @Column() passwordHash: string        // 只存哈希，绝不存明文
  @CreateDateColumn() createdAt: Date
}
```

`users/dto/create-user.dto.ts`（校验是安全最后一道门）：
```ts
export class CreateUserDto {
  @IsEmail() email: string
  @IsString() @MinLength(8) @Matches(/[A-Za-z]/) @Matches(/\d/) password: string // 强密码
}
```

`users/users.service.ts`：
```ts
async create(dto: CreateUserDto) {
  const exists = await this.repo.findOne({ where: { email: dto.email } })
  if (exists) throw new ConflictException('邮箱已注册')
  const passwordHash = await bcrypt.hash(dto.password, 10) // 加盐哈希
  const user = this.repo.create({ ...dto, passwordHash })
  return this.repo.save(user)
}
```

!!! danger "注册接口红线"
    - **密码必须 `bcrypt.hash`（含随机盐）**，绝不 `md5(password)`。
    - 返回用户时**绝不带 `passwordHash`**（DTO 出参单独定义，见 [NestJS 基础·DTO](nestjs-basic.md)）。
    - 邮箱唯一约束冲突要转成 409，别把 SQL 错误直接抛前端。

---

## 四、认证模块：JWT 登录 + 守卫

`auth/jwt.strategy.ts`（从请求取用户）：
```ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,   // 密钥走环境变量
    })
  }
  async validate(payload: { sub: string; role: string }) {
    return { userId: payload.sub, role: payload.role } // 挂到 req.user
  }
}
```

`auth/jwt-auth.guard.ts`：
```ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}  // 复用 passport
```

`auth/auth.controller.ts`：
```ts
@Post('login')
@HttpCode(200)
async login(@Body() dto: LoginDto) {
  const user = await this.authService.validate(dto)   // 查库 + bcrypt.compare
  if (!user) throw new UnauthorizedException('邮箱或密码错误') // 不透露是哪个错
  const token = this.jwtService.sign({ sub: user.id, role: user.role },
    { expiresIn: '15m' })                              // 短过期
  return { accessToken: token }
}
```

!!! warning "登录接口坑"
    - 账号/密码错误**统一返回 401**，别区分"用户不存在"还是"密码错"——避免被枚举账号。
    - JWT `secretOrKey` 必须强随机且来自环境变量，别硬编码 `'secret'`。
    - Access Token 短过期（15m），Refresh Token 单独存 Redis 可吊销（见 [NestJS 进阶·JWT](nestjs-pro.md)）。

---

## 五、博客模块：鉴权 + 校验 + 缓存 + 限流

`posts/posts.controller.ts`：
```ts
@Controller('posts')
@UseGuards(JwtAuthGuard)          // 整个控制器要登录
export class PostsController {
  constructor(private readonly svc: PostsService) {}

  @Post()
  create(@Body() dto: CreatePostDto, @Req() req) {
    return this.svc.create(dto, req.user.userId)  // 用 req.user 防越权
  }

  @Get()
  @Throttle({ default: { limit: 60, ttl: 60000 } }) // 限流：每分 60 次
  findAll(@Query('page', ParseIntPipe) page = 1) {
    return this.svc.findAll(page)
  }
}
```

`posts/posts.service.ts`（缓存防穿透）：
```ts
@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private repo: Repository<Post>,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async findAll(page: number) {
    const key = `posts:page:${page}`
    const cached = await this.cache.get(key)
    if (cached) return cached                 // 命中缓存
    const data = await this.repo.find({       // 回源
      skip: (page - 1) * 10, take: 10, order: { createdAt: 'DESC' },
    })
    await this.cache.set(key, data, 60_000)   // 缓存 60s，加随机防雪崩
    return data
  }
}
```

!!! danger "综合避坑点（生产事故高发）"
    - 创建博客用 `req.user.userId` 而不是前端传的 `authorId`——**防越权**（前端可篡改 `authorId` 冒名）。
    - 缓存 key 必须有 `page` 维度，且设过期；批量清缓存要注意一致性（更新后删 `posts:page:*`）。
    - 限流基于真实用户/IP，多实例要配 Redis 适配器（见 [分布式与高并发](distributed.md)）。
    - `@Query('page')` 默认字符串，必须 `ParseIntPipe` 或手动转，否则 `skip` 算错返回空。

---

## 六、统一响应与异常（common/）

`response.interceptor.ts`：把所有响应包成 `{ code: 0, data, message }`：
```ts
intercept(context, next) {
  return next.handle().pipe(map(data => ({ code: 0, data, message: 'ok' })))
}
```

`all-exceptions.filter.ts`：
```ts
catch(exception, host) {
  const ctx = host.switchToHttp()
  const status = exception instanceof HttpException
    ? exception.getStatus() : 500
  const res = exception instanceof HttpException
    ? exception.getResponse() : { message: '服务器内部错误' }  // 生产不吐堆栈
  ctx.getResponse().status(status).json({ code: status, data: null, message: res['message'] ?? 'error' })
}
```

!!! tip "为什么必须统一"
    - 前端只用一种结构解析（`res.code === 0` 成功），不用每个接口判断 `status===200` 还是 `body.code`。
    - 未知错误返回**通用 500 文案**，堆栈/SQL 错误绝不返前端（信息泄露，见 OWASP）。

---

## 七、跑起来 + 自查

```bash
# .env
DATABASE_URL=postgres://user:pwd@localhost:5432/blog
JWT_SECRET=换成强随机串
REDIS_URL=redis://localhost:6379
PORT=3000

npm run start:dev
# 测试：注册 → 登录拿 token → 带 Authorization 头建博客 → 列表
```

**本实战覆盖的知识点映射：**
| 能力点 | 见章节 |
|--------|--------|
| 分层/模块化 | [架构模式](architecture.md) |
| 全局管道/守卫/拦截器/过滤器 | [NestJS 高级](nestjs-advanced.md) |
| DTO 校验/越权防护 | [Node 最佳实践](best-practices.md) |
| JWT/密码哈希 | [NestJS 进阶](nestjs-pro.md) |
| 缓存/限流 | [分布式与高并发](distributed.md) |
| 上线防护/配置 | [部署与运维](deploy-ops.md) |

下一篇：[性能调优](performance-tuning.md) 学怎么让这个服务扛住高并发。
