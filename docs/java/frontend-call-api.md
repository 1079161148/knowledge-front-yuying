# 🌐 前端怎么调接口（0 基础超详细 · 前后端协作第一课）

> 这是给 **Java 后端新手**补的"全栈视角"第 0 章：你写了 Spring Boot 接口，前端（网页/小程序/App）怎么调到它？
> 目标：搞懂 HTTP 是什么、URL/GET/POST 是什么、用浏览器/Postman/fetch/Axios 调你写的接口、理解 JSON 和跨域(CORS)。
> 不要求前端经验，但需先会 [Spring Boot 从零开始](spring-boot-basics.md) 写出接口。
>
> 依据 **[MDN HTTP 文档](https://developer.mozilla.org/zh-CN/docs/Web/HTTP) · [Fetch API](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API)**（官方权威）。

> 📌 **适用版本 / 更新日期**：通用 Web 标准；最后更新 **2026-08**。

!!! abstract "读完你能做什么"
    用浏览器地址栏调 GET 接口 → 用 Postman 发带参数的请求 → 用前端 JS（fetch / Axios）调你的接口并拿到 JSON → 理解为什么本地会报 CORS 跨域错误及怎么解决。你就打通了"后端接口 → 前端消费"的任督二脉。

---

## 1. 前后端怎么协作（大白话）

- **后端（你写的 Spring Boot）**：提供"接口（API）" = 一组网址，接收请求、返回数据（通常是 JSON）。
- **前端（网页/App）**：在用户浏览器里运行，负责展示界面；需要数据时，**发 HTTP 请求**到后端接口，拿到 JSON 再渲染成页面。
- 二者通过 **HTTP 协议** 用 **URL** 说话。你不用懂前端框架，只要知道"它们怎么调我的接口"。

!!! tip "一个生活比喻"
    - 后端 = 厨房，接口 = 点餐窗口，前端 = 服务员/顾客。
    - 顾客（前端）在窗口（URL）说"来份炒饭（GET /food/1）"，厨房（后端）做好通过窗口递出（返回 JSON）。

---

## 2. HTTP 与 URL 速懂

```
https://api.example.com/users/1?role=admin
\__/  \_____________/ \______/ \________/
 协议      域名        路径     查询参数
```

- **HTTP 方法（动作）**：
  - `GET`：取数据（查）。参数在 URL（`?a=1`）。
  - `POST`：提交数据（增）。参数在**请求体**（body），不在 URL。
  - `PUT/PATCH`：改（全改/部分改）。`DELETE`：删。
- **状态码**：`200` 成功、`400` 参数错、`401` 未登录、`404` 找不到、`500` 后端崩。

!!! tip "RESTful 约定（行业习惯）"
    - `GET /users` 查列表、`GET /users/1` 查一个、`POST /users` 新增、`PUT /users/1` 改、`DELETE /users/1` 删。你的 Spring Boot 接口按这个约定写，前端一看就懂。

---

## 3. 方法一：浏览器地址栏（最快验证 GET）

你写了 `GET /hello?name=张三`（见 [Spring Boot 从零开始](spring-boot-basics.md)）。
直接浏览器打开：

```
http://localhost:8080/hello?name=张三
```

页面显示 `你好, 张三!` —— 这就是一次成功的"前端调接口"（浏览器就是最简单的"前端"）。

!!! warning "地址栏只能发 GET"
    - 浏览器地址栏只能发 `GET`。要测 `POST`/传 JSON body，得用 Postman 或前端代码。

---

## 4. 方法二：Postman（后端自测神器）

[Postman](https://www.postman.com/downloads/) 是图形化接口测试工具，后端人手一个。

1. 新建 **Request**，方法选 `GET`，URL 填 `http://localhost:8080/hello?name=李四`。
2. 点 **Send** → 下方 Body 看到返回 `你好, 李四!`。
3. 测 `POST`：方法改 `POST`，切到 **Body → raw → JSON**，填 `{"name":"王五"}`，Send 看结果。

!!! tip "为什么后端也要会用 Postman"
    - 前端还没写好时，你用它**自己验证接口对不对**，不依赖别人。
    - 能模拟各种参数/状态码，提前发现问题。

---

## 5. 方法三：前端 JS 调接口（fetch / Axios）

### 5.1 原生 fetch（浏览器内置，无需装包）

```javascript
// 前端代码（跑在浏览器里）
// GET 示例
fetch('http://localhost:8080/hello?name=张三')
  .then(res => res.text())          // 把响应体读成文本
  .then(data => console.log(data)); // "你好, 张三!"

// POST 示例（提交 JSON）
fetch('http://localhost:8080/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: '张三', age: 20 })
})
  .then(res => res.json())          // 读成 JSON 对象
  .then(user => console.log(user));
```

### 5.2 Axios（更友好，前端常用）

```javascript
// 先装：npm install axios
import axios from 'axios';

// GET
const r1 = await axios.get('http://localhost:8080/hello', { params: { name: '张三' } });
console.log(r1.data);

// POST
const r2 = await axios.post('http://localhost:8080/users', { name: '张三', age: 20 });
console.log(r2.data);
```

!!! tip "后端要配合的事"
    - 前端 `POST` 发 JSON，你的接口要用 `@RequestBody` 接收：
      ```java
      @PostMapping("/users")
      public User create(@RequestBody User user) {  // 自动把 JSON 转成 User 对象
          return service.save(user);
      }
      ```
    - 返回对象 Spring Boot 自动转成 JSON（靠 Jackson），前端 `res.json()` 直接拿到。

---

## 6. JSON：前后端的数据语言

- **JSON** 是一种轻量数据格式，前后端都用它传数据：`{"id":1,"name":"张三","age":20}`。
- Java 对象 ↔ JSON 由 **Jackson**（Spring Boot 内置）自动转换：
  - 后端返回 `User` 对象 → 自动变 JSON。
  - 前端发 JSON body → 自动变 `User` 对象（`@RequestBody`）。

!!! warning "Java 字段名 vs JSON"
    - 默认按属性名。想改 JSON 字段名用 `@JsonProperty("user_name")`。
    - 日期默认序列化可能带 `T` 和时区 → 配 `spring.jackson.date-format` 与 `time-zone`，或字段加 `@JsonFormat(pattern="yyyy-MM-dd HH:mm:ss")`。

---

## 7. CORS 跨域（本地联调必踩的坑）

### 7.1 现象

前端跑在 `http://localhost:3000`，后端在 `http://localhost:8080`——**端口不同 = 跨域**。浏览器控制台报：

```
Access to fetch at 'http://localhost:8080/...' from origin 'http://localhost:3000'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header
```

### 7.2 为什么

浏览器出于安全，**默认禁止网页向"不同源"（协议/域名/端口任一不同）发请求**，除非后端明确允许（返回 CORS 头）。

### 7.3 解决（后端加允许）

```java
// 方式一：单个接口/类加注解（开发临时用）
@CrossOrigin(origins = "http://localhost:3000")
@RestController
public class UserController { }

// 方式二：全局配置（推荐，统一放开）
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer cors() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry reg) {
                reg.addMapping("/**")
                   .allowedOriginPatterns("*")   // 生产写具体前端域名，别用 *
                   .allowedMethods("GET","POST","PUT","DELETE")
                   .allowCredentials(true);
            }
        };
    }
}
```

!!! danger "CORS 安全提醒"
    - 生产环境 `allowedOriginPatterns` **别用 `*` + allowCredentials**，会被任意网站调你的接口。
    - 写具体前端域名（如 `https://www.yoursite.com`）。跨域也可由 **Nginx 反向代理**统一域名解决（更常见）。

---

## 8. 最佳实践（新手照做）

!!! tip "前后端协作共识"
    - **接口先定契约**：前后端先约定 URL、方法、请求/响应 JSON 字段，再各自开发（可用 OpenAPI/Swagger 文档，见 [工具链](java-toolchain.md)）。
    - **统一返回格式**：封装 `Result<T>`（`code/message/data`），前端好处理：
      ```java
      public record Result<T>(int code, String message, T data) {
          public static <T> Result<T> ok(T data) { return new Result<>(0, "ok", data); }
      }
      ```
    - **用 Postman 自测**每个接口再交给前端。
    - **错误用 HTTP 状态码 + 业务 code** 双重表达。

!!! danger "新手三大坑"
    - **POST 收不到参数**：前端没设 `Content-Type: application/json`，或后端忘了 `@RequestBody`。
    - **CORS 报错**：本地端口不同，按 7.3 加跨域配置。
    - **JSON 日期乱/字段不对**：Jackson 配置 + `@JsonFormat`/`@JsonProperty` 对齐。

---

## 9. 自测（你学会了吗）

1. 浏览器地址栏访问你的 `GET /hello?name=测试`。
2. 用 Postman 发 `POST /users` 提交一个 JSON 用户，后端用 `@RequestBody` 接收。
3. 写一段前端 `fetch` 调你的接口，打印返回。
4. 把前端跑在 3000、后端 8080，复现并解决 CORS 报错。
5. 封装 `Result<T>` 统一返回格式。

> 打通前后端，你就具备"全栈"雏形。下一步去 [Spring Boot](spring-boot.md) 学异常处理/统一返回/认证；前端深入可看本仓库前端基础章节。

---

## 10. 下一步

- 统一返回/异常处理/认证 → [Spring Boot](spring-boot.md)
- 接口文档 Swagger/OpenAPI → [Java 常用插件与工具链](java-toolchain.md)
- 连数据库写接口 → [JDBC 与 MyBatis](jdbc-mybatis.md)
- 前端框架（Vue/React）怎么组织 → 见本仓库前端基础篇
