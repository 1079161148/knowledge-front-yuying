import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * 请求层：全局响应统一包装（每个中后台都要写一遍的基建）
 * 成功一律 { code: 0, message: 'ok', data, ts }
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // ts 必须是固定快照值，不能用 getter / 每次调用 Date.now()：
        // supertest 多次读取 res.body 时若 ts 值变化会导致响应体序列化异常，
        // 进而连接未释放、下一个用例 getHttpServer() 拿到已关闭的 listener → ECONNREFUSED
        const ts = Date.now();
        return {
          code: 0,
          message: 'ok',
          data,
          ts,
        };
      }),
    );
  }
}

/**
 * 全局异常过滤器：把错误也收敛成同一结构，前端只需判 code。
 *
 * 用 ExceptionFilter 而不是拦截器里 catchError —— 拦截器捕获不到
 * Guard/Pipe 阶段（如权限拒绝、限流 429）抛出的异常。
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? (exception.getResponse() as any)?.message ?? exception.message
        : (exception as Error)?.message ?? '服务器内部错误';

    this.logger.warn(`请求失败 status=${status} message=${message}`);

    res.status(status).json({
      code: status,
      message: Array.isArray(message) ? message.join('; ') : message,
      data: null,
      ts: Date.now(),
    });
  }
}
