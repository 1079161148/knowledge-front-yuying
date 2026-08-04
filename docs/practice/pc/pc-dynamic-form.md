# 复杂动态表单

**难点**：订单/配置类表单行可任意增删，单价×数量=小计要实时联动，提交时逐行校验（必填、数值范围、库存上限）。

**最佳实践**：用数组驱动（`items.map`），单行校验独立标记错误态，整单合计用 `reduce` 算。不要用 jQuery 式 DOM 操作。

<iframe src="../../../demos/pc-dynamic-form.html" height="560" style="width:100%;border:1px solid #30363d;border-radius:8px"></iframe>

**关键点（生产级细节）**

- 校验失败要**定位到具体行**（标红 + 错误信息带行号），别只弹个总报错。
- 联动计算放纯函数，避免和 DOM 耦合，方便单测。
- 真实项目用 `async-validator` / `zod` 做 schema 校验，比手写 `if` 稳。
- 大表单（>50 行）每一行独立 `Form` 实例，避免整表重校验卡顿。
- 跨行联动（如"整单折扣"影响每行小计）用派生 state，别双向改源数据。

**踩坑**

- 受控组件在万行时每次输入全表 re-render → 用 `React.memo` 包裹行 + 稳定 `key`，或局部 state 提交时再汇总。
- 删除中间行后 `index` key 错乱 → 用行 `id` 当 key。
