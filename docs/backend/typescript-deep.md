# 🔷 TypeScript 深度专题（Nest 必会）

> NestJS 强依赖 TypeScript，装饰器、依赖注入、类型安全都建立在 TS 上。本篇讲后端工程师用 TS 必须深入的点：装饰器原理、`tsconfig` 关键项、泛型、类型体操、与 DI/运行时的关系。补全 [NestJS 基础/高级](nestjs-basic.md) 里"为什么这么写"的底层。
>
> 依据 **[TypeScript 官方手册](https://www.typescriptlang.org/docs/handbook/)**、**[NestJS·TypeScript 配置](https://docs.nestjs.com/techniques/)**。

---

## 一、装饰器（Decorator）：Nest 的语法基石

**本质**：装饰器是函数，能在**编译期**给类/方法/参数附加元数据，Nest 运行时读取这些元数据做路由映射、DI 等。

```ts
// 方法装饰器签名
function Get(path: string) {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('path', path, target, key) // 存元数据
  }
}
// Nest 在启动时扫描这些元数据，注册路由
```

!!! danger "装饰器坑"
    - **实验性特性**：必须 `tsconfig` 开 `experimentalDecorators: true` 和 `emitDecoratorMetadata: true`，否则 Nest 读不到类型元数据（DI 注入失败）。
    - **装饰器在定义时执行，不在调用时**：别在装饰器里写依赖请求上下文的逻辑。
    - **只能用于类/方法/属性/参数**，不能装饰普通函数内的局部变量。

---

## 二、tsconfig 关键项（后端必配）

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",          // Node 传统；用 ESM 则 "NodeNext"
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,  // Nest DI 靠它推断注入类型
    "strict": true,                  // 严格模式：noImplicitAny/null 检查，强烈建议开
    "strictNullChecks": true,        // 防 null/undefined 漏判
    "outDir": "dist",
    "sourceMap": true                // 生产排错映射
  }
}
```

!!! warning "strict 模式"
    - **必须开 `strict:true`**：后端最怕 `undefined` 偷偷流过导致运行时崩溃。`strictNullChecks` 让 `string | null` 显式处理。
    - `emitDecoratorMetadata` 不开 → `@Injectable()` 的构造函数参数类型信息丢失，Nest DI 无法解析（报 `Nest can't resolve dependencies`）。

---

## 三、泛型：写出可复用的 Service/响应

```ts
// 通用分页返回
interface Paged<T> { items: T[]; total: number; page: number }
async findAll<T>(repo: Repository<T>, page: number): Promise<Paged<T>> { ... }

// 通用 CRUD Service（Nest 常见基类）
abstract class CrudService<T> {
  constructor(protected repo: Repository<T>) {}
  async create(dto: DeepPartial<T>) { return this.repo.save(dto) }
}
```

!!! tip "泛型用法"
    - 通用 Service/Repository/响应包装用泛型，避免为每种实体重复写 CRUD。
    - DTO 用泛型约束入参出参形状，如 `ResponseDto<User>`。

---

## 四、类型体操（实用，不炫技）

后端常用但不必过度：

```ts
// 工具类型
type PublicUser = Omit<User, 'passwordHash'>     // 出参剔除敏感字段
type CreateInput = Pick<User, 'email' | 'name'>  // 入参只取部分
type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> }  // 部分更新

// 联合 + 收窄
type Role = 'admin' | 'user' | 'guest'
function canEdit(role: Role) { return role === 'admin' || role === 'user' }
```

!!! warning "类型体操的度"
    - 目标是**编译期防错 + 文档化接口**，不是炫技。太复杂的类型维护成本高、报错难懂。
    - 运行时没有类型：TS 编译后类型被擦除，`instanceof`/`typeof` 才在运行时有效。校验必须靠 `class-validator`（运行时，见 [NestJS 高级](nestjs-advanced.md)）。

---

## 五、TS 与运行时（关键认知）

| 阶段 | 有类型吗 | 用途 |
|------|----------|------|
| 编译期 | ✅ | 类型检查、IDE 提示、防止低级错误 |
| 运行期 | ❌（擦除） | 实际执行，类型不存在 |

- **DI 靠反射元数据**：`emitDecoratorMetadata` 把参数类型写进元数据，Nest 运行时据此注入——这是"类型在运行期间接生效"的唯一例外。
- **校验必须用运行时方案**：前后端契约（`class-validator`）在运行时校验，类型只在编译期。

!!! danger "TS 安全误区"
    - 以为"TS 校验过就安全"：编译期类型不代表运行时数据合法。外部输入（HTTP body）永远是 `any`，必须运行时校验。
    - `as` 断言滥用：用 `as` 绕过类型检查会埋雷，优先用类型守卫（`is` 谓词）或真正校验。

---

## 六、TypeScript 自查清单

- [ ] `tsconfig` 开 `strict` + `experimentalDecorators` + `emitDecoratorMetadata`
- [ ] 装饰器只用于类/方法/属性/参数
- [ ] 泛型用于通用 Service/响应，避免重复 CRUD
- [ ] 敏感字段用 `Omit` 剔除出参
- [ ] 外部输入（DTO）用 `class-validator` 运行时校验，不只靠 TS 类型
- [ ] 不用 `as` 绕过关键类型检查

配合：[NestJS 基础](nestjs-basic.md)、[NestJS 高级](nestjs-advanced.md)、[实战博客 API](project-blog-api.md)。
