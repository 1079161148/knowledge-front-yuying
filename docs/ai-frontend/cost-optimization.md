# 💰 成本优化

> AI 应用的成本 = token × 单价，且随用户量线性放大。本页讲清四大杠杆的**可落地代码**：模型路由、缓存、批处理、上下文裁剪。以官方 SDK 能力为准。

> 📌 **适用版本 / 更新日期**：概念与范式稳定；最后更新 **2026-08**。

---

## 1. 成本公式

```
月成本 ≈ 单次平均 token × 调用次数 × 单价
```

最大变量是"单次平均 token"——靠上下文裁剪（见[记忆](memory-context.md)）和模型路由压下来。

!!! danger "不优化的后果"
    长对话循环 + 全量重发历史 + 全程用最强模型 = 成本可能比合理方案高 5-10 倍。

---

## 2. 杠杆一：模型路由（小模型做 majority）

```ts
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'

function pickModel(task: string) {
  if (/简单|分类|抽取|改写/.test(task)) return openai('gpt-4o-mini')
  if (/推理|分析|长文/.test(task)) return anthropic('claude-opus-4')
  return openai('gpt-4o-mini')
}
```

!!! tip "经验法则"
    80% 任务小模型够用，强模型只做复杂步。路由能砍掉大半成本且体验不掉。

---

## 3. 杠杆二：缓存（相似问题不重算）

- **语义缓存**：问题 embedding 相似度命中 → 直接返缓存答案。
- **LLM 提供商缓存**：很多 API 对相同前缀输入自动折扣（查看各 provider 文档）。

```ts
const emb = await embed({ model: openai.embedding('text-embedding-3-small'), value: q })
const hit = await cache.similarGet(emb, 0.95)
if (hit) return hit // 命中，0 生成成本
```

---

## 4. 杠杆三：批处理（非实时任务）

对于离线摘要/批量抽取，用 provider 的 Batch API（通常有折扣、非实时）：

```ts
// OpenAI batch / 异步队列思路：攒一批再发，降单价
await client.batches.create({ requests: [...], endpoint: '/v1/chat/completions' })
```

!!! warning "批处理陷阱"
    仅适用于**非实时**任务。用户等待中的请求不能批处理，否则延迟爆炸。

---

## 5. 杠杆四：上下文裁剪（复用记忆策略）

滑动窗口 + 摘要 + 长期记忆检索（见[记忆与上下文](memory-context.md)），直接降输入 token。

---

## 6. 成本看板（必备）

按 userId / 功能维度聚合 token 成本，设预算告警（见[可观测](ai-observability.md)）。

!!! danger "成本优化坑"
    1. 只优化单价不优化 token 量 → 杯水车薪。
    2. 缓存未做相似度阈值 → 误命中错误答案。
    3. 批处理误用于实时请求 → 延迟炸。
    4. 无分用户成本监控 → 异常消耗难定位。

> 衔接：[模型 API 与流式](model-api-streaming.md) · [记忆与上下文](memory-context.md)
