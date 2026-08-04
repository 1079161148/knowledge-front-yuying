# 🏠 模型私有化部署

> 当数据不能出内网、或要控成本/合规时，需把开源模型部署到自有环境。本页讲清 Ollama / vLLM 最小落地、选型与注意事项。以官方项目为准（Ollama、vLLM）。

依据：[Ollama](https://ollama.com/) · [vLLM](https://docs.vllm.ai/)

> 📌 **适用版本 / 更新日期**：Ollama `0.5.x`、vLLM `0.6.x`（版本迭代快，命令以官方为准）；最后更新 **2026-08**。

---

## 1. 为什么要私有化

| 动因 | 说明 |
|------|------|
| **数据主权** | 金融/医疗/政企数据禁止出内网 |
| **成本** | 高频调用下，自建比 API 按量便宜（摊折旧） |
| **合规** | 监管要求模型与数据同域 |
| **定制** | 需微调/本地权重 |

!!! tip "多数应用不需要私有化"
    见 [学习路线-阶段5](learning-roadmap.md)：RAG + 好提示词覆盖 90% 需求，API 调用最省心。私有化是"有合规/成本刚需"才做。

---

## 2. 方案对比

| 方案 | 定位 | 适合 |
|------|------|------|
| **Ollama** | 本地一键跑模型，开发/单机 | 个人/小团队原型、本地 Agent |
| **vLLM** | 高吞吐推理服务，PagedAttention | 生产级、高并发 |
| **云端托管** | 阿里云/腾讯云模型服务 | 不想运维 |

---

## 3. Ollama 最小落地

```bash
# 安装后拉模型
ollama pull qwen2.5:7b
ollama run qwen2.5:7b
# 作为 OpenAI 兼容接口
ollama serve  # 默认 http://localhost:11434
```

在 AI SDK 里当 OpenAI 兼容端点用：

```ts
import { createOpenAI } from '@ai-sdk/openai'
const ollama = createOpenAI({ baseURL: 'http://localhost:11434/v1', apiKey: 'ollama' })
const model = ollama('qwen2.5:7b')
```

---

## 4. vLLM 生产部署（思路）

```bash
# 启动 OpenAI 兼容服务
vllm serve Qwen/Qwen2.5-7B-Instruct --host 0.0.0.0 --port 8000
```

!!! danger "私有化部署坑"
    1. **显存不够**：7B 模型量化后约 4-6GB，13B+ 需多卡。先算显存。
    2. **吞吐配置**：vLLM 的 `tensor-parallel-size` / `gpu-memory-utilization` 不对 → OOM。
    3. **无鉴权暴露**：服务别裸奔公网，加网关 + 鉴权。
    4. **量化掉点**：量化省显存但可能降质量，要 Eval 对比（见[Eval](eval.md)）。
    5. **与 API 行为不一致**：私有模型对工具/结构化输出支持弱，切换后要回归测试。

---

## 5. 私有化 + RAG 的闭环

私有模型 + 本地向量库（pgvector 同内网）= 全链路不出域，满足强合规。

> 衔接：[RAG](rag.md) · [向量数据库](vector-db.md) · [成本优化](cost-optimization.md)
