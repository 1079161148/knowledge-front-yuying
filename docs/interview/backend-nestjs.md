# 🐱 NestJS 面试题

> Node 服务端主流企业级框架。面试常问「依赖注入、模块系统、装饰器、生命周期、异常处理、管道守卫、微服务」。答案依据 **[NestJS 官方文档](https://docs.nestjs.com/)**、**[Spring 官方文档](https://spring.io/projects/spring-framework)**（设计思想同源）。

---

## 1. 基础与设计思想

#### Q1：NestJS 是什么？和 Express/Koa 的关系？
- 基于 Express（或 Fastify）的**渐进式 Node 服务端框架**，借鉴 Angular/Spring 的**模块化 + 依赖注入（DI）** 思想。
- 底层 HTTP 仍是 Express/Koa，Nest 在上层提供架构约束（Controller/Service/Module/DI）。

#### Q2：控制反转（IoC）与依赖注入（DI）？
- IoC：把对象创建权交给容器；DI：容器在运行时把依赖「注入」到使用方（构造函数 `@Injectable()`）。
- 好处：解耦、易测试（mock 依赖）、可维护。

#### Q3：Module 的作用与共享模块？
- Module 用 `@Module({ controllers, providers, imports, exports })` 划定边界。
- 共享：`exports` 导出的 provider 可被 `imports` 该模块的其它模块复用；全局模块用 `@Global()`。

## 2. 装饰器与请求处理

#### Q4：常见的装饰器？
- 路由：`@Controller`、`@Get/@Post/@Put/@Delete`、`@Param/@Query/@Body/@Headers`。
- 参数：`@Req/@Res`、`@Session`、`@Ip`。
- 类：`@Injectable()`（可被注入）、`@Module()`。

#### Q5：Provider 的几种写法？
- `useClass`（默认）、`useValue`（常量/配置）、`useFactory`（工厂，可依赖其他 provider）、`useExisting`（别名）。
- 自定义 Provider token：`@Inject('TOKEN')` 注入非类标识。

## 3. 管道 / 守卫 / 拦截器 / 过滤器

#### Q6：Pipe（管道）用途？内置有哪些？
- 用于**输入转换 + 校验**：`ParseIntPipe`、`ParseUUIDPipe`、`ValidationPipe`（配合 class-validator）。
- 执行顺序：路由参数 → 方法参数，抛 `BadRequestException` 自动 400。

#### Q7：Guard（守卫）做什么？和 Middleware 区别？
- Guard：`canActivate` 返回布尔，做**鉴权/角色**（如 `RolesGuard` + `@Roles()`）。
- 区别：Middleware 拿不到路由/执行上下文；Guard 能拿到 `ExecutionContext`（controller/method），更精准。

#### Q8：Interceptor（拦截器）场景？
- `axios` 式拦截：统一响应包装、超时、缓存、日志、映射转换。实现 `intercept(context, next)` 包装 `next.handle()` 的 Observable。

#### Q9：Exception Filter（异常过滤器）？
- 捕获未处理异常，统一错误响应结构；`@Catch(HttpException)` 或全局 `useGlobalFilters`。
- 配合 `HttpException` 返回规范状态码与 message。

## 4. 生命周期与配置

#### Q10：生命周期钩子？
- `OnModuleInit`（模块初始化后）、`OnApplicationBootstrap`（监听前）、`OnModuleDestroy` / `BeforeApplicationShutdown` / `OnApplicationShutdown`（优雅关闭，释放 DB/Redis 连接）。

#### Q11：怎么读配置与环境变量？
- `ConfigModule.forRoot()` + `ConfigService.get('KEY')`；多环境用 `.env` + `validation` 校验（Joi/zod）。

## 5. 数据库与验证

#### Q12：NestJS 怎么接数据库（TypeORM/Prisma）？
- TypeORM：`TypeOrmModule.forFeature([Entity])` 注入 Repository；Prisma 用 `PrismaService`。
- 事务：`@Transaction()` / `dataSource.transaction`。

#### Q13：全局校验怎么开启？
- `app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))`，DTO 用 `class-validator` 装饰器（`@IsEmail()` 等），`whitelist` 剔除多余字段防越权。

## 6. 微服务与进阶

#### Q14：NestJS 支持哪些传输层（微服务）？
- TCP、Redis、NATS、MQTT、gRPC、Kafka、RabbitMQ。用 `Transport.*` 配置；`@MessagePattern` / `@EventPattern` 定义消息处理。

#### Q15：怎么保证接口安全与限流？
- 守卫做 JWT 鉴权；`ThrottlerModule` 做限流；CORS 白名单；全局 ValidationPipe 防脏数据；详见 [后端安全专项](../backend/security-backend.md)。

#### Q16：NestJS 如何处理文件上传？
- `FilesInterceptor` / `FileInterceptor` + `multer`；大文件建议分片（见 [大文件断点续传](../practice/pc/pc-resume-upload.md) 思路同源）。

## 7. 下一步

- Node 基础看 [Node.js 面试题](backend-node.md)；Java 对照看 [Java 面试题](backend-java.md)。
- 实战落地看 [NestJS 真实业务实战](../practice/backend-nest.md)、[NestJS 进阶](../backend/nestjs-pro.md)。
