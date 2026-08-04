package com.yuying.refund;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 退款队列 HTTP 接口（对应实战文档里的"后端执行层"）。
 *
 * OpenClaw 生产者调用 POST /api/refund/tasks 入队；
 * 运营后台可查队列/手动触发轮询/看结果。
 */
@RestController
@RequestMapping("/api/refund")
public class RefundController {

    private final RefundTaskService service;

    public RefundController(RefundTaskService service) {
        this.service = service;
    }

    /** 批量入队（生产者调用）。返回成功入队条数（重复订单被幂等跳过） */
    @PostMapping("/tasks")
    public ApiResult<Integer> enqueue(@RequestBody RefundTaskDto.BatchRequest req) {
        if (req == null || req.getTasks() == null || req.getTasks().isEmpty()) {
            return ApiResult.fail("tasks 不能为空");
        }
        List<RefundTask> tasks = req.getTasks().stream()
                .map(RefundTaskDto::toEntity)
                .collect(Collectors.toList());
        int n = service.enqueue(tasks);
        return ApiResult.ok(n);
    }

    /** 查看待处理队列 */
    @GetMapping("/tasks/pending")
    public ApiResult<List<RefundTask>> pending() {
        return ApiResult.ok(service.pending());
    }

    /** 手动触发一次消费（便于联调；生产由 @Scheduled 自动跑） */
    @PostMapping("/poll")
    public ApiResult<String> pollOnce() {
        service.poll();
        return ApiResult.ok("poll done");
    }
}
