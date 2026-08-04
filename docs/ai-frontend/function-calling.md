# 🛠️ 结构化输出与工具调用（Function Calling）

> "让模型调你的函数"是 AI 应用从"聊天"变"能干活的系统"的核心。本页讲清 Function Calling / Tool Use、结构化输出、以及最容易踩的坑。以 OpenAI / Anthropic / Vercel AI SDK 官方 API 为准。

> 📌 **适用版本 / 更新日期**：OpenAI Responses/ Chat Completions Tool Calling（范式稳定）+ Vercel AI SDK `v4`；最后更新 **2026-08**。可运行示例见 `demos/ai-runtime/tool-call.mjs`。

---

## 1. 核心认知：模型不执行函数

!!! danger "最致命误解（必记）"
    模型**只生成调用意图** `{name, arguments}`，**真正执行在你代码里**。所谓"AI 查数据库"= AI 决定查 → 你代码查 → 结果喂回模型继续推理。理解这点，整个 Agent 体系就通了。

---

## 2. 定义工具（Tool）

=== "Vercel AI SDK"
    ```ts
    import { tool } from 'ai'
    import { z } from 'zod'
    const getWeather = tool({
      description: '查询某城市当前天气',
      parameters: z.object({ city: z.string().describe('城市名') }),
      execute: async ({ city }) => ({ city, temp: 26 }),
    })
    ```

=== "OpenAI 原生"
    ```ts
    const tools = [{
      type: 'function',
      function: {
        name: 'get_weather',
        description: '查询某城市天气',
        parameters: {
          type: 'object',
          properties: { city: { type: 'string' } },
          required: ['city'],
        },
      },
    }]
    ```

!!! tip "工具描述 = Agent 的智商"
    模型靠 `description` 决定调不调。写清"何时用、参数是什么"，比换更强模型更有效。含糊描述 → 模型乱调或漏调。

---

## 3. 多步工具调用（maxSteps）

模型可循环：调工具 → 看结果 → 再决定。用 `maxSteps` 限制步数防死循环。

```ts
const result = await generateText({
  model: openai('gpt-4o-mini'),
  tools: { getWeather, calc },
  messages,
  maxSteps: 5, // 最多 5 轮工具循环
})
```

!!! warning "死循环坑"
    模型可能反复调同一工具卡住。必须设 `maxSteps` 上限 + 工具内做幂等 + 必要时加"停止条件"护栏。

---

## 4. 结构化输出（强制 JSON）

需要程序消费模型结果时，强制 schema：

```ts
import { generateObject } from 'ai'
import { z } from 'zod'
const { object } = await generateObject({
  model: openai('gpt-4o-mini'),
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()),
    sentiment: z.enum(['pos', 'neg', 'neu']),
  }),
  prompt: '分析这条评论',
})
```

!!! danger "结构化输出三坑"
    1. **模型偶尔不守约**：schema 校验失败要有重试 / 兜底（try-catch + 重新请求带修正提示）。
    2. **JSON mode 与思考冲突**：要求纯 JSON 又要求 CoT，格式崩（见[提示工程](prompt-engineering.md)）。
    3. **枚举/类型太严**：模型无法命中 → 频繁报错。适当放宽 + 后处理校验。

!!! tip "Prefill 技巧"
    在 assistant 开头预置 `{"answer":`，强制模型续写 JSON，是稳定结构化输出的实战技巧（OpenAI/Anthropic 均支持）。

---

## 5. 工具安全（生产必看）

- **execute 要幂等**：模型可能重试，副作用操作（发短信/扣款）防重。
- **权限校验**：工具内校验"只能操作自己 userId 的数据"，防越权（见[安全](best-practices.md)）。
- **危险工具加护栏**：接"删库/发邮件"必须有 Guardrail + 人工确认。
- **禁止 eval 执行**：演示用 `Function('return '+expr)` 仅原理说明，生产禁用（见[实战聊天](project-ai-chat.md)）。

---

## 6. 与 Agent 的关系

工具是 Agent 的"手"。多工具 + 记忆 + 循环 = Agent（见 [AI Agent 与编排](agent-orchestration.md)）。MCP 让工具标准化复用（见 [MCP](mcp.md)）。

> 下一步：[LangChain.js 专题](langchain-js.md) 或 [Vercel AI SDK](vercel-ai-sdk.md)
