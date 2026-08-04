# Java Spring Boot 后端部署指南

> 面向：Java Spring Boot 后端 API 服务——Maven/Gradle + MySQL/PostgreSQL + Redis，部署到 VPS、Docker、K8s。

---

## 一、部署前准备

### 1.1 构建可执行 JAR

```bash
# Maven
mvn clean package -DskipTests    # 产物：target/*.jar

# Gradle
./gradlew clean build -x test
```

### 1.2 验证 JAR 可运行

```bash
java -jar target/my-app-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

### 1.3 激活生产配置

`src/main/resources/application-prod.yml`：

```yaml
server:
  port: 8080

spring:
  datasource:
    url: ${DB_URL:jdbc:mysql://localhost:3306/mydb}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      idle-timeout: 300000
      connection-timeout: 20000

  jpa:
    hibernate:
      ddl-auto: none          # 生产不用 auto-create
    show-sql: false

  redis:
    host: ${REDIS_HOST:localhost}
    port: ${REDIS_PORT:6379}
    password: ${REDIS_PASSWORD:}

logging:
  level:
    root: INFO
    org.springframework: WARN
```

!!! danger "生产环境不要 `ddl-auto: create/update`"
    设为 `none` 或 `validate`。用 Flyway / Liquibase 管理数据库迁移。

---

## 二、方式 1：VPS + Systemd（最经典）

### 2.1 安装 JDK

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-17-jdk -y
java -version
```

### 2.2 上传 JAR

```bash
sudo mkdir -p /opt/my-app
# 从本地上传
scp target/my-app-0.0.1-SNAPSHOT.jar root@服务器IP:/opt/my-app/
```

### 2.3 Systemd 服务配置

创建 `/etc/systemd/system/my-app.service`：

```ini
[Unit]
Description=My Spring Boot Application
After=network.target

[Service]
Type=simple
User=app
WorkingDirectory=/opt/my-app
ExecStart=/usr/bin/java -jar /opt/my-app/my-app-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod

# JVM 调优（2G 内存示例）
Environment="JAVA_OPTS=-Xms512m -Xmx512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"

# 重启策略
Restart=always
RestartSec=10

# 日志
StandardOutput=journal
StandardError=journal
SyslogIdentifier=my-app

[Install]
WantedBy=multi-user.target
```

```bash
sudo useradd -m app              # 创建专用用户
sudo systemctl daemon-reload
sudo systemctl enable my-app
sudo systemctl start my-app
sudo systemctl status my-app     # 检查状态
sudo journalctl -u my-app -f     # 查看日志
```

### 2.4 JVM 参数备忘

| 参数 | 说明 | 推荐值 |
|------|------|:-----:|
| `-Xms` | 初始堆大小 | `512m` |
| `-Xmx` | 最大堆大小 | 服务器内存的 50-70% |
| `-XX:+UseG1GC` | 使用 G1 垃圾回收器 | 默认（JDK 9+） |
| `-XX:MaxGCPauseMillis` | 最大 GC 暂停目标 | `200` |
| `-XX:+HeapDumpOnOutOfMemoryError` | OOM 时 dump 堆 | 建议开启 |
| `-XX:HeapDumpPath` | dump 存储路径 | `/opt/my-app/logs/` |

---

## 三、方式 2：Nginx 反向代理

```nginx
server {
    listen 80;
    server_name api.example.com;

    client_max_body_size 10m;

    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000" always;

    limit_req_zone $binary_remote_addr zone=java_limit:10m rate=20r/s;
    limit_req zone=java_limit burst=30 nodelay;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/my-app /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d api.example.com
```

---

## 四、方式 3：Docker 部署

### 4.1 多阶段 Dockerfile

```dockerfile
# ---------- 构建阶段 ----------
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# ---------- 运行阶段 ----------
FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 4.2 Docker Compose 全栈

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      DB_URL: jdbc:mysql://db:3306/mydb
      DB_USERNAME: ${DB_USERNAME}
      DB_PASSWORD: ${DB_PASSWORD}
      REDIS_HOST: redis
      REDIS_PASSWORD: ${REDIS_PASSWORD}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  db:
    image: mysql:8.0
    volumes:
      - mysql_data:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: mydb
      MYSQL_USER: ${DB_USERNAME}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - app

volumes:
  mysql_data:
  redis_data:
```

### 4.3 Spring Boot Actuator 健康检查

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

`application-prod.yml`：

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,metrics    # 不要暴露 env/configprops
  endpoint:
    health:
      show-details: when-authorized
```

---

## 五、数据库迁移：Flyway（推荐）

```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-mysql</artifactId>
</dependency>
```

SQL 迁移脚本放在 `src/main/resources/db/migration/`：

```
db/migration/
├── V1__init_schema.sql
├── V2__add_user_table.sql
├── V3__add_index_email.sql
```

`application-prod.yml`：

```yaml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
```

---

## 六、安全清单（Java 后端专属）

### 6.1 Spring Security 基础配置

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())    // API 通常关闭 CSRF（用 JWT）
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .headers(headers -> headers
                .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)
                .xssProtection(Customizer.withDefaults())
                .contentTypeOptions(Customizer.withDefaults())
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("https://你的前端域名.com"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

### 6.2 生产安全检查

| 检查项 | 实现 |
|--------|------|
| 关闭 `server.error.include-stacktrace` | `never`（生产） |
| actuator 不暴露敏感端点 | `include: health,metrics` |
| CSRF | API 项目可关闭（JWT），MVC 模板项目保持开启 |
| multipart 上传大小限制 | `spring.servlet.multipart.max-file-size: 10MB` |
| SQL 注入 | MyBatis 用 `#{}` 不用 `${}`；JPA 用参数查询 |
| JSON 反序列化安全 | 不在 DTO 中添加能执行代码的 setter |

---

## 七、排查：常见 Java 部署问题

| 问题 | 原因 | 解决 |
|------|------|------|
| `java: command not found` | JDK 未安装 | `apt install openjdk-17-jdk` |
| 端口占用 | 另一个进程占用了 8080 | `lsof -i :8080` 查进程，或改 `server.port` |
| OutOfMemoryError | JVM 堆太小 | 调大 `-Xmx` 或排查内存泄漏 |
| 数据库连不上 | 配置错误 / 白名单 | 检查 `application-prod.yml`，确认 MySQL 白名单 |
| JAR 找不到主类 | MANIFEST.MF 缺少 Main-Class | 用 `spring-boot-maven-plugin` |
| 慢查询拖死应用 | 索引缺失 / SQL 不优化 | 加索引、打开 slow_query_log |
| 时区不一致 | `serverTimezone=Asia/Shanghai` | JDBC URL 加时区参数 |

---

> **相关章节**
> - 前端一起部署 → [全栈组合部署方案](fullstack-combinations.md)
> - Spring Boot 本地开发环境 → [Java 开发环境搭建](../java/setup-env.md)
> - CI/CD → [持续集成/持续部署](../engineering/cicd/index.md)
