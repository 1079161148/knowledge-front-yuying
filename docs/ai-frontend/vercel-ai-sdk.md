# ⚡ Vercel AI SDK 轻量专题

> Vercel AI SDK 是**轻量、TypeScript 优先、框架无关**的 AI 应用工具包，前端同学最友好的入口：一套 API 支持 React/Vue/Svelte/Next/Node，统一多模型提供商，内置流式与 UI hooks。本页讲清定位、核心 API、何时选它。以官方文档（ai-sdk.dev）为准。

依据：[ai-sdk.dev/docs](https://ai-sdk.dev/docs/introduction)

> 📌 **适用版本 / 更新日期**：Vercel AI SDK `v4` + `@ai-sdk/openai v1`；最后更新 **2026-08**。v3→v4 有破坏性变更，老教程代码需核对版本。

---

## 1. 官方定位

> 统一的生成式 AI 应用 TypeScript 工具包。核心包：`ai`（核心）+ `@ai-sdk/react`（UI hooks）+ `@ai-sdk/openai` 等 provider。

特点：
- **框架无关核心** + **React 专用 hooks**（`useChat` / `useCompletion`）。
- **provider-agnostic**：换模型只改 `openai()` / `anthropic()` / `deepseek()`，业务代码不动。
- **流式一等公民**：`streamText` ↔ 前端 `useChat` 无缝对接。

---

## 2. 核心 API 速查

| API | 作用 |
|-----|------|
| `generateText` | 单次生成 |
| `streamText` | 流式生成（返回 DataStreamResponse） |
| `generateObject` | 强 schema 结构化输出 |
| `embed` | 文本向量化 |
| `tool` | 定义工具（含 zod 参数 + execute） |
| `experimental_createAgents` / `step` | Agent 多步（见官方 Agent API） |

=== "最小流式聊天（后端）"
    ```ts
    import { openai } from '@ai-sdk/openai'
    import { streamText } from 'ai'
    export async function POST(req: Request) {
      const { messages } = await req.json()
      return streamText({ model: openai('gpt-4o-mini'), messages })
        .toDataStreamResponse()
    }
    ```

=== "前端 useChat（React）"
    ```tsx
    'use client'
    import { useChat } from '@ai-sdk/react'
    export default function Chat() {
      const { messages, input, handleInputChange, handleSubmit } = useChat()
      return (<form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        {messages.map(m => <p key={m.id}>{m.role}: {m.content}</p>)}
      </form>)
    }
    ```

!!! tip "为什么前端同学零成本"
    流式、Abort、消息状态管理 `useChat` 全包了，你只写 UI。这正是"前端能力平移 AI"的最直接体现。

---

## 3. 多模型路由（成本优化基础）

```ts
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
const model = isHard ? anthropic('claude-opus-4') : openai('gpt-4o-mini')
```

!!! warning "Provider 差异"
    不同 provider 对工具/结构化输出支持度不一。切 provider 时务必回归测试（见[Eval](eval.md)），别假设行为一致。

---

## 4. 与 LangChain.js 的取舍

| 维度 | Vercel AI SDK | LangChain.js |
|------|---------------|--------------|
| 体量 | 轻量、最小抽象 | 框架级、集成多 |
| UI | 内置 React hooks | 需自己接 |
| 适用 | 全栈 TS 应用、快速交付 | 复杂编排、大量现成集成 |
| 学习曲线 | 低 | 中高（多包/版本） |

!!! tip "组合用法"
    核心用 AI SDK（含 UI），需要 LangChain 的 Retriever/Loader 时，把它的输出接到 AI SDK 的 prompt 里——不必二选一。

---

## 5. 踩坑汇总

!!! danger "AI SDK 高频坑"
    1. 忘记 `'use client'`：hooks 只能在客户端组件用。
    2. 不处理 `stop()`：用户中断后端仍跑（useChat 已内置 Abort，但自定义 fetch 要自己传 signal）。
    3. `maxDuration` 未设：Serverless 长回答被截断。
    4. 工具 `execute` 抛错不捕获 → 整个流崩，要有兜底。
    5. 历史全量重发 → token 成本飙升（见[记忆与上下文](memory-context.md)）。

> 轻量起步最佳；要复杂编排 → [AI Agent 与编排](agent-orchestration.md)
