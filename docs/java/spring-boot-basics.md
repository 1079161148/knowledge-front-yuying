# 🍃 Spring Boot 从零开始（0 基础超详细 · 是什么 → 创建第一个项目 → 跑通接口）

> 这是 [Spring Boot](spring-boot.md) 的**前置第 0 章**，给**第一次写 Java Web 项目**的人。
> 目标：搞懂 Spring Boot 是什么、为什么不用它写 Web 那么痛苦、用官方脚手架创建第一个项目、写第一个接口、理解注解和配置。
> 不论你转行、在校、还是想系统学 Java 后端——从零开始，不要求框架经验（但需先会 [Java 语言核心](java-basics.md) 和装好 [JDK](setup-env.md)）。
>
> 依据 **[Spring Boot Reference (current)](https://docs.spring.io/spring-boot/docs/current/reference/html/)**（官方为准）。

> 📌 **适用版本 / 更新日期**：Spring Boot 3.2 / 3.3（基于 Spring 6、Java 17+）；最后更新 **2026-08**。注意 Boot 2.x 与 3.x 差异（Jakarta 命名空间）。

!!! abstract "读完你能做什么"
    用 start.spring.io 创建项目 → 在 IDEA 跑起来 → 写第一个 `@RestController` 接口 → 浏览器/Postman 访问到返回 → 看懂 `application.yml` 配置。之后去 [Spring Boot](spring-boot.md) 学自动配置原理、Starter、Actuator、踩坑。

---

## 1. Spring Boot 到底是什么（大白话）

- **Spring** 是 Java 最主流的**应用框架**（帮你管理对象、处理 Web 请求、连数据库等）。但原版 Spring 要写大量 XML 配置，很痛苦。
- **Spring Boot = 简化版 Spring**：核心理念**"约定优于配置"**——帮你把常用配置都配好了，开箱即用。
- 它内嵌了 **Tomcat**（Web 服务器），所以你的 Java 程序**自己就能当网站跑**，不用额外装服务器。

!!! tip "为什么 Java 后端必学 Spring Boot"
    - 国内 90%+ Java 后端岗位用 Spring Boot。
    - 它把"建项目、写接口、连数据库、做安全"都标准化了，你专注写业务。
    - 面试后端几乎必问。学会它，等于入了 Java 服务端的大门。

!!! warning "前置条件"
    - 先装好 **JDK 17+**（Spring Boot 3.x 要求 Java 17）。见 [环境搭建](setup-env.md)。
    - 先会 Java 基础语法。见 [Java 语言核心](java-basics.md)。
    - 了解一点 HTTP（网址、GET/POST 请求）更好，不懂也能跟着做。

---

## 2. 创建第一个项目（官方脚手架，最稳）

### 2.1 用 start.spring.io（官方，零配置）

1. 打开 <https://start.spring.io/>（Spring 官方脚手架）。
2. 填写：
   - **Project**：Maven（默认）
   - **Language**：Java
   - **Spring Boot**：选最新 3.2.x / 3.3.x
   - **Java**：17
   - **Group**：`com.example`；**Artifact**：`demo`
   - **Dependencies**（点 ADD DEPENDENCIES）：选 **Spring Web**（做接口用）
3. 点 **Generate** 下载 `demo.zip`，解压。

!!! tip "Dependencies 是什么"
    - 就是"功能模块"。勾 **Spring Web** 才会带上做网站需要的依赖（Tomcat、Spring MVC）。
    - 后面连数据库再勾 **Spring Data JPA** / **MyBatis** 等。按需勾，别全选。

### 2.2 用 IDEA 打开并运行

1. IDEA → `Open` → 选解压的 `demo` 文件夹（含 `pom.xml`）。
2. 等 Maven 下载依赖（首次较慢，配了[镜像](setup-env.md)会快）。
3. 找到 `DemoApplication.java`，右键 `Run 'DemoApplication'`。
4. 控制台看到 `Started DemoApplication` 和端口 `Tomcat started on port(s): 8080` → 启动成功！

!!! danger "启动常见坑"
    - **端口 8080 被占用**：改 `application.yml` 的 `server.port`（见第 5 节）。
    - **JDK 版本不对**：项目要 Java 17，但 IDEA SDK 指向 8 → 报错。统一用 17。
    - **依赖下不下来**：检查 Maven 镜像（[环境搭建篇](setup-env.md) 配阿里云镜像）。

---

## 3. 写第一个接口（@RestController）

打开 `src/main/java/com/example/demo/DemoApplication.java`，在类里加一个方法：

```java
package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController                      // 标记这是个能接收 HTTP 请求的控制器
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);  // 启动 Spring Boot
    }

    @GetMapping("/hello")           // 浏览器访问 http://localhost:8080/hello 触发
    public String hello(@RequestParam(defaultValue = "世界") String name) {
        return "你好, " + name + "!";   // 返回字符串（自动变成 HTTP 响应体）
    }
}
```

### 3.1 访问它

- 浏览器打开 <http://localhost:8080/hello> → 看到 `你好, 世界!`
- 打开 <http://localhost:8080/hello?name=张三> → 看到 `你好, 张三!`

!!! success "恭喜"
    你已经写出了第一个 **Web 接口**！别人（或前端）通过网络就能调用你 Java 程序里的逻辑。这就是后端开发的本质。

---

## 4. 注解是什么（0 基础必懂）

Spring Boot 满屏 `@XXX`，新手最容易懵。注解（Annotation）就是**贴在代码上的"标签"**，告诉 Spring "这段代码有特殊含义，请你特殊处理"。

| 注解 | 作用 | 大白话 |
|------|------|--------|
| `@SpringBootApplication` | 启动类标记 | "这是 Spring Boot 入口，按约定自动配置一切" |
| `@RestController` | 控制器 | "这个类能接收 HTTP 请求，返回数据（不是网页）" |
| `@GetMapping("/x")` | 映射 GET 请求 | "浏览器用 GET 访问 /x 就执行这个方法" |
| `@RequestParam` | 取请求参数 | "从网址 ?name=xxx 里拿到 name 的值" |
| `@PostMapping` | 映射 POST 请求 | "接收表单/JSON 提交（如新增数据）" |

!!! tip "注解不用死记"
    - 先记住 `@SpringBootApplication`（启动）、`@RestController` + `@GetMapping`（写接口）这三个就够跑起来。
    - 其他（`@PostMapping`、`@RequestBody`、`@Service` 等）在 [Spring Boot](spring-boot.md) / [Spring 全家桶](spring-family.md) 逐步学。

---

## 5. 配置文件（application.yml）

`src/main/resources/application.yml` 是项目配置中心：

```yaml
server:
  port: 8080            # 网站端口（改了就访问新端口）
spring:
  application:
    name: demo          # 应用名
  datasource:           # 连数据库（后面学，先留着看结构）
    url: jdbc:mysql://localhost:3306/demo
    username: root
    password: 123456
```

!!! tip "yml 语法注意"
    - **缩进用空格（2 格），不能用 Tab**。
    - `key: 值` 冒号后必须有**空格**。
    - 写错缩进程序启动会报 `YAMLException`，新手高频坑。

!!! warning "密码别写死进仓库"
    - 真实项目密码放环境变量或配置中心，不提交 `application.yml` 里的明文密码（用 `application.yml` + `application-dev.yml` 区分环境，密码用 `${DB_PWD}` 占位）。

---

## 6. 项目结构（第一次看别慌）

```
demo/
├─ pom.xml                     # Maven 依赖清单（管 jar 包）
├─ src/main/java/com/example/demo/
│   └─ DemoApplication.java    # 启动类（@SpringBootApplication）
├─ src/main/resources/
│   ├─ application.yml         # 配置
│   └─ static/                 # 静态资源（网页/js/css）
├─ src/test/                   # 测试代码
```

- **pom.xml**：列出项目要哪些"零件"（Spring Web、数据库驱动等），Maven 自动下载。
- 你主要改 `java/` 下的代码和 `resources/application.yml`。

---

## 7. 最佳实践（新手照做）

!!! tip "官方/社区共识"
    - **分层写代码**：别把业务逻辑全堆在 Controller。标准分层：
      - `Controller`：接收请求、返回结果（薄）。
      - `Service`：业务逻辑（厚，核心）。
      - `Repository/Dao`：操作数据库。
    - 示例：
      ```java
      @RestController
      public class UserController {
          private final UserService service;     // 注入 Service
          public UserController(UserService s) { this.service = s; }
          @GetMapping("/users/{id}")
          public User get(@PathVariable Long id) { return service.findById(id); }
      }
      @Service
      public class UserService {
          public User findById(Long id) { /* 业务逻辑 */ return new User(id); }
      }
      ```
    - **包名组织**：`controller/`、`service/`、`config/` 分目录，别全堆一起。
    - **端口冲突**：本地多个项目改不同 `server.port`。
    - **热部署**：加 `spring-boot-devtools` 依赖，改代码自动重启（开发爽）。

!!! danger "新手三大坑"
    - **扫描不到 Bean**：`@Controller`/`@Service` 类必须放在**启动类同包或子包**下，否则 Spring 扫不到（报 404）。把启动类放 `com.example.demo`，其他放 `com.example.demo.xxx`。
    - **热改没生效**：没编译（IDEA 没 `Build`），或 devtools 没开。
    - **JSON 日期乱/循环引用**：实体类用 `@JsonIgnore` 打断双向关联，日期用 `java.time`。

---

## 8. 自测（你学会了吗）

1. 用 start.spring.io 创建带 Spring Web 的项目。
2. 写 `@GetMapping("/add")` 接口，接收 `a`、`b` 两个参数返回 `a+b`。
3. 访问 `http://localhost:8080/add?a=3&b=5` 看到 `8`。
4. 把端口改成 9090 重启，验证生效。
5. 把加法逻辑抽到 `CalculatorService` 再调它（练习分层）。

> 能独立完成，0 基础入门过关。下一步去 [Spring Boot](spring-boot.md) 学自动配置原理、Starter 体系、Actuator 监控、高频踩坑；再进 [Spring 全家桶](spring-family.md) 学 IoC/AOP/事务/安全。

---

## 9. 下一步

- 自动配置原理/Starter/Actuator/踩坑 → [Spring Boot](spring-boot.md)
- IoC/AOP/事务/Data/安全 → [Spring 全家桶](spring-family.md)
- 连数据库 → [MySQL 从零开始](mysql-basics.md)
- 加缓存 → [Redis 从零开始](redis-basics.md)
