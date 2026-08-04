# 🐱 NestJS 基础

> 渐进式 Node.js 服务端框架，基于 TypeScript、依赖注入、模块化。依据 **[NestJS 官方文档](https://docs.nestjs.com/)**。本页讲**基础**：架构、控制器、服务、模块、DTO、Provider、入门命令。

---

## 1. 为什么用 NestJS

- 受 Angular 启发的**分层架构** + 全功能 DI 容器，适合中大型后端。
- 默认基于 Express（可切 Fastify），装饰器驱动，TypeScript 一等公民。

---

## 2. 核心概念：模块 / 控制器 / 服务（Provider）

```ts
// user.module.ts
@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

// user.controller.ts
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}   // 注入
  @Get(':id')
  findOne(@Param('id') id: string) { return this.userService.findOne(+id) }
}

// user.service.ts
@Injectable()
export class UserService {
  private users = [{ id: 1, name: 'a' }]
  findOne(id: number) { return this.users.find(u => u.id === id) }
}
```

| 装饰器 / 概念 | 作用 |
|---------------|------|
| `@Module` | 声明模块的 controller/provider/imports/exports |
| `@Controller` | 定义路由前缀与控制器 |
| `@Injectable` | 标记为可注入的 Provider |
| `@Get/@Post/@Put/@Delete/@Patch` | 路由方法装饰器 |
| `@Param/@Query/@Body/@Headers` | 参数提取 |
| 构造器注入 | `constructor(private s: Service)` |

---

## 3. 路由与请求处理

```ts
@Controller('cats')
export class CatsController {
  @Post() create(@Body() dto: CreateCatDto) {}
  @Get() findAll(@Query('page') page: string) {}
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) {}
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateCatDto) {}
  @Delete(':id') remove(@Param('id') id: string) {}
}
```
- 状态码：`@HttpCode(201)`；重定向：`@Redirect()`；响应头：`@Header()`。
- 路径参数默认字符串，用 `ParseIntPipe` 转数字（见高级·管道）。

!!! warning "路由与请求处理坑"
    - **路由顺序敏感**：`@Get(':id')` 写在 `@Get('me')` 前面，`/users/me` 会被 `:id` 抢走（`me` 当 id）。具体路由放前面。
    - **路径参数默认是字符串**：`@Param('id') id` 拿到的是 `'123'`（字符串），直接当数字比较会出错，必须 `ParseIntPipe` 或手动 `+id`。
    - **`@Query` 永远是字符串**：`?page=2` 拿到 `'2'`，分页前要转数字，否则 SQL 偏移算错。

---

## 4. DTO（数据传输对象）

```ts
// create-cat.dto.ts
export class CreateCatDto {
  readonly name: string
  readonly age: number
  readonly breed?: string
}
```
- DTO 是**接口契约**，配合 `class-validator` 做校验（见高级篇），也是 OpenAPI/Swagger 的字段来源。

!!! tip "DTO 设计原则"
    - 入参和出参最好分开（Create vs Response），别把带密码的实体直接 `return` 给前端（字段泄漏）。
    - DTO 用 `class` 而非 `interface`：运行时 `class-validator` 靠装饰器元数据校验，`interface` 编译后被擦除，无法运行时校验。

---

## 5. Provider 与注入

```ts
// 自定义 Provider（值/工厂/异步）
const config = { apiKey: 'x' }
@Module({ providers: [{ provide: 'CONFIG', useValue: config }] })
export class AppModule {}

// 使用
constructor(@Inject('CONFIG') private cfg: { apiKey: string }) {}
```
- 注入方式：类（最常见）、`useValue`、`useFactory`（依赖其他 provider）、`useClass`（多态实现）。
- 作用域（Scope）：默认单例；可选 `REQUEST`（每请求新实例）、`TRANSIENT`。

!!! danger "DI 新手三大报错"
    - **Nest 无法解析依赖**：Provider 没在模块的 `providers` 注册，或忘了 `@Injectable()` 装饰器。报错 `Nest can't resolve dependencies`。
    - **循环依赖**：`A` 注入 `B`，`B` 又注入 `A` → 启动报错。用 `@ForwardRef()` 双向声明，或重构拆出公共 Service。
    - **跨模块注入 undefined**：模块 A 想用模块 B 的 Service，B 必须在 `exports` 里导出、A 在 `imports` 里引入，否则注入到的是 `undefined`（运行时才炸）。

---

## 6. 模块组织

```ts
@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
```
- `imports` 引入其他模块；`exports` 让本模块 Provider 可被别模块注入。良好的模块化是 Nest 项目可维护的关键。

---

## 7. 生命周期钩子

- `OnModuleInit`（模块初始化后）、`OnApplicationShutdown`（优雅关闭）、`BeforeApplicationShutdown`。
```ts
@Injectable() export class AppService implements OnModuleInit {
  onModuleInit() { console.log('init') }
}
```

---

## 8. 启动

```ts
// main.ts
const app = await NestFactory.create(AppModule)
await app.listen(3000)
```
- CLI：`nest new project`、`nest g resource users`（自动生成 CRUD 骨架）。

---

## 9. 下一步

- 进阶能力看 [NestJS 高级](nestjs-advanced.md)：管道、守卫、拦截器、异常、中间件。
- 底层机制对照 [Node.js 基础](nodejs-basic.md)。
