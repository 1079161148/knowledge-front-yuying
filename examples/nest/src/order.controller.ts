import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { PermissionGuard, RequirePerms } from './permission.guard';
import { Order } from './order.entity';

interface CreateOrderDto {
  userId: number;
  items: { sku: string; qty: number }[];
}

@Controller('api/orders')
@UseGuards(PermissionGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /** 下单：需 order:create 权限，事务内扣库存 */
  @Post()
  @RequirePerms('order:create')
  create(@Body() dto: CreateOrderDto): Promise<Order> {
    return this.orderService.createOrder(dto);
  }

  /** 查订单：公开（无 @RequirePerms） */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Order> {
    return this.orderService.findOne(id);
  }

  /** 查库存：用于验证事务回滚后库存是否复原 */
  @Get('stock/:sku')
  stock(@Param('sku') sku: string): Promise<{ sku: string; stock: number }> {
    return this.orderService
      .stockOf(sku)
      .then((stock) => ({ sku, stock }));
  }
}
