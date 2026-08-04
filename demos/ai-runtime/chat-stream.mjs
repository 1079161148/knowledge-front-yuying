// chat-stream.mjs —— 对应文档《模型 API 与流式响应》的最小可运行示例
// 运行前：在 ai-runtime/ 目录下 `npm install`，并在同级 .env 配置 OPENAI_API_KEY
// 运行：node chat-stream.mjs
//
// 依赖（文档单一风格，Vercel AI SDK v4）：
//   ai@^4  @ai-sdk/openai@^1  dotenv@^16
//
// 关键演示点（与文档"注意事项/踩坑"一一对应）：
//   1. 设置 responseFormat / streamText 的正确入参顺序；
//   2. 流式用 for await (const part of result.textStream) 逐段消费，不要一次性 await result.text；
//   3. temperature 默认 0.7，生产建议按任务显式设置；
//   4. 异常用 try/catch 包裹，避免 API Key 缺失直接崩栈。

import 'dotenv/config'
import { generateText, streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

const model = openai('gpt-4o-mini') // 文档版本标注：OpenAI gpt-4o-mini，2026-08 仍可用

// —— 非流式：一次性拿完整结果（适合短回答 / 评估 / 测试）——
async function once() {
  const { text } = await generateText({
    model,
    prompt: '用一句话解释什么是大语言模型？',
    temperature: 0.3,
  })
  console.log('[generateText]', text)
}

// —— 流式：逐 token 输出（对应前端 ReadableStream / SSE）——
async function stream() {
  const result = streamText({
    model,
    prompt: '用三句话介绍 Function Calling。',
    temperature: 0.5,
  })

  // 正确消费方式：遍历 textStream，而不是 result.text（那是整段 Promise）
  let acc = ''
  for await (const delta of result.textStream) {
    process.stdout.write(delta)
    acc += delta
  }
  console.log('\n[streamText 累计长度]', acc.length)
}

try {
  await once()
  console.log('---')
  await stream()
} catch (err) {
  console.error('[ERROR] 调用失败：', err?.message ?? err)
  console.error('请确认 OPENAI_API_KEY 已配置，且网络可访问 API。')
  process.exit(1)
}
