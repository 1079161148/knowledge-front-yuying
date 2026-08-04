# 📖 Java / Spring Boot / Spring AI 专业术语（速查）

> 在读 [Java 学习路线](index.md) 之前，先把三大块的核心专业术语对齐清楚。所有解释以**官方文档与规范**为准：
>
> | 来源 | 说明 | 地址 |
> |------|------|------|
> | **Oracle Java SE / JLS** | Java 语言规范与标准 API | `docs.oracle.com/en/java/` |
> | **OpenJDK** | JVM 开源实现（HotSpot / 源码） | `openjdk.org` |
> | **Spring 官方文档** | Spring Boot / Framework / Security / Data 权威参考 | `docs.spring.io` |
> | **Spring AI 官方文档** | 1.0 GA 起独立的 AI 抽象层 | `docs.spring.io/spring-ai` |
> | **MyBatis 官方** | 持久层框架 | `mybatis.org` |
> | **JUnit 5 / Mockito** | 测试框架 | `junit.org` / `site.mockito.org` |
>
> 阅读建议：先通读本篇再进各章；遇到不懂的词回本篇查，每个术语标注了"来自哪"和"为什么重要"。

---

## 一、Java 语言与 JVM 术语

### 1. JDK / JRE / JVM
| 概念 | 定义 | 关系 |
|------|------|------|
| **JVM（Java 虚拟机）** | 执行字节码（`.class`）的运行时引擎，负责内存管理与 GC | 最底层 |
| **JRE（Java 运行环境）** | JVM + 核心类库，能跑程序但不能编译 | 含 JVM |
| **JDK（Java 开发工具包）** | JRE + 编译器 `javac` + 工具（`jstack`/`jmap`） | 含 JRE |

!!! tip "实战意义"
    开发机装 **JDK**；生产容器只需 **JRE**（或 `jlink` 裁剪的运行时）。LTS 版本：8 / 11 / 17 / 21。

### 2. 字节码（Bytecode）与 .class
- 定义：Java 源码编译后生成的中立指令集（`.class`），由 JVM 解释或 JIT 编译为机器码。来自 **JVM 规范**。
- 为什么重要：一次编写、到处运行（Write Once, Run Anywhere）靠的就是字节码与 JVM 解耦。

### 3. 自动装箱 / 拆箱（Autoboxing / Unboxing）
- 定义：基本类型（`int`）与包装类（`Integer`）间的自动转换。来自 **JLS**。
- 坑：`Integer` 缓存 `-128~127`，超出区间 `==` 比较为 `false`；频繁装箱有性能开销（见 [集合框架深入](java-collections-deep.md)）。

### 4. 泛型与类型擦除（Type Erasure）
- 定义：编译期泛型检查，运行时擦除为 `Object`（无真泛型）。来自 **JLS / Java 泛型规范**。
- 坑：不能 `new T[]`、不能用 `instanceof T`、数组与泛型不协变。

### 5. 注解（Annotation）
- 定义：附加在代码上的元数据，本身不影响逻辑，由编译器/框架在编译期或运行期读取。来自 **JLS**。
- 分类：`@Override`（编译检查）、`@Deprecated`（弃用）、`@Retention`（保留策略）、`@Target`（作用目标）。Spring 大量用注解驱动（`@Controller`/`@Service`/`@Transactional`）。

### 6. 反射（Reflection）
- 定义：运行时动态获取类信息、调用方法、访问字段。来自 **`java.lang.reflect`**。
- 实战：框架（Spring/IoC、Jackson 序列化）底层基石；性能低于直接调用，且破坏封装。

### 7. 函数式接口 / Lambda / Stream
- 定义：仅一个抽象方法的接口（`@FunctionalInterface`）可用 Lambda 表示；`Stream` 是声明式集合处理管道。来自 **JLS 8+**。
- 实战：替代匿名内部类，配合 `map`/`filter`/`collect` 写更简洁的数据处理（见 [Java 语言核心](java-basics.md)）。

