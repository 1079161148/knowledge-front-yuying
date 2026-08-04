# 🐱 NestJS 高级

> 请求处理管线核心能力。依据 **[NestJS 官方文档](https://docs.nestjs.com/)**。本页讲**高级**：管道（Pipe）、守卫（Guard）、拦截器（Interceptor）、异常过滤器（Filter）、中间件（Middleware）、自定义装饰器、执行顺序。

---

## 1. 请求处理顺序（重要）

```
中间件 Middleware → 守卫 Guard → 拦截器 Interceptor(before) → 管道 Pipe
→ 控制器方法 → 服务 → 拦截器 Interceptor(after) → 异常过滤器 Filter(出错时)
```
- 这一套就是 Nest 的**横切关注点（AOP）**模型，类似 Java Spring 的切面。

!!! tip "执行顺序决定了能力边界"
    - 想在"进控制器前"就拦掉未登录 → 用 **Guard**（最适合鉴权）。
    - 想改请求参数/做类型转换 → 用 **Pipe**（最适合校验/转换）。
    - 想统一包装响应、记耗时 → 用 **Interceptor**（最适合响应处理）。
    - 想统一错误处理 → **Exception Filter**。
    - 中间件在最外层，适合 CORS、日志等"所有请求通用"的逻辑。别把鉴权放中间件又放 Guard，职责重叠。

---

## 2. 管道 Pipe（输入校验 + 转换）

```ts
@Injectable() export class ParseIntPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const n = parseInt(value, 10)
    if (isNaN(n)) throw new BadRequestException('id 必须是数字')
    return n
  }
}
```
- 内置：`ValidationPipe`（配合 class-validator）、`ParseIntPipe`/`ParseUUIDPipe`/`ParseBoolPipe`/`ParseArrayPipe`、`DefaultValuePipe`。

!!! warning "ValidationPipe 配置陷阱"
    - 没开 `whitelist:true` 时，前端多传的字段（如 `isAdmin:true`）会被原样写进实体 → **批量赋值漏洞**（越权提权）。
    - 没开 `transform:true` 时，`@Query('page') page: number` 仍是字符串，类型转换不生效。
    - `forbidNonWhitelisted:true` 可让多余字段直接 400，比默默忽略更安全。
    - 别忘了在 `main.ts` 全局 `useGlobalPipes`，否则每个路由要手动 `@UsePipes`。

- 全局启用校验：
```ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
```
```ts
// DTO 校验
export class CreateUserDto {
  @IsEmail() email: string
  @IsInt() @Min(0) age: number
}
```

---

## 3. 守卫 Guard（鉴权 / 授权）

```ts
@Injectable() export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest()
    return !!req.user   // false → 403/401
  }
}
// 使用
@UseGuards(AuthGuard)
@Get('profile')
getProfile() {}
```
- 角色守卫：
```ts
@Injectable() export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext) {
    const roles = this.reflector.get<string[]>('roles', ctx.getHandler())
    const user = ctx.switchToHttp().getRequest().user
    return roles?.includes(user.role)
  }
}
// 自定义角色装饰器
export const Roles = (...roles: string[]) => SetMetadata('roles', roles)
```
- 与 [安全·认证授权](../security/auth.md) 对应：守卫做"是否放行"。

!!! danger "Guard 鉴权坑"
    - 守卫 `canActivate` 返回 `false` 时 Nest 默认抛 `ForbiddenException(403)`；若想区分"未登录"，应在守卫内判断无 token 时抛 `UnauthorizedException(401)`。
    - 角色校验别只信前端传的 `role` 字段——`role` 必须从 **JWT/服务端 Session** 取，绝不能用客户端请求体里的 `role`。
    - 全局守卫要对登录/公开接口做白名单放行（如 `/auth/login`），否则所有接口都要 token，死循环。

---

## 4. 拦截器 Interceptor（转换 / 日志 / 缓存）

```ts
@Injectable() export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map(data => ({ data, code: 0 })))  // 统一响应
  }
}
// 超时拦截
@Injectable() export class TimeoutInterceptor implements NestInterceptor {
  intercept(_, next) { return next.handle().pipe(timeout(5000)) }
}
```
- 用途：统一响应体、异常包装、耗时日志、缓存、超时控制。

!!! warning "Interceptor 注意点"
    - `next.handle()` 返回的是 `Observable`，拦截器是 RxJS 流。用 `map` 改数据、`catchError` 处理异常、`timeout` 设超时。
    - 统一响应拦截器（`{code:0, data}`）会和 Exception Filter 冲突：异常走 Filter，正常走 Interceptor，两边响应格式要约定一致，否则前端解析崩溃。
    - 超时拦截器抛 `TimeoutError`，要配 Filter 转成 504。

---

## 5. 异常过滤器 Exception Filter

```ts
@Catch(HttpException)
@Injectable() export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse()
    const status = exception.getStatus()
    res.status(status).json({ code: status, msg: exception.message })
  }
}
// 全局
app.useGlobalFilters(new HttpExceptionFilter())
```
- 抛错：`throw new BadRequestException()` / `NotFoundException()` / `ForbiddenException()`。
- 业务统一错误码在过滤器里收敛。

!!! danger "异常处理别吞错"
    - **永远抛 Nest 的 HttpException 而非原生 Error**：原生 Error 会被当成 500，且信息可能泄露内部细节给前端。
    - 全局 Filter 要区分"已知业务错误"（透传 message）和"未知错误"（记日志、返回通用 500，别把堆栈/SQL 错误返给前端——信息泄露）。
    - 生产环境不要把 `exception.stack` 写进响应体。

---

## 6. 中间件 Middleware

```ts
@Injectable() export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`${req.method} ${req.originalUrl}`)
    next()
  }
}
// 在模块 configure 注册（或全局 app.use）
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('cats')
  }
}
```
- 中间件运行在守卫之前，适合日志、CORS、早期处理。

---

## 7. 自定义装饰器

```ts
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user
)
// 使用
@Get('profile') getProfile(@User() user: UserEntity) {}
```
- 提取公共参数（user、token、IP），让控制器更干净。

---

## 8. 下一步

- 生产落地看 [NestJS 进阶](nestjs-pro.md)：数据库、鉴权实战、缓存、队列、微服务、测试、部署。
- 配套服务端安全看 [前端安全全集](../security/index.md)。
