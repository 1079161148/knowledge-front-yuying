# 🟩 Vue 3.5 破坏性变更与迁移指南

> 随着 `npm` 将 Vue 3 升级到 **3.5.x**（当前知识库已使用 `vue@3.5.40`），官方引入了一批新特性，也对部分边缘行为做了调整。本文依据 **Vue 3.5 官方 Release Notes**、**RFC 文档**、**迁移指南** 整理，帮你在日常迭代中平滑升级，避免踩坑。

---

## 一、版本定位

| 版本 | 性质 | 说明 |
|------|------|------|
| Vue 3.4 | 稳定基线 | `defineModel` 在 3.4 中仍是实验性 |
| Vue 3.5 | 稳定增强版 | `defineModel` 转正、`useTemplateRef` 等 API 加入 |
| Vue 2.7 | EOL（已停止维护） | 知识库中保留仅作历史对比 |

Vue 3.5 是**向后兼容**的 minor 升级，大多数项目无需改动即可运行，但以下细节必须注意。

---

## 二、`defineModel()` 从实验性转正（最大变更）

### 之前（3.4 及更早）
```vue
<script setup>
const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])
function onInput(e) { emit('update:modelValue', e.target.value) }
</script>
```

### Vue 3.5 推荐写法
```vue
<script setup>
const model = defineModel()        // 等价于 modelValue + update:modelValue
// const title = defineModel('title') // 多个 v-model
function onInput(e) { model.value = e.target.value }
</script>
```

!!! danger "破坏性点 1：defineModel 不再依赖 defineProps/defineEmits"
    在 3.4 中 `defineModel` 是宏函数，但内部仍需要和 `defineProps` 配合声明 `modelValue`。3.5 中 `defineModel` 会**自动声明 props 和 emit**，如果你同时写了 `defineProps({ modelValue: ... })` 会报重复声明错误。

!!! tip "迁移建议"
    新组件直接用 `defineModel()`；老组件若用了实验性 `defineModel`，删除多余的 `modelValue` prop 声明即可。

---

## 三、`useTemplateRef()` 取代变量式 ref（推荐变更）

### 之前
```vue
<script setup>
import { ref, onMounted } from 'vue'
const inputRef = ref(null)   // 变量名和模板 ref 同名才有效
onMounted(() => inputRef.value?.focus())
</script>
<template>
  <input ref="inputRef" />
</template>
```

### Vue 3.5 推荐写法
```vue
<script setup>
import { useTemplateRef, onMounted } from 'vue'
const inputRef = useTemplateRef('inputRef')  // 显式、类型安全
onMounted(() => inputRef.value?.focus())
</script>
<template>
  <input ref="inputRef" />
</template>
```

!!! info "为什么更好"
    普通 `ref(null)` 依赖"变量名 = ref 名"的隐式绑定，TS 类型推导弱、重构易出错。`useTemplateRef` 显式指定模板 ref 名，类型更稳。

---

## 四、响应式系统行为微调

### 1. `watch` 对深度侦听的优化

Vue 3.5 改进了 `deep: true` 的触发策略，**减少了不必要的重复触发**，但某些依赖"每次赋值都触发 watch"的旧代码可能表现不同。

```js
const state = reactive({ nested: { count: 0 } })
watch(state, () => console.log('changed'), { deep: true })
state.nested.count++   // 3.4 可能触发多次；3.5 更收敛
```

!!! danger "死角：依赖 watch 触发次数做副作用"
    如果你用 `watch` 触发次数来统计变化次数或做防抖逻辑，3.5 的收敛可能导致次数变少。应该用 `watchEffect` 或显式 `flush: 'sync'` 控制时机。

### 2. `reactive()` 数组方法一致性

Vue 3.5 统一了 `reactive(arr)` 上调用数组方法后的依赖追踪，以下场景修复了 3.4 的 bug：

```js
const arr = reactive([1, 2, 3])
watch(() => arr.length, console.log)
arr.push(4)   // 3.5 保证 length  watcher 触发
```

!!! tip "迁移建议"
    这属于 bugfix，通常不需要改代码；如果你之前因为 length 不触发而写了 `nextTick`  workaround，现在可以删掉。

---

## 五、 suspense 与异步组件

Vue 3.5 对 `<Suspense>` 做了内部重构，主要影响：

- 嵌套 `<Suspense>` 的解析顺序更稳定。
- `onErrorCaptured` 在异步组件错误时返回行为更一致。

!!! danger "破坏性点 2：async setup 错误边界"
    如果你自己实现了基于 `Suspense` 的错误捕获 UI，建议升级到 3.5 后跑一次全量回归。3.4 中某些"子 suspense 抛错被父吞掉"的场景，3.5 会正确向上冒泡。

---

## 六、模板解析器优化

3.5 的编译器会生成更紧凑的 VNode 创建代码，运行时性能更好。对开发者透明，但有两点注意：

1. **自定义指令的钩子参数顺序不变**，但内部调用次数可能减少（性能优化）。
2. **`v-once` + `v-memo`** 的缓存策略优化，之前某些"应该更新但没更新"的边界 bug 被修复。

---

## 七、TypeScript 类型变化

### `defineModel` 的类型
```ts
const model = defineModel<string>({ default: '' })
// model.value 类型为 string | undefined？不，default 后是非 undefined
```

3.5 中 `defineModel` 的泛型推断更精确：
- 提供了 `default` → `Ref<T>`（不含 undefined）
- 没提供 `default` → `Ref<T | undefined>`

!!! danger "破坏性点 3：TS 严格模式下类型变窄"
    如果你之前写了 `model.value!.trim()` 来绕过，3.5 中可能因类型变窄而提示 `.trim()` 不必要的非空断言，需清理 `!`。

---

## 八、构建工具链注意事项

| 工具 | 建议 | 原因 |
|------|------|------|
| Vite | ≥5.0 | Vue 3.5 的 plugin 需要较新 Vite |
| @vitejs/plugin-vue | ≥5.0 | 完整支持 3.5 宏 |
| Vue Language Features (Volar) | ≥2.0 | 支持 `useTemplateRef` / `defineModel` 类型 |
| TypeScript | ≥5.0 | 配合 Volar 新解析器 |

---

## 九、迁移 checklist

- [ ] 全局搜索 `defineModel` 的旧实验性用法，删除多余的 `modelValue` prop
- [ ] 新组件优先用 `defineModel()` / `useTemplateRef()`
- [ ] 检查 `watch(..., { deep: true })` 是否依赖触发次数做逻辑
- [ ] 跑一遍 `<Suspense>` + 异步组件的错误边界回归
- [ ] 升级 Volar / Vite / plugin-vue 到推荐版本
- [ ] 开启 `vueCompilerOptions.strictTemplates: true` 捕获 `defineModel` 类型问题

---

## 十、快速对照表

| 场景 | Vue 3.4 | Vue 3.5 推荐 |
|------|---------|--------------|
| 双绑 props | `props+emit` 或实验性 `defineModel` | `defineModel()` |
| 模板 ref | `const el = ref(null)` | `useTemplateRef('el')` |
| 深层 watch | 可能多次触发 | 触发更收敛，检查逻辑 |
| async setup 错误 | 边界可能不冒泡 | 正确冒泡，检查错误边界 |

> 参考：Vue 官方 [3.5 Release Notes](https://blog.vuejs.org/posts/vue-3-5)、[迁移指南](https://vuejs.org/guide/best-practices/production-deployment)、Volar 文档。
