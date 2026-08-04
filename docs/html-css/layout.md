# 🎨 CSS 布局全解与响应式设计

> 术语表（[核心术语](glossary.md)）讲了 BFC/IFC/包含块等概念，本篇把它们**变成能直接抄的布局代码**。覆盖 Flexbox、Grid、响应式、经典布局模式。依据 **W3C CSS 规范**、**MDN**、**web.dev**。
>
> 适用：所有层级——抄现成布局（初级）、理解为何这样排（中级）、排查错位（高级）。

---

## 一、布局两大基石：Flexbox 与 Grid

| 维度 | Flexbox | Grid |
|------|---------|------|
| 适用 | 一维（行 **或** 列） | 二维（行 **和** 列同时） |
| 典型 | 导航栏、卡片列表、居中 | 整体页面骨架、仪表盘 |
| 主轴 | `flex-direction` | 无主轴概念，直接定义 tracks |

---

## 二、Flexbox 实战

```css
.container {
  display: flex;
  flex-direction: row;        /* row(默认) | column */
  justify-content: center;    /* 主轴对齐：start|end|center|space-between|space-around */
  align-items: center;        /* 交叉轴对齐：stretch|start|end|center|baseline */
  gap: 1rem;                  /* 子项间距（替代 margin） */
  flex-wrap: wrap;            /* 放不下换行 */
}
.item { flex: 1; }            /* 等分剩余空间；flex: 0 0 200px 表示固定 200px */
```

### 万能居中（面试/日常最高频）
```css
.center { display: flex; justify-content: center; align-items: center; min-height: 100vh; }
```

!!! danger "死角 1：align-items 默认 stretch 撑高"
    子项不设高度时会被 `align-items: stretch` 拉满交叉轴，导致"我想靠上却占满"。改 `align-items: flex-start`。

!!! tip "子项 margin: auto 妙用"
    `margin-left: auto` 能把一个子项推到最右（导航栏右侧"登录"按钮的经典写法）。

---

## 三、Grid 实战

```css
.grid {
  display: grid;
  grid-template-columns: 200px 1fr 1fr;  /* 三列：固定200 / 两份剩余 */
  grid-template-rows: auto 1fr auto;     /* 头/内容/脚 */
  gap: 1rem;
}
.header { grid-column: 1 / -1; }         /* 横跨所有列 */
.sidebar { grid-row: 2; grid-column: 1; }
```

### 响应式自适应列数
```css
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}
/* 容器变窄自动减少列数，无需媒体查询 */
```

!!! danger "死角 2：1fr 包含 gap 吗"
    `1fr` 是"剩余空间"，gap 会先扣除再分。若子项内容超宽会撑破，加 `min-width: 0` 修复（Grid/Flex 子项默认 min-width: auto）。

---

## 四、经典布局模式（直接抄）

### 1. 圣杯 / 双栏
```css
.layout { display: grid; grid-template-columns: 220px 1fr; min-height: 100vh; }
```
### 2. 后台管理（侧边 + 顶栏 + 内容）
```css
.app { display: grid; grid-template-columns: 220px 1fr; grid-template-rows: 56px 1fr; grid-template-areas: "side top" "side main"; }
.side { grid-area: side; } .top { grid-area: top; } .main { grid-area: main; overflow: auto; }
```
### 3. 粘性顶栏
```css
.sticky-top { position: sticky; top: 0; z-index: 10; background: #fff; }
```
### 4. 底部吸附（内容少也贴底）
```css
body { display: flex; flex-direction: column; min-height: 100vh; }
.footer { margin-top: auto; }
```

---

## 五、响应式设计

### 移动优先（Mobile First）
先写手机样式，再用 `min-width` 媒体查询向上增强（推荐）：
```css
.card { width: 100%; }
@media (min-width: 768px) { .card { width: 50%; } }
@media (min-width: 1200px) { .card { width: 33.33%; } }
```

### 断点建议
| 设备 | 断点 |
|------|------|
| 手机 | < 768px |
| 平板 | 768–1199px |
| 桌面 | ≥ 1200px |

### 相对单位
```css
html { font-size: 16px; }
.box { width: 20rem; }        /* 随根字体缩放，比 px 灵活 */
.img { max-width: 100%; }     /* 图片永不溢出容器 */
```

!!! danger "死角 3：媒体查询写在后面才生效"
    同优先级样式，后写的覆盖先写的。移动优先时媒体查询必须放在基础样式**之后**。

---

## 六、容器查询（现代响应式）

```css
.card-container { container-type: inline-size; }
@container (min-width: 400px) { .card { display: flex; } }
```
组件根据**父容器宽度**而非视口响应，适合组件库。

---

## 七、布局自检清单

- [ ] 能用 Flex 做导航栏 + 居中
- [ ] 能用 Grid 搭后台骨架（侧边/顶栏/内容）
- [ ] 知道 `min-width: 0` 修复溢出
- [ ] 会移动优先写响应式断点
- [ ] 图片 `max-width: 100%` 防溢出
- [ ] 知道 sticky 与 fixed 区别

> 配套：[浏览器渲染与性能总纲](../performance.md) 讲重排/重绘；[核心术语](glossary.md) 讲 BFC/包含块原理。