### 8. 不可变对象（Immutability）与 record
- 定义：创建后状态不可变（字段 `final`、无 setter）。`record` 是 Java 16+ 提供的不可变数据载体。来自 **JLS**。
- 实战：线程安全、可作 Map 的 key、DTO 首选。

### 9. 堆 / 栈 / GC（垃圾回收）
- 定义：**堆** 存对象实例（线程共享），**栈** 存方法帧/局部变量（线程私有）；GC 自动回收不可达对象。来自 **JVM 规范**。
- 实战：理解 `OutOfMemoryError`、调优 `-Xmx`、选 G1/ZGC（见 [JVM](jvm.md)）。

### 10. 类加载器（ClassLoader）与双亲委派
- 定义：把 `.class` 加载进 JVM；双亲委派先委派父加载器，避免重复加载/核心类被篡改。来自 **JVM 规范**。
- 实战：Tomcat/Spring Boot 的隔离加载、热部署都基于此。

### 11. 线程 / 锁 / 线程池（见 [并发编程基础](java-concurrency.md)）
| 术语 | 定义 |
|------|------|
| **线程 (Thread)** | 轻量级执行单元，共享堆 |
| **synchronized / Lock** | 互斥临界区；`Lock` 更灵活（可中断/超时） |
| **线程池 (ThreadPoolExecutor)** | 复用线程、控制并发数，避免频繁创建销毁 |
| **CAS / AQS** | 无锁原子操作 / 同步器框架（锁与并发工具基类） |
| **CompletableFuture** | 异步编排，替代回调地狱 |

### 12. 异常体系（Exception Hierarchy）
- `Throwable` → `Error`（不应捕获）/ `Exception` → `RuntimeException`（非受检）/ 受检异常。
- 实战：`RuntimeException` 不需 `throws`；Spring 用统一异常处理器接住（见 [实战篇 §8](spring-boot-project.md)）。

---

## 二、Spring Boot / Spring 框架术语

### 13. IoC / DI（控制反转 / 依赖注入）
- 定义：**IoC** 把对象创建与依赖装配交给容器；**DI** 是 IoC 的实现方式（构造器/Setter/字段注入）。来自 **Spring Framework 官方**。
- 实战：类只声明依赖，运行时由 Spring 注入，解耦可测（见 [Spring 全家桶](spring-family.md)）。

### 14. Bean / ApplicationContext / 容器
- **Bean**：被 Spring 管理的对象（默认单例）。
- **ApplicationContext**：IoC 容器，负责加载配置、实例化、装配 Bean。
- 避坑：包扫描必须在启动类同包/子包（[新手坑](spring-boot-basics.md)）。

### 15. @Component / @Service / @Repository / @Controller
- 定义： stereotype 注解，标记不同层次的 Bean。
- 实战：`@Repository` 额外做持久层异常转译；`@Controller`/`@RestController` 接收 HTTP。

### 16. @Configuration / @Bean
- 定义：Java 配置类里用 `@Bean` 显式声明第三方对象（如 `RestTemplate`、数据源）。

### 17. AOP（面向切面编程）
- 定义：把横切关注点（日志/事务/鉴权）从业务代码剥离，用代理在切点织入。来自 **Spring AOP**。
- 术语：**切面 (Aspect)** / **切点 (Pointcut)** / **通知 (Advice: @Before/@After/@Around)**。

