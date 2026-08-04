# 可编辑树形表格

**难点**：部门预算、科目填报、BOM 物料这类"父行=子行汇总"的树形表，既要可展开/收起、又要在单元格内编辑、还要父行实时汇总校验。中后台高频但组件库默认不支持"可编辑 + 树 + 汇总"三合一。

**最佳实践**：树结构用「扁平化 + depth 字段 + open 标志」渲染，避免递归 DOM；父行汇总在子行改动时重算；编辑用失焦保存，避免每键 re-render 丢光标。

<iframe src="../../../demos/pc-editable-tree-table.html" height="440" style="width:100%;border:1px solid #30363d;border-radius:8px"></iframe>

**关键点（生产级细节）**

- **树扁平化**：把 `children` 拍平成带 `depth` 的数组，展开/收起只切 `open` 标志，渲染层不用递归，虚拟滚动也好接。
- **父行汇总**：子行 `input` 改动 → 重算父行 budget/actual → 只更新父行那两个单元格（`document.activeElement` 判断避免覆盖正在编辑的框，防光标丢失）。
- **双向校验**：父行合计 ≠ 子行之和时标红报警（预算超支预警），提交前整树遍历校验。
- **虚拟滚动 + 树**：`el-table-v2` 的树形要配合 `getRowHeight` 动态高度。

**踩坑**

- 编辑时整表 `render` 会把正在输入的 `<input>` 重建 → 光标跳到行首甚至丢失 → 必须细粒度更新或失焦保存。
- 树展开状态要存 `Map<id, boolean>`，分页/筛选后恢复，别每次重置为全展开。
- 深层树（>5 层）缩进用 `padding-left: depth*N` 即可，别嵌套 DOM。
