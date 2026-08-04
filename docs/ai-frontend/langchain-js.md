# 🔗 LangChain.js 专题

> LangChain.js 是构建 LLM 应用的**框架级**方案：提供统一抽象（Runnable / Message / Tool / VectorStore / Chain / Agent），适合复杂编排与生态集成。本页讲清它是什么、核心模块、何时用、踩坑点。以官方文档为准。

依据：[docs.langchain.com/oss/javascript](https://docs.langchain.com/oss/javascript/langchain/overview) · [js.langchain.com](https://js.langchain.com)

> 📌 **适用版本 / 更新日期**：LangChain.js `v0.3.x`；最后更新 **2026-08**。API 可能随版本变化，请以官方 changelog 为准。

---

## 1. 官方定位

> LangChain is a framework for building LLM-powered applications. It helps you chain together interoperable components and third-party integrations. （官方）

核心抽象（官方统一接口）：

| 抽象 | 作用 |
|------|------|
| **Runnable** | 一切可调用单元的接口（LLM / Chain / Retriever 都实现 `invoke/stream/batch`） |
| **ChatModel / LLM** | 模型封装，统一 `invoke` / `stream` |
| **Message** | SystemMessage / HumanMessage / AIMessage / ToolMessage |
| **Tool** | 函数工具，可被 Agent 调用 |
| **VectorStore** | 向量库统一接口（pgvector / Qdrant / Milvus 等） |
| **Chain** | 把多个 Runnable 串成流程 |
| **Retriever** | RAG 检索接口 |
| **create_agent** | 官方新推的"最小、可配置 agent harness"，从模型/工具/提示/中间件组合 |

!!! tip "Runnable 的统一性"
    所有组件都实现 `Runnable`，所以能 `pipe` 串联：`prompt | model | parser`。这是 LangChain 的核心设计美学。

---

## 2. 最小示例：链与流式

```ts
import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'

const model = new ChatOpenAI({ model: 'gpt-4o-mini' })
const prompt = PromptTemplate.fromTemplate('用一句话解释 {topic}')
const chain = prompt.pipe(model).pipe(new StringOutputParser())

// 流式
const stream = await chain.stream({ topic: 'MCP' })
for await (const chunk of stream) process.stdout.write(chunk)
```

---

## 3. RAG 与 VectorStore

```ts
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector'
import { OpenAIEmbeddings } from '@langchain/openai'

const vectorStore = await PGVectorStore.initialize(
  new OpenAIEmbeddings(),
  { postgresConnectionOptions: { /* ... */ } },
)
const retriever = vectorStore.asRetriever({ k: 5 })
// 接 chain
```

!!! warning "包拆分坑"
    LangChain.js 已拆成 `@langchain/core` / `@langchain/openai` / `@langchain/community` 等**多包**。别 `import` 错位置，且注意各包版本对齐，否则类型报错。

---

## 4. Agent / create_agent

官方新范式 `create_agent`：从 model + tools + prompt + middleware 组合，而非旧版 `initializeAssistant` 等重封装。

```ts
import { create_agent } from 'langchain/agents' // 示意，以官方最新 API 为准
const agent = create_agent({ model, tools: [getWeather], prompt })
const result = await agent.invoke({ input: '北京天气适合出门吗？' })
```

!!! danger "版本碎片化大坑"
    LangChain.js **API 演进快、文档与版本常不一致**。务必锁定文档版本与你安装的版本一致；旧教程的 `initializeXXX` 很多已弃用。优先看官方 `docs.langchain.com` 而非过时博客。

---

## 5. 何时选 LangChain.js vs 轻量方案

| 场景 | 选 |
|------|----|
| 想少写胶水、用现成 Retriever/Chain/社区集成 | **LangChain.js** |
| 简单应用、要最小依赖、TS 全栈含 UI | **Vercel AI SDK**（见[专题](vercel-ai-sdk.md)） |
| 复杂有状态图编排 | **LangGraph**（见[编排](agent-orchestration.md)） |

!!! tip "务实建议"
    新手先用 Vercel AI SDK 跑通闭环，理解原理后若需大量现成集成（文档加载器、上百个向量库/工具），再引入 LangChain.js。别为了"框架名气"一上来就 LangChain，过度抽象增加认知负担。

---

## 6. 踩坑汇总

!!! danger "LangChain.js 高频坑"
    1. 多包版本不对齐 → 类型/运行时错。
    2. 照搬旧版 API（已弃用）。
    3. Chain 嵌套过深，调试看不到中间值（用 `.withConfig({ runName })` 打标 + LangSmith 追踪）。
    4. 文档加载器（PDF/HTML）解析质量参差，先验证 chunk 内容。
    5. 默认不带记忆，多轮要显式传 history 或用 Memory。

> 对照轻量方案 → [Vercel AI SDK](vercel-ai-sdk.md)
