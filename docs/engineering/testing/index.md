# 🧪 单元测试与集成测试

> 测试 = 用代码验证代码，给重构与迭代上保险。本篇覆盖 **测试金字塔、Vitest/Jest（单元）、Testing Library（组件）、Playwright（E2E）、覆盖率与 Mock 实践**。
>
> 权威来源：[Vitest 文档](https://vitest.dev/)、[Jest 文档](https://jestjs.io/)、[Testing Library](https://testing-library.com/)、[Playwright 文档](https://playwright.dev/)、[Google 测试金字塔](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html)。

---

## 1. 术语表

- **单元测试（Unit）**：测单一函数/组件，快、多、隔离。
- **集成测试**：测多个模块协作（如组件 + store + API mock）。
- **E2E（端到端）**：真实浏览器跑完整用户流程，慢、少、贵。
- **Mock**：替换外部依赖（接口、定时器）以稳定测试。
- **覆盖率（Coverage）**：被测代码比例（行/分支/函数）。

---

## 2. 测试金字塔（资源分配）

```
      /\      E2E（少量，关键路径）
     /  \     集成测试（中量）
    /____\    单元测试（大量，底座）
```
多数团队应是 **70% 单元 / 20% 集成 / 10% E2E**。别反过来堆 E2E，维护成本爆炸。

---

## 3. Vitest 单元测试

```ts
// sum.test.ts
import { describe, it, expect } from 'vitest'
import { sum } from './sum'
describe('sum', () => {
  it('正数相加', () => expect(sum(1, 2)).toBe(3))
  it('负数', () => expect(sum(-1, 1)).toBe(0))
})
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: { environment: 'jsdom', coverage: { provider: 'v8' } },
})
```

---

## 4. 组件测试（Testing Library）

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Counter } from './Counter'
it('点击加一', () => {
  render(<Counter />)
  fireEvent.click(screen.getByText('+'))
  expect(screen.getByText('1')).toBeInTheDocument()
})
```

!!! danger "组件测试三大原则"
    - **测行为不测实现**：点按钮看结果，别断言内部 state。
    - **用可访问查询**（`getByRole/getByText`），不依赖 `data-testid` 泛滥。
    - **异步用 `findBy` / `waitFor`**，别同步断言。

---

## 5. E2E（Playwright）

```ts
import { test, expect } from '@playwright/test'
test('登录流程', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name=username]', 'tom')
  await page.click('button[type=submit]')
  await expect(page).toHaveURL('/dashboard')
})
```

---

## 6. Mock 与覆盖率

```ts
import { vi } from 'vitest'
const fn = vi.fn().mockReturnValue(1)
expect(fn).toHaveBeenCalledOnce()
```

```bash
# 覆盖率门槛（package.json scripts）
vitest run --coverage --coverage.thresholds.lines 80
```

!!! danger "测试反面教材"
    - **只测 happy path**：边界（空值、超长、并发）才最容易出 bug。
    - **测试依赖真实接口**：没网就红。用 Mock/MSW 隔离。
    - **覆盖率 100% 当 KPI**：追求数字会催生无意义测试。关注**核心逻辑**覆盖。
    - **快照测试乱更新**：`--update` 前先看 diff，否则把 bug 固化进快照。

---

## 7. 自检清单

- [ ] 我按金字塔分配：单元多、E2E 少
- [ ] 组件测试测行为而非内部实现
- [ ] 异步用 `findBy`/`waitFor`
- [ ] 外部依赖用 Mock/MSW 隔离
- [ ] 覆盖了边界与异常分支
- [ ] 覆盖率设了合理门槛但不盲追 100%

---

## 8. 下一步

- 测试接入自动跑 → [CI/CD](../cicd/index.md)
- 性能回归可用测试守护 → [性能优化](../performance/index.md)
