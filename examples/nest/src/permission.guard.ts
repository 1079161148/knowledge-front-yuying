import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * 权限 Guard：从请求取当前用户权限码，校验方法注解要求的权限。
 * 配合 @UseGuards(PermissionGuard) + @RequirePerms('order:delete') 使用。
 *
 * 最佳实践：
 *  - 权限码粒度用 资源:动作（order:delete）
 *  - 前端按钮隐藏只是体验，后端 Guard 是底线（防抓包直调）
 */
export const PERMS_KEY = 'perms';

/**
 * 用 Nest 的 SetMetadata 而不是裸 Reflect.metadata：
 * Reflect.metadata 返回的装饰器签名与 Nest 的 Reflector.get 约定不完全一致，
 * SetMetadata 才是官方配套写法，能被 reflector.get / getAllAndOverride 稳定读到。
 */
export const RequirePerms = (...perms: string[]) =>
  SetMetadata(PERMS_KEY, perms);

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.get<string[]>(PERMS_KEY, ctx.getHandler());
    if (!required || required.length === 0) return true; // 无注解 = 公开

    const req = ctx.switchToHttp().getRequest();
    // 真实项目：从 JWT / Session 解析用户权限。
    // 示例为便于 curl 联调，退化为读 x-perms 请求头（逗号分隔）。
    const headerPerms = (req.headers?.['x-perms'] as string | undefined) ?? '';
    const userPerms: string[] =
      req.user?.perms ??
      headerPerms.split(',').map((s) => s.trim()).filter(Boolean);

    const ok = required.every((p) => userPerms.includes(p));
    if (!ok) throw new ForbiddenException(`缺少权限: ${required.join(',')}`);
    return ok;
  }
}
