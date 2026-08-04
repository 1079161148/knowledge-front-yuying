# 🔌 JDBC 与 MyBatis 连接数据库（0 基础超详细 · 从手写 JDBC 到 MyBatis）

> 这是 [Spring 全家桶](spring-family.md) 数据访问的**前置第 0 章**，给**第一次让 Java 程序连数据库**的人。
> 目标：搞懂 JDBC 是什么、手写一遍 JDBC 体会痛点、理解 MyBatis 解决了什么、用 MyBatis 写出第一个查库接口。
> 不要求框架经验，但需先会 [Java 语言核心](java-basics.md)、装好 [JDK](setup-env.md)、建好 [MySQL](mysql-basics.md)。
>
> 依据 **[JDBC API Guide](https://docs.oracle.com/javase/tutorial/jdbc/) · [MyBatis 官方文档](https://mybatis.org/mybatis-3/zh/index.html)**（官方为准）。

> 📌 **适用版本 / 更新日期**：JDBC 4.3 / MyBatis 3.5.x；最后更新 **2026-08**。

!!! abstract "读完你能做什么"
    用 JDBC 手写一段"连 MySQL 查数据" → 体会到样板代码多、易错 → 用 MyBatis（XML / 注解两种方式）重写同一个查询 → 通过 Spring Boot 接口返回数据库数据。再去 [Spring 全家桶](spring-family.md) 学 JPA/事务/连接池。

---

## 1. 为什么需要 JDBC（大白话）

- 你的 Java 程序想读 MySQL 的数据，但 Java 不懂 MySQL 的协议。**JDBC（Java Database Connectivity）就是 Java 官方定的"通用数据库插头标准"**。
- 各家数据库（MySQL/Oracle/PostgreSQL）提供自己的 **JDBC 驱动（driver）**，实现这个标准。你写一套 JDBC 代码，换驱动就能连不同库。
- **MyBatis** 是一个**持久层框架**：在 JDBC 之上包了一层，让你不用手写大量样板代码，用 SQL + 映射就能存取对象。

!!! tip "一句话关系"
    `Java 程序 --JDBC 标准--> 数据库驱动 --> MySQL`。MyBatis 站在 JDBC 肩膀上，让你写更少的重复代码。

---

## 2. 手写 JDBC（体会痛点，新手必做一遍）

### 2.1 加 MySQL 驱动依赖（Maven）

```xml
<!-- pom.xml -->
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>   <!-- MySQL 8 驱动（注意改名 connector-j） -->
    <version>8.0.33</version>
</dependency>
```

!!! warning "MySQL 8 驱动类名变了"
    - 老：`com.mysql.jdbc.Driver`；新（8.0+）：`com.mysql.cj.jdbc.Driver`。
    - 用 `mysql-connector-j`（8.0.31+ 新 artifactId），旧 `mysql-connector-java` 已弃用。

### 2.2 手写查询（完整但啰嗦）

```java
import java.sql.*;

public class JdbcDemo {
    public static void main(String[] args) throws Exception {
        // 1. 加载驱动（JDBC 4+ 可省略，自动注册）
        Class.forName("com.mysql.cj.jdbc.Driver");
        // 2. 建立连接
        String url = "jdbc:mysql://localhost:3306/school?useUnicode=true&characterEncoding=utf8mb4";
        Connection conn = DriverManager.getConnection(url, "root", "123456");
        // 3. 创建语句
        Statement stmt = conn.createStatement();
        // 4. 执行查询
        ResultSet rs = stmt.executeQuery("SELECT id, name, age FROM student");
        // 5. 遍历结果（像遍历游标）
        while (rs.next()) {
            int id = rs.getInt("id");
            String name = rs.getString("name");
            int age = rs.getInt("age");
            System.out.println(id + " " + name + " " + age);
        }
        // 6. 关闭资源（顺序反了会警告）
        rs.close(); stmt.close(); conn.close();
    }
}
```

!!! danger "手写 JDBC 的痛点（这就是为什么用 MyBatis）"
    - **样板代码极多**：连接/语句/结果集/关闭，每次都写一遍。
    - **资源忘了关** → 连接泄露，数据库被拖垮。必须用 `try-with-resources`。
    - **字段手动映射**：`rs.getInt("id")` 一个个取，字段多时又臭又长，改表就崩。
    - **SQL 拼字符串** → 注入风险（`"WHERE name='" + name + "'"` 可被注入）。
    - **无连接池**：每次 `getConnection` 都新建，性能差。

---

## 3. MyBatis：让连库变简单

MyBatis 核心思想：**你写 SQL，它负责把参数填进去、把结果映射成 Java 对象**。两种写法：XML 映射 和 注解。

### 3.1 加依赖

```xml
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>3.0.3</version>
</dependency>
<!-- 同时需要 MySQL 驱动（见上） -->
```

### 3.2 方式一：注解版（最简单，新手先用这个）

```java
// 1) 实体类（对应 student 表）
public class Student {
    private Integer id;
    private String name;
    private Integer age;
    // getter/setter 省略（用 Lombok @Data 更爽）
}

// 2) Mapper 接口（MyBatis 会动态生成实现）
@Mapper
public interface StudentMapper {
    @Select("SELECT id, name, age FROM student WHERE id = #{id}")
    Student findById(@Param("id") Integer id);

    @Insert("INSERT INTO student(name, age) VALUES(#{name}, #{age})")
    @Options(useGeneratedKeys = true, keyProperty = "id")  // 回填自增 id
    int insert(Student s);
}

// 3) 在 Service / Controller 里直接用
@Autowired private StudentMapper mapper;
Student s = mapper.findById(1);   // 直接拿到对象，不用手写 rs 遍历！
```

!!! tip "MyBatis 帮你做了什么"
    - 自动建立/关闭连接（配合连接池）。
    - 自动把 `ResultSet` 映射成 `Student` 对象（按字段名匹配）。
    - `#{id}` 是**预编译参数**（防 SQL 注入），别用 `${}` 拼字符串（有注入风险）。

### 3.3 方式二：XML 版（复杂 SQL 更清晰）

```xml
<!-- resources/mapper/StudentMapper.xml -->
<mapper namespace="com.example.demo.StudentMapper">
    <select id="findById" resultType="com.example.demo.Student">
        SELECT id, name, age FROM student WHERE id = #{id}
    </select>
</mapper>
```

```yaml
# application.yml 告诉 MyBatis 去哪找 XML
mybatis:
  mapper-locations: classpath:mapper/*.xml
  configuration:
    map-underscore-to-camel-case: true   # 下划线转驼峰：user_name → userName
```

!!! tip "注解 vs XML 怎么选"
    - 简单 CRUD → 注解 `@Select/@Insert` 够用、直观。
    - 动态 SQL（if/foreach/复杂联表）→ XML 的 `<where>/<foreach>` 更清晰。
    - 生产常见混用。

---

## 4. 连接池（生产必懂，别用 DriverManager）

- 手写 `DriverManager.getConnection` 每次新建连接，**极慢且浪费**。
- 生产用**连接池**：提前建好一批连接复用。Spring Boot 默认集成 **HikariCP**（最快的连接池）。
- 配置（application.yml）：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/school?useUnicode=true&characterEncoding=utf8mb4&serverTimezone=Asia/Shanghai
    username: root
    password: 123456
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      maximum-pool-size: 10        # 最大连接数
      minimum-idle: 5
```

!!! danger "时区坑"
    - MySQL 8 必须加 `serverTimezone`，否则启动报时区错误。中国用 `Asia/Shanghai`。

---

## 5. 最佳实践（新手照做）

!!! tip "官方/社区共识"
    - **永远用 `#{}` 预编译参数**，杜绝 SQL 注入。
    - **Mapper 接口放启动类同包/子包**，或加 `@MapperScan("com.example.demo.mapper")` 扫描。
    - **字段映射**：表用下划线 `created_at`，Java 用驼峰 `createdAt`，开 `map-underscore-to-camel-case: true`。
    - **别在 Mapper 写业务逻辑**，业务逻辑放 Service。
    - **SQL 放 XML** 便于 DBA 审阅和动态 SQL。
    - 参数/结果对象用 **Lombok `@Data`** 省 getter/setter（见 [工具链](java-toolchain.md)）。

!!! danger "新手三大坑"
    - **`Column 'xxx' not found`**：字段名和属性名不匹配 → 开驼峰映射或写 `AS` 别名。
    - **返回 null 但库里有数据**：参数 `#{id}` 类型不对（传了 String 查 int 列）。
    - **连接泄露/超时**：忘了配连接池或 SQL 太慢占满连接 → 看 HikariCP 日志。

---

## 6. 自测（你学会了吗）

1. 手写一段 JDBC 查询 `student` 表（体会样板代码）。
2. 用 MyBatis 注解版写 `findById` 和 `insert`。
3. 写个 Controller `GET /students/{id}` 返回数据库查到的对象。
4. 故意用 `${name}` 拼 SQL 理解注入风险，再改回 `#{name}`。
5. 给数据源配 HikariCP 连接池参数。

> 完成即入门。下一步去 [Spring 全家桶](spring-family.md) 学 JPA 对比、事务 `@Transactional`、连接池调优；配合 [MySQL 到精通](mysql.md) 写高效 SQL。

---

## 7. 下一步

- JPA / 事务 / 连接池调优 → [Spring 全家桶](spring-family.md)
- SQL 优化 / 索引 / 锁 → [MySQL 到精通](mysql.md)
- 加缓存减轻数据库压力 → [Redis 从零开始](redis-basics.md)
