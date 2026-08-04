# 🌱 Spring 全家桶（Core / MVC / Data / Security / 事务）

> 在 [Spring Boot](spring-boot.md) 之上，理解全家桶各模块的核心机制与整合。覆盖：IoC/DI、AOP、Spring MVC、Spring Data（JPA/MyBatis）、Spring Security、声明式事务。
> 依据 **[Spring Framework Reference](https://docs.spring.io/spring-framework/reference/)** · **[Spring Security](https://docs.spring.io/spring-security/reference/)** · **[Spring Data](https://spring.io/projects/spring-data)**（官方为准）。

> 📌 **适用版本 / 更新日期**：Spring 6.x / Spring Boot 3.x（Jakarta EE 9+，`javax.*` → `jakarta.*`）；最后更新 **2026-08**。

---

## 1. IoC / DI 容器

- **IoC（控制反转）**：对象创建与依赖由容器管理，而非 `new`。
- **DI（依赖注入）**：构造器注入（推荐，不可变、易测）、字段注入（`@Autowired`，不推荐，难测/隐藏依赖）、Setter 注入。

!!! tip "为什么构造器注入优先"
    - 依赖不可变（`final`）、启动时即校验完整性、无循环依赖隐患、单元测试可直接 `new` 传入 mock。

---

## 2. AOP（面向切面）

```java
@Aspect
@Component
public class LogAspect {
    @Around("execution(* com.demo.service..*(..))")
    public Object log(ProceedingJoinPoint pjp) throws Throwable {
        long t = System.nanoTime();
        try { return pjp.proceed(); }
        finally { log.info("{} 耗时 {}ms", pjp.getSignature(), (System.nanoTime()-t)/1e6); }
    }
}
```

- **代理方式**：有接口用 JDK 动态代理，无接口用 CGLIB（Boot 默认 CGLIB，类需可被继承，即非 `final`）。
- **切点表达式**：`execution`、`@annotation`、`within` 等组合。

!!! danger "AOP 失效场景"
    - 同类方法内部调用（自调用）不走代理 → 切面不生效。
    - `private`/`final`/静态方法无法被代理增强。
    - 同一切点多个 `@Order` 决定优先级。

---

## 3. Spring MVC

```java
@RestController
@RequestMapping("/users")
public class UserController {
    @GetMapping("/{id}")
    public UserDTO get(@PathVariable Long id) { ... }
    @PostMapping
    public ResponseEntity<Void> create(@Valid @RequestBody CreateUserCMD cmd) { ... }
}
```

- 核心组件：前端控制器 `DispatcherServlet` → `HandlerMapping` → `HandlerAdapter` → 拦截器 → 视图/消息转换（`HttpMessageConverter`，Jackson）。

!!! warning "MVC 坑"
    - `@RequestBody` 必须配 `Content-Type: application/json`；缺 `@Valid` 校验不触发。
    - 路径变量未做范围/存在性校验 → 用 Hibernate Validator + 全局异常处理器统一 400。
    - 大文件上传走 `MultipartFile`，注意 `max-file-size` 限制。

---

## 4. Spring Data（JPA / MyBatis）

| 方案 | 特点 | 适用 |
|------|------|------|
| **Spring Data JPA** | 方法名派生 SQL、`Repository` 接口即 DAO，开发快 | 常规 CRUD |
| **MyBatis** | 手写 SQL/XML，可控性强 | 复杂 SQL/性能敏感 |

!!! tip "选型"
    - 简单业务 JPA 提效；复杂报表/极致性能用 MyBatis（或 JPA + Native Query）。不要混用同一实体两套 ORM 造成混乱。

---

## 5. 声明式事务（重点）

```java
@Transactional(rollbackFor = Exception.class, propagation = Propagation.REQUIRED)
public void transfer(Long from, Long to, BigDecimal amt) { ... }
```

| 传播行为 | 含义 |
|----------|------|
| `REQUIRED`（默认） | 有则加入，无则新建 |
| `REQUIRES_NEW` | 挂起当前，新建独立事务 |
| `NESTED` | 嵌套保存点，可部分回滚 |
| `SUPPORTS` / `NOT_SUPPORTED` | 支持/不支持事务 |

!!! danger "事务致命坑（与 Boot 篇呼应）"
    - **自调用失效**：同类内 `this.method()` 带 `@Transactional` 不生效（绕过代理）。用注入自身代理或拆 Service。
    - 默认只对 **RuntimeException/Error** 回滚；受检异常不回滚 → 显式 `rollbackFor`。
    - 事务方法内吞异常（catch 不抛出）→ 不回滚。
    - 事务边界内做远程调用/长耗时 → 锁/连接占用过久。
    - MySQL 默认 RR + 行锁，但 `UPDATE` 不走索引会锁全表。

---

## 6. Spring Security

```java
@Configuration
@EnableWebSecurity
public class SecConfig {
    @Bean
    SecurityFilterChain chain(HttpSecurity http) throws Exception {
        http
          .csrf(csrf -> csrf.ignoreRequestMatchers("/api/**")) // 无状态 API 关 CSRF
          .authorizeHttpRequests(a -> a
              .requestMatchers("/admin/**").hasRole("ADMIN")
              .anyRequest().authenticated())
          .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults())); // JWT 资源服务器
        return http.build();
    }
}
```

!!! warning "Security 要点"
    - 密码必须 `PasswordEncoder`（BCrypt）存储，**明文是事故**。
    - 无状态 API 用 JWT/Bearer，关掉 Session/`csrf`；有 Session 才开 CSRF。
    - 权限注解 `@PreAuthorize` 需 `@EnableMethodSecurity` 才生效。
    - 放行路径要谨慎，避免误开 `/**` 导致鉴权形同虚设。

---

## 7. 整合踩坑汇总

!!! danger "全家桶整合坑"
    - Boot 3.x 用 `jakarta.*`，老代码 `javax.*` 编译报错 → 需 Jakarta 迁移工具。
    - JPA 懒加载 `LazyInitializationException`：事务外访问未加载关联 → 用 DTO 投影或 `@EntityGraph`。
    - Security + 全局异常处理：认证异常返回 401 而非 500，自定义 `AuthenticationEntryPoint`。
    - AOP + 事务顺序：`@Transactional` 本身也是 AOP，多个切面顺序用 `@Order` 控制（事务通常内层）。

> 下一章：[微服务全家桶](microservices.md)