### 18. 自动配置（Auto-configuration）
- 定义：Spring Boot 按 classpath 存在的 Starter 自动装配 Bean（如检测到 `spring-boot-starter-data-jpa` 就配 `DataSource`）。核心注解 `@EnableAutoConfiguration`，结合 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` 与 `@Conditional*` 条件注解。
- 实战：见 [Spring Boot 自动配置原理](spring-boot.md)。

### 19. Starter
- 定义：一组"约定好依赖 + 自动配置"的 Maven 起步包（如 `spring-boot-starter-web`）。让依赖管理从"拼装"变"勾选"。

### 20. 约定优于配置（Convention over Configuration）
- 定义：Spring Boot 提供默认值（端口 8080、配置文件 `application.yml`、主类扫描），少写配置即可跑。

### 21. Spring MVC 核心
| 术语 | 定义 |
|------|------|
| **DispatcherServlet** | 前端控制器，统一分发请求 |
| **@RequestMapping / @GetMapping** | 映射 URL 到方法 |
| **@PathVariable / @RequestParam** | 取路径/查询参数 |
| **@RequestBody / @ResponseBody** | 请求体反序列化 / 响应序列化（默认 JSON） |
| **@ControllerAdvice / @RestControllerAdvice** | 全局异常处理 / 响应增强 |

### 22. 统一返回 / 全局异常 / 参数校验（工程规范三件套）
- **统一返回 `Result<T>`**：所有接口返回 `{code,message,data}` 结构，前端稳定解析。
- **全局异常 `@RestControllerAdvice`**：集中捕获异常转 `Result`，业务异常返回 400 而非 500。
- **参数校验 `@Valid` + `@NotBlank/@NotNull`**：入参自动校验，失败抛 `MethodArgumentNotValidException`。
- 实战：三者集中在 [实战篇 §7-9](spring-boot-project.md)。

### 23. 事务（@Transactional）
- 定义：一组操作要么全成要么全败。来自 **Spring 事务抽象**。
- 关键：**事务传播行为**（REQUIRED/REQUIRES_NEW…）、`rollbackFor`、自调用失效（见 [Spring 全家桶·事务](spring-family.md)）。

### 24. MyBatis 术语
| 术语 | 定义 |
|------|------|
| **SqlSession / Mapper** | MyBatis 会话 / 映射接口（注解或 XML 写 SQL） |
| **#{} vs ${}** | `#{}` 预编译防注入；`${}` 字符串拼接（危险） |
| **resultMap** | 结果集到对象的映射（处理列名→字段名） |
| **动态 SQL** | `<if>/<foreach>` 等按条件拼 SQL |

### 25. Actuator
- 定义：生产就绪端点（`/health`、`/metrics`、`/info`）。来自 **Spring Boot Actuator**。
- 坑：别全暴露（`exposure.include: *`），按需开（[配置踩坑](spring-boot.md)）。

### 26. 起步依赖与版本管理（BOM）
- 定义：`spring-boot-dependencies` BOM 统一锁所有 Starter 版本，避免冲突。

---

## 三、Spring AI 术语（1.0 GA）

### 27. ChatClient
- 定义：Spring AI 1.0 起的**统一对话入口**，屏蔽不同模型厂商差异。来自 **Spring AI 官方**。
- 用法：`chatClient.prompt().user(msg).call().content()` 拿文本，或 `.entity(Class)` 拿对象，`.stream().content()` 拿流式 `Flux<String>`。
- 实战：[Spring AI 篇 §2](spring-ai.md)。

### 28. ChatModel / ChatOptions
- 定义：`ChatModel` 是低层模型适配器（OpenAI/通义/Ollama 各有实现）；`ChatOptions` 控制 `model`/`temperature`/`maxTokens`/`timeout`。

### 29. Prompt / Message / Role
- **Prompt**：一次请求（可含多轮 Message）。
- **Message**：`System`（系统指令）/ `User`（用户）/ `Assistant`（模型）三种角色，对应对话上下文。

### 30. 结构化输出（Structured Output / OutputConverter）
- 定义：把模型自由文本转成强类型 Java 对象。核心类 `BeanOutputConverter` / `StructuredOutputConverter`（你提到的 `StructuredOutputConverter` 即此体系的顶层接口）。
- 实战：让它按 JSON Schema 输出，反序列化为 `ArticleSummary`（[Spring AI 篇 §3](spring-ai.md)）。

### 31. Embedding（嵌入）与 Vector（向量）
- 定义：`EmbeddingModel` 把文本映射为高维向量；语义相近的文本向量距离近。来自 **Spring AI Embeddings API**。
- 实战：RAG 检索、相似度匹配的底层。

