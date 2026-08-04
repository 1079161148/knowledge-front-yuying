# 🔰 给后端 / 非前端开发者的前端速通

> 写给**后端、运维、测试、数据、刚转岗的前端新人**——目标：30 分钟内能看懂一个前端项目、跑起来、改一处文案、不害怕报错。不教你成为前端专家，只帮你**消除对前端的陌生感**。
>
> 依据：本知识库既有篇章 + **MDN**、**Node.js 官方文档**、**npm 文档**。

---

## 一、前端项目在你眼里是什么

后端看服务：路由 → 控制器 → 服务 → 数据库。
前端看页面：入口 HTML → JS 把组件渲染进 DOM → 用户交互 → 发请求给后端。

一句话：**前端就是"运行在浏览器里的程序"**，它的"服务器"是用户的浏览器。

```
浏览器
 └─ 加载 index.html
     └─ 加载打包后的 app.js（由 npm run build 生成）
         └─ 把组件渲染成 <div> 放进 <body>
             └─ 用户点击 → JS 处理 → fetch('/api/xxx') → 你的后端
```

!!! tip "最重要的认知"
    前端代码最终是**发给用户浏览器执行的文本**（HTML/CSS/JS）。你写的 Java/Go/Python 跑在服务器，前端跑在用户机器上。两者之间只靠 **HTTP 接口（JSON）** 通信。

---

## 二、第一次打开一个前端仓库该看什么

```
my-frontend/
├─ package.json      ← 项目的"说明书"：依赖 + 脚本命令（最重要！）
├─ package-lock.json ← 依赖精确版本锁（CI 可复现）
├─ vite.config.ts    ← 构建工具配置（dev server / 打包规则）
├─ src/              ← 源码目录
│  ├─ main.ts        ← 入口文件（程序启动点，类比 main 函数）
│  ├─ App.vue/App.tsx← 根组件
│  ├─ components/    ← 可复用 UI 片段
│  ├─ views/pages/   ← 页面级组件
│  ├─ api/           ← 调后端接口的地方（fetch/axios 封装）
│  └─ assets/        ← 图片/样式
└─ index.html        ← 唯一真实 HTML 入口（其他都是 JS 生成的）
```

### 必读 `package.json` 的 scripts
```jsonc
"scripts": {
  "dev": "vite",          // 本地开发：跑起来看效果
  "build": "vite build",  // 打包：生成可部署的静态文件
  "preview": "vite preview" // 本地预览打包结果
}
```
对应命令：`npm install`（装依赖）→ `npm run dev`（起开发服务器）。

---

## 三、三条命令跑通任何前端项目

```bash
node -v          # 确认装了 Node（>=18）
npm install      # 安装依赖（类比 pip install / go mod download）
npm run dev      # 启动开发服务器，终端会打印 http://localhost:5173
```

!!! danger "常见卡点"
    - `node -v` 报错 → 没装 Node，去 nodejs.org 装 LTS。
    - `npm install` 慢/失败 → 换源 `npm config set registry https://registry.npmmirror.com`。
    - 端口被占用 → 看终端提示，换端口或关掉占用进程。

---

## 四、组件是什么（后端类比）

| 后端概念 | 前端对应 |
|----------|----------|
| 函数 / 方法 | 组件（接收 props 输入，返回 UI） |
| 返回值 | 渲染出的 HTML 片段 |
| 全局变量 | 状态管理（Pinia/Redux） |
| DTO | props 的类型定义 |
| 模板引擎（Thymeleaf/JSF） | JSX / Vue 模板 |

```vue
<!-- Vue 组件：接收 name，渲染一个标题 -->
<template>
  <h1>{{ name }}</h1>
</template>
<script setup>
defineProps({ name: String })
</script>
```
类比后端：`String render(String name) { return "<h1>" + name + "</h1>"; }`

---

## 五、怎么和前端联调（后端最关心）

前端调你的接口通常是：
```js
fetch('/api/users')
  .then(r => r.json())
  .then(data => console.log(data))
```
你需要提供：
1. **接口地址**（如 `/api/users`）
2. **请求方法 / 参数 / 返回 JSON 结构**
3. **跨域（CORS）**：前端 `localhost:5173` 调你 `localhost:8080` 会跨域，后端要加 `Access-Control-Allow-Origin`。

!!! tip "联调提速"
    本地用 Vite 的 `proxy` 把 `/api` 代理到你的后端端口，前端就无需关心跨域：
    ```ts
    // vite.config.ts
    server: { proxy: { '/api': 'http://localhost:8080' } }
    ```

---

## 六、看到报错不慌的 3 步

1. **看浏览器 Console**（F12 → Console）：红色错误就是线索，通常带文件名和行号。
2. **看终端**：`npm run dev` 的终端会报编译错误（语法错、类型错）。
3. **搜索报错信息**：把报错第一行复制去搜，90% 别人遇过。

!!! danger "别改不懂的代码"
    后端最易犯的错：在 `node_modules/`（第三方依赖）里改代码。永远改 `src/` 下的。

---

## 七、30 分钟上手 checklist

- [ ] 装好 Node，能跑 `node -v`
- [ ] 克隆一个前端仓库，`npm install` 成功
- [ ] `npm run dev` 打开页面看到效果
- [ ] 找到 `src/App.xx`，改一处文字，页面热更新
- [ ] 看懂 `fetch('/api/...')` 是调后端的地方
- [ ] 知道 Console 在哪、怎么看报错

> 下一步：想写业务就看 [JS 基础](../js/foundation.md)；想懂布局看 [HTML5 / CSS3](../html-css/index.md)；想联调接口看 [DOM/BOM + Web API 实战](../js/web-api.md)。
