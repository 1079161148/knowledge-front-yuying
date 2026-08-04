# 新手第一课：从 0 搭建你的第一个网页

> 面向：零编程基础、刚装上电脑的新人。本篇不要求任何前置知识——**从安装工具到写出第一个能跑的网页，全程保姆级指引**。

---

## 一、你需要准备什么

| 你需要 | 说明 |
|--------|------|
| 一台电脑 | Windows / macOS / Linux 均可 |
| 网络连接 | 下载工具和依赖 |
| 30 分钟时间 | 一口气走完，别中断 |

**不需要**：任何编程基础、任何付费软件、任何特殊硬件。

---

## 二、安装 Node.js（JavaScript 运行环境）

Node.js 是运行 JavaScript 代码的工具，**所有前端项目都依赖它**。

### 2.1 下载

打开浏览器访问：https://nodejs.org

两个版本选哪个？

| 版本 | 标识 | 适合谁 |
|------|------|--------|
| LTS（长期支持版） | `20.18.x` 开头的 | **你选这个**，最稳定 |
| Current（最新版） | `22.x` 开头的 | 尝鲜用，新手别碰 |

点击 **LTS** 按钮下载安装包。

### 2.2 安装

=== "Windows"

    1. 双击下载的 `.msi` 文件
    2. 一路点击 **Next**（默认选项全部正确）
    3. 到 `Tools for Native Modules` 这一步时，**勾选**复选框（自动装 Python 和 C++ 编译工具，以后会用上）
    4. 点击 **Install**，等待完成

=== "macOS"

    1. 双击下载的 `.pkg` 文件
    2. 一路 **继续** → **同意** → **安装**
    3. 输入开机密码确认

=== "Linux (Ubuntu/Debian)"

    ```bash
    # 使用 NodeSource 官方源安装 LTS
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

### 2.3 验证安装

打开终端（Windows 按 `Win+R`，输入 `cmd` 回车；macOS 打开 `终端` App）：

```bash
node -v    # 应打印 v20.18.x 或类似
npm -v     # 应打印 10.x.x 或类似
```

!!! success "看到版本号就是成功了"
    如果不显示版本号，关掉终端重新打开再试。还不行的话重启电脑。

---

## 三、安装 VS Code（写代码的编辑器）

### 3.1 下载

打开浏览器访问：https://code.visualstudio.com

点击 **Download**，选你的系统版本。

### 3.2 安装

- **Windows**：双击 `.exe`，勾选"添加到 PATH"和"添加到右键菜单"，一路下一步
- **macOS**：把 `.app` 拖到"应用程序"文件夹
- **Linux**：用 `.deb` 或 `snap` 安装

### 3.3 安装中文插件（可选）

1. 打开 VS Code
2. 按 `Ctrl+Shift+X`（macOS: `Cmd+Shift+X`）打开扩展商店
3. 搜索 `Chinese`，安装"Chinese (Simplified) Language Pack"
4. 重启 VS Code

---

## 四、写出你的第一个网页

### 4.1 创建项目文件夹

1. 在电脑上找一个你记得住的位置（比如桌面），新建文件夹 `my-first-site`
2. 文件夹里右键 → **通过 Code 打开**（或打开 VS Code → 文件 → 打开文件夹 → 选择 `my-first-site`）

### 4.2 创建 HTML 文件

在 VS Code 左侧资源管理器中，右键 → **新建文件** → 命名为 `index.html`

输入以下内容：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>我的第一个网页</title>
  <style>
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      max-width: 600px;
      margin: 60px auto;
      padding: 20px;
      background: #0d1117;
      color: #c9d1d9;
    }
    h1 { color: #58a6ff; }
    .card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 20px;
      margin: 16px 0;
    }
    button {
      background: #238636;
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
    }
    button:hover { background: #2ea043; }
    .count { font-size: 32px; font-weight: bold; color: #f0883e; }
  </style>
</head>
<body>
  <h1>Hello World!</h1>
  <p>这是我的第一个网页，它包含 HTML（结构）、CSS（样式）、JavaScript（交互）。</p>

  <div class="card">
    <p>你已经点击了：</p>
    <div class="count" id="counter">0</div>
    <p>次</p>
    <button onclick="increment()">点我 +1</button>
  </div>

  <script>
    let count = 0;
    function increment() {
      count++;
      document.getElementById('counter').textContent = count;
    }
  </script>
</body>
</html>
```

### 4.3 在浏览器中打开