### 32. VectorStore（向量库）
- 定义：存储向量并提供相似度检索的存储。Spring AI 抽象了 PG / Redis / Milvus / Chroma 等多种实现。来自 **Spring AI VectorStore API**。
- 实战：可复用你已学的 **Redis / MySQL**（[Spring AI 篇 §4](spring-ai.md)）。

### 33. RAG（检索增强生成，Retrieval-Augmented Generation）
- 定义：用户提问 → 向量检索相关资料 → 拼进 Prompt → 模型基于"你的资料"作答，缓解幻觉。来自 **Spring AI RAG 抽象（QuestionAnswerAdvisor / VectorStore）**。
- 流程：文档切块 → `Embedding` 入库 → `similaritySearch` → 拼上下文 → 调 `ChatClient`。

### 34. Advisor（顾问）
- 定义：Spring AI 的请求/响应拦截链，用于日志、重试、限流、敏感词脱敏、RAG 检索（如 `QuestionAnswerAdvisor`）。类似 Servlet Filter / AOP 的 AI 版。

### 35. 流式响应（Streaming）
- 定义：模型逐 token 返回，接口返回 `Flux<String>`（Reactive）。需 `spring-boot-starter-webflux`。来自 **Spring AI Streaming API**。

### 36. Token / 计量
- 定义：模型按 **Token**（词片段）计费与限长。需估算字数、限制 `maxTokens`、缓存高频结果控成本。

### 37. 模型降级 / 兜底
- 定义：主模型超时/限流时切换到备用模型或返回兜底文案，保证可用性（结合 [高并发](high-concurrency.md) 的限流思路）。

### 38. 多模态（Multimodal）
- 定义：同时处理文本 + 图片等输入（如 `UserMessage` 带 `Media`）。Spring AI 1.0 起多模型支持逐步完善。

---

## 四、速查总表（一张表记住核心词）

| 领域 | 术语 | 一句话 | 来源 |
|------|------|--------|------|
| Java | JDK/JRE/JVM | 开发包/运行环境/虚拟机 | Oracle |
| Java | 字节码 | `.class` 中立指令，JVM 执行 | JVM 规范 |
| Java | 类型擦除 | 泛型运行时擦为 Object | JLS |
| Java | 反射 | 运行时读类/调方法 | `java.lang.reflect` |
| Java | record | 不可变数据载体 | JLS 16+ |
| Java | GC | 自动回收不可达对象 | JVM 规范 |
| Java | 双亲委派 | 类加载先委派父，防篡改 | JVM 规范 |
| Spring | IoC/DI | 容器管对象与依赖 | Spring Framework |
| Spring | Bean | 被 Spring 管理的对象 | Spring Framework |
| Spring | 自动配置 | 按 classpath 装配 Bean | Spring Boot |
| Spring | Starter | 约定依赖+配置包 | Spring Boot |
| Spring | AOP | 横切关注点织入 | Spring AOP |
| Spring | @Transactional | 声明式事务 | Spring TX |
| Spring | Actuator | 生产端点 /health | Spring Boot |
| Boot | Result<T> | 统一返回结构 | 工程约定 |
| Boot | @Valid | 入参校验 | JSR-380 |
| MyBatis | #{} vs ${} | 预编译 vs 拼接(危险) | MyBatis |
| AI | ChatClient | 统一对话入口 | Spring AI |
| AI | Embedding | 文本→向量 | Spring AI |
| AI | VectorStore | 向量检索存储 | Spring AI |
| AI | RAG | 检索增强生成 | Spring AI |
| AI | Advisor | 请求/响应拦截链 | Spring AI |
| AI | BeanOutputConverter | LLM 输出→Java 对象 | Spring AI |
| AI | Token | 计费/限长单位 | 模型厂商 |

---

!!! tip "如何使用本篇"
    1. 看不懂某章词（如 AOP、自动配置、RAG、VectorStore）→ 回本篇查定义与来源。
    2. 写接口先想「统一返回 / 全局异常 / @Valid」三件套。
    3. 接 AI 先想「ChatClient → Prompt → call/stream → 结构化/VectorStore/RAG」。
    4. 一切以 **Oracle / OpenJDK / Spring 官方** 为准。
