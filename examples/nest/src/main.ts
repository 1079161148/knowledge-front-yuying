import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor, AllExceptionsFilter } from './response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局请求层：统一成功响应结构 + 统一错误结构
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // 注意：限流 ThrottlerGuard 在 AppModule 用 APP_GUARD 注册，
  // 这里不能写 app.useGlobalGuards(new ThrottlerGuard())——
  // 它需要容器注入 options/storage/reflector，手动 new 会在首个请求时崩。

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`订单服务已启动: http://localhost:${port}`);
}
bootstrap();