在 VS Code 中右键 `index.html` → **Copy Path**（复制路径），打开浏览器，把路径粘贴到地址栏回车。

或者：按 `Ctrl+O`（macOS: `Cmd+O`）直接打开文件。

!!! tip "你应该看到什么"
    一个深色背景的页面，标题"Hello World!"，下面有一个计数器，点击按钮数字会 +1。

---

## 五、用 Vite + Vue 3 创建你的第一个项目

上面的 HTML 文件是"手写原生"模式。真正开发时，我们会用**构建工具**帮我们打包和管理项目。

### 5.1 创建项目

打开终端（在 VS Code 里按 `` Ctrl+` `` 或菜单 → 终端 → 新建终端），输入：

```bash
npm create vite@latest my-vue-app -- --template vue
```

按提示操作：回车确认项目名，然后 `cd my-vue-app`，再装依赖：

```bash
cd my-vue-app
npm install
npm run dev
```

终端会打印一行类似：

```
  ➜  Local:   http://localhost:5173/
```

在浏览器打开 `http://localhost:5173/` —— 你看到了一个 Vue 3 的欢迎页！

### 5.2 改一改代码，看热更新

保持 `npm run dev` 运行中，打开 `src/App.vue`，把 `<template>` 里的内容改成：

```vue
<template>
  <div class="app">
    <h1>这是我的第一个 Vue 项目</h1>
    <p>计数器：{{ count }}</p>
    <button @click="count++">+1</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>

<style>
.app {
  text-align: center;
  margin-top: 60px;
  font-family: system-ui;
}
button {
  background: #42b883;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}
</style>
```

保存（`Ctrl+S`），切到浏览器——**不用刷新**，页面自动更新！

!!! success "这就是"热更新"（HMR）"
    改动代码立即在浏览器看到效果，现代前端开发的标准体验。

---

## 六、如果你想用 React 而不是 Vue

```bash
npm create vite@latest my-react-app -- --template react
cd my-react-app
npm install
npm run dev
```

打开 `http://localhost:5173/` 就能看到 React 项目了。同样的热更新体验。

---

## 七、下一步：把你的页面放到网上让别人访问

你已经有了一个在本地跑的网站。下一步是**部署**——让它能被任何人在任何地方访问。

前往 [部署总览](../deployment/index.md)，了解如何免费部署你的项目。

---

## 八、完整学习路径一览

```
你在这里 →
 │
 ├─ 1. 🏃 新手第一课（本篇，30分钟）
 │
 ├─ 2. 📚 [HTML5/CSS3 完整学习](../html-css/index.md)（半天~1天）
 │
 ├─ 3. 📚 [JavaScript 基础](../js/foundation.md)（2~3天）
 │
 ├─ 4. 📚 [Vue3 vs React 上手实战](../framework-compare/getting-started.md)（1天）
 │
 ├─ 5. 🏗️ [CRUD 全栈小应用](../fullstack/crud-project.md)（1~2天，前后端打通）
 │
 ├─ 6. 🚀 [部署上线](../deployment/index.md)（半天，让项目公网可访问）
 │
 └─ 7. 🎯 [完整学习路线](../roadmap.md)（按需深挖）
```

---

## 九、常见问题

### Q: 安装 Node.js 时报错怎么办？

- Windows：右键安装包 → **以管理员身份运行**
- macOS：确认系统版本 ≥ 10.15
- 如果报"权限不足"：关掉终端重开，或重启电脑

### Q: `npm` 命令提示"不是内部或外部命令"？

- 安装完 Node.js 后需要**重启终端**（甚至重启电脑）
- 再不行：重装 Node.js，确认安装路径被加入系统 PATH

### Q: `npm install` 很慢怎么办？

换国内镜像源：

```bash
npm config set registry https://registry.npmmirror.com
```

### Q: 我不想装 Node.js，能不能直接在浏览器里写代码？

可以！打开 https://codepen.io/pen/ ，直接在浏览器里写 HTML/CSS/JS，免费免安装。但后面做项目仍然需要 Node.js。

### Q: Vite 项目怎么打包发布？

```bash
npm run build     # 生成 dist/ 文件夹
npm run preview   # 本地预览打包后的效果
```

把 `dist/` 文件夹的内容上传到服务器就可以发布。详见 [前端部署指南](../deployment/frontend.md)。

---

> **下一篇**：[HTML5/CSS3 完整学习](../html-css/index.md) | **部署**：[部署总览](../deployment/index.md) | **路线**：[知识库大纲与路线](../roadmap.md)
