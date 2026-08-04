# 海量 Excel 流式导入

运营后台导入几万行 Excel 是日常，但 `POI` 的 `XSSFWorkbook` 一次性读进内存 → **OOM**。必须用**流式（SAX/事件模型）**读取，边读边校验边落库。

## 一、选型：用户模型（SAX） vs 事件模型

| 方式 | 内存 | 速度 | 适用 |
|------|------|------|------|
| `XSSFWorkbook`（DOM） | 爆（~10倍文件） | 快 | <1万行，简单 |
| **`XSSF and SAX`（eventmodel）** | 低 | 中 | **10万+ 行必选** |
| `EasyExcel`（阿里，封装 SAX） | 低 | 中 | **生产首选**，注解驱动 |

> **结论**：新项目直接用 **EasyExcel**（封装了 SAX，listener 流式处理），别手写 SAX 解析。

## 二、EasyExcel 流式读（最简且稳）

```java
@Data
public class UserRow {
    @ExcelProperty("姓名") private String name;
    @ExcelProperty("手机号") private String phone;
    @ExcelProperty("部门") private String dept;
}

// 读 10 万行也不 OOM：逐行回调，批量落库
EasyExcel.read(file, UserRow.class, new AnalysisEventListener<UserRow>() {
    private final List<UserRow> batch = new ArrayList<>(1000);

    @Override
    public void invoke(UserRow row, AnalysisContext ctx) {
        validate(row, ctx.readRowHolder().getRowIndex());  // 行号用于报错定位
        batch.add(row);
        if (batch.size() >= 1000) flush();                  // 攒批落库
    }

    @Override
    public void doAfterAllAnalysed(AnalysisContext ctx) { flush(); }

    private void flush() {
        if (batch.isEmpty()) return;
        userMapper.batchInsert(batch);
        batch.clear();
    }
}).sheet().doRead();
```

## 三、写也别一次性（导出大文件）

```java
// 分页查 + 流式写，避免内存堆积
try (ExcelWriter w = EasyExcel.write(os, UserRow.class).build()) {
    WriteSheet sheet = EasyExcel.writerSheet("用户").build();
    for (int p = 0; ; p++) {
        List<UserRow> list = userMapper.page(p, 5000);
        if (list.isEmpty()) break;
        w.write(list, sheet);
    }
}
```

## 四、踩坑清单

- **DOM 模式读大文件 OOM**：`new XSSFWorkbook(file)` 直接爆 → 必须 SAX/EasyExcel 流式。
- **逐行 insert 慢**：10 万行单条插几十秒 → **攒批（1000/批）`batchInsert`**，提速 10 倍。
- **失败行定位难**：报错只说"数据异常" → 用 `context.readRowHolder().getRowIndex()` 带行号，输出失败 Excel（原行 + 错误原因）。
- **类型转换静默失败**：手机号被读成 double（1.38E+10）→ `@ExcelProperty` 配 `converter` 强制读成字符串。
- **空行/合并单元格**：表头合并、中间空行 → 用 `invokeHeadMap` 处理表头，空数据跳过校验。
- **事务过大**：整文件一个事务 → 分批事务，部分失败可重导失败行。
- **日期格式五花八门**：不同客户端导出日期格式不一 → 自定义 `Converter` 兜底多种格式。
- **xls（HSSF）行数上限 65536**：老格式超了报错 → 统一要求 xlsx，或自动分流。

## 五、导入结果回写（最佳实践）

导入后生成两份：**成功数/失败数统计** + **失败行 Excel**（原数据 + 错误列 + 原因），运营下载修正重导。这是"导入体验好"的分水岭。

## 六、面试 STAR

- **难点**：运营导入 20 万行 Excel 直接 OOM 把服务拖垮 → 换 EasyExcel 流式 + 1000 批落库 + 失败行回写，导入从崩溃到 30s 完成。
- **亮点**：导入结果生成"失败行 Excel"，运营自助修正，工单量降 70%。
- **坑**：手机号被读成科学计数法，加字符串 Converter 后修复。
