# 🛠️ Java 常用插件与工具链（Maven / Gradle / Lombok / MapStruct / Arthas / 工程效能）

> 把"能写"变成"写得快、写得对、查得快"。覆盖：构建工具、代码生成/简化注解、诊断工具、质量门禁、CI/CD。
> 依据各工具**官方文档**（Maven / Gradle / Lombok / MapStruct / Arthas / JaCoCo / JMH 等）。

> 📌 **适用版本 / 更新日期**：Maven 3.9 / Gradle 8.x / Lombok 1.18 / MapStruct 1.6 / Arthas 3.7 / Java 21；最后更新 **2026-08**。

---

## 1. 构建工具：Maven vs Gradle

| 维度 | Maven | Gradle |
|------|-------|--------|
| 配置 | `pom.xml`（XML，约定强） | `build.gradle`（Groovy/Kotlin DSL，灵活） |
| 性能 | 一般 | 增量构建/缓存，快 |
| 学习曲线 | 低 | 中 |
| 适用 | 传统企业、规范统一 | 多模块、大项目、Android |

!!! tip "Maven 常用"
    ```xml
    <dependencyManagement>  <!-- 统一版本，子模块不写 version -->
      <dependencies>
        <dependency>
          <groupId>org.springframework.boot</groupId>
          <artifactId>spring-boot-dependencies</artifactId>
          <version>3.3.0</version>
          <type>pom</type><scope>import</scope>
        </dependency>
      </dependencies>
    </dependencyManagement>
    ```
    - 用 `spring-boot-dependencies` BOM 统一管理版本，避免冲突。
    - `mvn dependency:tree` 查依赖冲突；`mvn -T 4` 并行构建。

!!! danger "依赖陷阱"
    - **依赖冲突/版本地狱**：同一库多版本 → 用 BOM/`dependencyManagement` 锁版本，`exclusions` 排除传递依赖。
    - `SNAPSHOT` 版本进生产 → 不可复现；生产用固定 release 版本 + 私有仓库（Nexus）。
    - Lombok/MapStruct 的注解处理器需在 `annotationProcessor` 作用域正确配置（尤其 Gradle）。

---

## 2. Lombok（简化样板代码）

```java
@Data                       // getter/setter/equals/hashCode/toString
@Builder                    // 建造者
@NoArgsConstructor @AllArgsConstructor
@Entity
@EqualsAndHashCode(onlyExplicitlyIncluded = true)  // 避免关联集合进 equals（见 Boot 篇坑）
public class User {
    @Id @EqualsAndHashCode.Include private Long id;
    private String name;
}
```

!!! warning "Lombok 坑"
    - `@Data` 在 JPA `@Entity` 上生成含关联集合的 `equals/hashCode` → 用 `onlyExplicitlyIncluded` 限制。
    - 团队协作需统一装 Lombok 插件，否则 IDE 报错；升级 JDK 大版本注意 Lombok 兼容性。
    - 不要过度 `@Builder` 全参构造导致字段顺序脆弱。

---

## 3. MapStruct（编译期 Bean 映射）

```java
@Mapper
public interface UserMapper {
    UserMapper INST = Mappers.getMapper(UserMapper.class);
    @Mapping(source = "userName", target = "name")   // 字段名不同显式映射
    UserDTO toDto(User user);                        // 编译期生成实现，无反射开销
}
```

!!! tip "为什么用 MapStruct"
    - 比 `BeanUtils.copyProperties`（反射、运行慢、无编译检查）强：编译期生成、类型安全、改名即报错。
    - 与 Lombok 配合需在注解处理器顺序正确（同时配 `annotationProcessor`）。

---

## 4. Arthas（线上诊断神器）

```bash
# 不重启定位问题
dashboard                 # 实时看线程/内存/GC
thread -n 3                # 最忙的 3 个线程栈
watch com.demo.UserService getUser '{params,returnObj}'  # 观测方法入参/返回值
trace com.demo.OrderService create        # 方法耗时链路
jad com.demo.UserService    # 反编译确认线上实际代码（是否发对版）
```

!!! tip "使用场景"
    - 确认"线上跑的是不是最新代码"（jad）、看慢方法（trace）、看参数（watch），免重启排错。

---

## 5. 质量与性能工具

| 工具 | 用途 |
|------|------|
| **JaCoCo** | 单测覆盖率（CI 门禁） |
| **JUnit 5** | 单元测试（含 `@MockitoBean` 整合） |
| **Checkstyle / Spotless** | 代码规范/格式化统一 |
| **PMD / SonarQube** | 静态扫描、坏味道 |
| **JMH** | 微基准测试（**别用 `System.currentTimeMillis()` 测性能**，JIT 会骗你） |

!!! danger "JMH 提示"
    - 微基准必须用 JMH，手写循环计时会被 JIT 优化/预热误导。注解 `@Benchmark` + `@State` + `@Setup`。

---

## 6. CI/CD 与工程效能

- **CI**：提交即跑 build + test + 静态扫描 + 覆盖率门禁（JaCoCo 阈值）。
- **CD**：镜像构建 + 推仓库 + K8s 滚动更新（见 [容器化](containerization.md)）。
- **Git 规范**：约定式提交（Conventional Commits）、PR 评审、分支保护。

!!! warning "工程化坑"
    - 测试覆盖率门禁设太高导致"为覆盖而写无效测试"；关注**核心逻辑**覆盖而非百分比。
    - 把密钥/敏感配置写进 CI 变量或 Secret 管理，不进仓库（呼应 Spring Boot 配置坑）。

---

## 7. 工具链速查（0-1 → 资深）

| 层级 | 必会 | 进阶 |
|------|------|------|
| 0-1 | Maven 依赖、Lombok | Gradle、BOM |
| 初中级 | MapStruct、JUnit | Checkstyle、JaCoCo |
| 高级 | Arthas 排查 | JMH 基准 |
| 资深 | CI/CD 编排 | SonarQube 治理、质量门禁 |

> 至此 Java 全栈工程能力闭环。回到 [Java 路线总览](index.md)。
