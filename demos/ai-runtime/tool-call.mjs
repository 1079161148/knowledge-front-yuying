// tool-call.mjs —— 对应文档《结构化输出与工具调用 (Function Calling)》最小可运行示例
// 运行：node tool-call.mjs
//
// 演示要点（与文档避坑一一对应）：
//   1. tool 的 parameters 必须是符合 JSON Schema 的对象，不能用 TS 类型；
//   2. 模型「只返回调用意图」，真正执行函数的是你的代码（executed by your code）；
//   3. 用 maxSteps 让模型在拿到工具结果后继续推理（多轮工具调用 / Agent 雏形）；
//   4. execute 必须是 async 或 sync 的纯函数，禁止在里面做未授权副作用。

import 'dotenv/config'
import { generateText, tool } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod' // AI SDK v4 用 zod 描述参数 schema

const model = openai('gpt-4o-mini')

const result = await generateText({
  model,
  prompt: '北京现在天气怎么样？如果工具体现需要城市参数，请用 Beijing。',
  tools: {
    getWeather: tool({
      description: '查询指定城市的当前天气（示例为模拟实现）',
      parameters: z.object({
        city: z.string().describe('城市英文名，如 Beijing'),
      }),
      // execute 由你的代码执行，模型只决定"何时调用 + 传什么参"
      execute: async ({ city }) => {
        // 真实场景此处调用天气 API；此处用模拟值避免外部依赖
        return { city, tempC: 21, condition: 'Sunny', mocked: true }
      },
    }),
  },
  maxSteps: 3, // 允许模型拿到工具结果后继续回答（关键：否则只返回 tool_call）
  temperature: 0,
})

console.log('[最终回答]', result.text)
console.log('[工具调用记录]', JSON.stringify(result.toolCalls, null, 2))
console.log('[工具结果]', JSON.stringify(result.toolResults, null, 2))
