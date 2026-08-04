# 🤝 贡献知识库

> 本页与仓库根 `CONTRIBUTING.md` 内容一致，供站点内直接阅读。最后更新 **2026-08**。

欢迎！我们感谢您对本知识库项目的贡献。

## 📋 指南

在贡献之前，请阅读以下指南：

### 1. 文件格式
所有内容必须使用 **Markdown (.md)** 格式编写。
- 使用一致的标题层级（`#` 为主标题，`##` 为章节等）

### 2. 命名规范
- 文件名使用 **kebab-case**：`my-awesome-documentation.md`
- 避免在文件名中使用空格和特殊字符

### 3. 内容结构
每个新文档建议包含：概述 / 详情 / 参考，并遵循本站统一风格：
- 技术定义以**官方文档为准**，不编造；
- AI / SDK 相关篇章请在篇头加 **📌 适用版本 / 更新日期** 标注，降低时效失真；
- 关键陷阱用 `!!! danger/tip/warning` 块点出"易踩的坑"。

### 4. Pull Requests
- 创建描述性提交消息
- 解释更改的目的
- 确保 `mkdocs build --strict` 通过（无断链、无孤儿页）

---

## 🛠️ 如何贡献

### Fork 工作流程

```bash
# 1. 在 GitHub 上 Fork 仓库
# 2. 克隆您的 fork
git clone https://github.com/your-username/knowledge-front-yuying.git
cd knowledge-front-yuying

# 3. 创建一个新分支
git checkout -b feature/my-new-doc

# 4. 进行更改并提交
git add .
git commit -m "添加关于 X 的新文档"

# 5. 推送到您的 fork
git push origin feature/my-new-doc

# 6. 在 GitHub 上创建一个 pull request
```

---

## 📜 行为准则

请注意本项目采用行为准则（Code of Conduct）。通过参与，您同意遵守开源社区通用礼仪与本项目贡献约定。

---

## 疑问？

有关贡献的疑问，请随时提出问题或联系维护人员。
