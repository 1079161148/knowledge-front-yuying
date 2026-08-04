# 🔌 模型 API 与流式响应

> 所有 AI 应用的"入口"。本页讲清怎么用官方 SDK 调模型、怎么处理流式（SSE / ReadableStream）、怎么管理错误与超时、成本怎么算。以 Vercel AI SDK / OpenAI SDK 官方 API 为准。

> 📌 **适用版本 / 更新日期**：Vercel AI SDK `v4` + `@ai-sdk/openai v1` + OpenAI SDK `v4`；最后更新 **2026-08**。可运行示例见 `demos/ai-runtime/chat-stream.mjs`。

---

## 1. 模型 API 三种调用形态

| 形态 | 方法 | 用途 |
|------|------|------|
| 单次（非流式） | `generateText` / `chat.completions.create` | 后台任务、批量 |
| 流式 | `streamText` / `stream` | 聊天 UI、打字机 |
| 结构化 | `generateObject` | 抽取、表单 |

=== "AI SDK 非流式"
    ```ts
    import { generateText } from 'ai'
    import { openai } from '@ai-sdk/openai'
    const { text, usage } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: '一句话解释 Token',
    })
    console.log(usage) // { promptTokens, completionTokens }
    ```

=== "OpenAI 原生 SDK"
    ```ts
    import OpenAI from 'openai'
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const r = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'hi' }],
    })
    ```

!!! danger "Key 绝不进前端"
    前端直连 = 密钥泄露。架构：前端 → 你的后端（带 Key）→ 模型（见[安全](best-practices.md)）。

---

## 2. 流式响应（SSE / ReadableStream）

模型逐 token 返回，体验关键。前端用 `ReadableStream` 消费。

=== "后端流式（AI SDK）"
    ```ts
    export async function POST(req: Request) {
      const { messages } = await req.json()
      const result = streamText({
        model: openai('gpt-4o-mini'),
        messages,
      })
      return result.toDataStreamResponse()
    }
    ```

=== "前端消费（fetch + ReadableStream）"
    ```ts
    const res = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    })
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      processChunk(decoder.decode(value))
    }
    ```

!!! tip "React 直接用 useChat"
    不用手写流解析，[Vercel AI SDK](vercel-ai-sdk.md) 的 `useChat` 已封装（见实战页）。

!!! danger "流式三坑"
    1. **不处理 AbortController**：用户点停止后端还在跑、烧 token。透传 `req.signal`。
    2. **Serverless 超时**：长回答被截断，设 `maxDuration`（平台内）。必要时用流式 + 后台任务模式。
    3. **前端不处理断流**：网络中断要提示重连，别卡死转圈。

---

## 3. 错误处理与重试

```ts
try {
  const r = await generateText({ model, prompt })
} catch (e) {
  if (e instanceof APIError && e.status === 429) {
    // 限流：指数退避重试
    await sleep(2 ** attempt * 1000)
  } else if (e instanceof APITimeoutError) {
    // 超时：降级/重试
  }
}
```

!!! warning "重试陷阱"
    - 429 限流要**指数退避 + 抖动**，别暴力重试（雪崩）。
    - 非幂等操作（发短信）重试要防重。
    - 超时别无限等，设上限 + 友好降级。

---

## 4. 成本计算（必懂）

成本 = (输入 token + 输出 token) × 单价。多轮对话每次重发历史 → 成本随轮数线性增长。

!!! danger "成本炸弹"
    长对话循环调用不裁剪 + 每次全量重发 = token 按月翻几倍。上线前算清：单次平均 token × 日活 × 单价（详见[成本优化](cost-optimization.md)）。

---

## 5. 多模型 / 多供应商路由

同一套 `messages` 可切不同模型（`openai` / `anthropic` / `deepseek`）。这是成本优化与容灾基础（见 [Vercel AI SDK](vercel-ai-sdk.md) 多 provider）。

```ts
const model = isSimple ? openai('gpt-4o-mini') : anthropic('claude-opus-4')
```

> 下一步：[结构化输出与工具调用](function-calling.md)
