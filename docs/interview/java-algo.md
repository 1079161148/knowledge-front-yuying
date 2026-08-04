# ☕ Java 面试算法速览

> Java 后端 / AI 应用岗校招与社招的**算法与数据结构**高频考点速览。本仓库 [Java 学习路线](../java/index.md) 补「能力」，本篇补「刷题与应试」。
> 答案以 **LeetCode 题型规律 + 《剑指 Offer》+ Java 官方集合框架** 为准；代码用 Java 17 语法（增强 switch、`var`、Stream 适度）。
>
> 📌 **适用版本 / 更新日期**：Java 17+；最后更新 **2026-08**。

!!! abstract "怎么用本篇"
    1. 先过 §1 复杂度与 §2 必备数据结构，建立"选什么结构"的直觉。
    2. 按题型（§3-§11）刷对应 LeetCode 标签，每类先背模板再刷 5-10 道。
    3. 手写代码注意**边界（空/单元素/溢出）**与**空间优化**，面试官常卡这两点。
    4. 真机手写优先用 `ArrayList`/`HashMap`/`Deque`（`LinkedList` 作栈/队列），别自己造轮子。

---

## 1. 时间/空间复杂度（必背）

| 复杂度 | 典型场景 | 例子 |
|--------|----------|------|
| O(1) | 数组随机访问、哈希读写 | `arr[i]`、`map.get(k)` |
| O(log n) | 二分、平衡树、堆 | 二分查找、PriorityQueue |
| O(n) | 单遍扫描、哈希聚合 | 两数之和（哈希） |
| O(n log n) | 快排/归并、堆排序 | `Arrays.sort()`（双轴快排/归并） |
| O(n²) | 双重循环、冒泡 | 暴力两数之和 |
| O(2ⁿ) / O(n!) | 全排列、子集暴搜 | 回溯无剪枝 |

!!! tip "面试常问"
    - `Arrays.sort()` 基本类型用**双轴快排** O(n log n)，对象用**TimSort**（归并变种）。
    - 递归空间 = 递归深度；快排平均 O(log n) 栈深，最坏 O(n)（已随机化规避）。

---

## 2. 必备数据结构（Java 对应类）

| 结构 | Java 实现 | 面试要点 |
|------|-----------|----------|
| 动态数组 | `ArrayList` | 扩容 1.5 倍（旧+旧>>1）、随机访问 O(1) |
| 双向链表 | `LinkedList` | 作栈/队列/`Deque`；随机访问 O(n) |
| 哈希表 | `HashMap` | 数组+链表/红黑树（>8 转树）、负载因子 0.75、初始 16 |
| 有序映射 | `TreeMap` | 红黑树、键有序、O(log n) |
| 堆 | `PriorityQueue` | 默认小顶堆；大顶堆用反向比较器 |
| 栈 | `Deque`（`ArrayDeque`） | 别用旧 `Stack`（同步、慢） |
| 队列 | `Queue` / `Deque` | `offer`/`poll` 不抛异常 |
| 并查集 | 自行实现 | `find`（路径压缩）+ `union`（按秩） |
| 前缀树 | 自行实现 `TrieNode[]` | 字符串前缀匹配 |

!!! danger "HashMap 红黑树"
    链表长度 >8 且桶数 ≥64 转红黑树，<6 退化为链表（[Java 集合深入](../java/java-collections-deep.md)）。面试常问为什么 8（泊松分布阈值）。

---

## 3. 数组与字符串

#### Q1：两数之和（LeetCode 1）
- 哈希一次遍历：`key=数值, value=下标`，边走边查补数，O(n) 空间换时间。
```java
public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> m = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        if (m.containsKey(target - nums[i])) return new int[]{m.get(target - nums[i]), i};
        m.put(nums[i], i);
    }
    return new int[]{};
}
```

#### Q2：盛水容器 / 接雨水（双指针）
- 盛水容器：左右指针，移**矮边**（`height[left] < height[right]` 移 left），因移高边不可能增大面积。

#### Q3：字符串反转 / 异位词
- 反转用双指针或 `new StringBuilder(s).reverse()`。
- 异位词：数组计数（26 长度）或排序后比较；进阶用 `HashMap` 计数。

!!! tip "边界"
    数组题先问清：**是否有序**（决定能否二分/双指针）、**能否改原数组**、**有无重复**。

---

## 4. 链表

#### Q4：反转链表（LeetCode 206）
```java
public ListNode reverse(ListNode head) {
    ListNode prev = null, cur = head;
    while (cur != null) { ListNode nxt = cur.next; cur.next = prev; prev = cur; cur = nxt; }
    return prev;
}
```

#### Q5：快慢指针经典题
- 判环（Floyd）：快 2 步慢 1 步，相遇则有环；入口=头与相遇点同速前进交点。
- 找中点：`slow=head, fast=head`，`fast` 走 2 步，`slow` 走 1 步，停时 `slow` 为中/上中。
- 倒数第 k 个：快先走 k 步，再同速，快到尾慢即答案。

!!! danger "指针题第一原则"
    先保存 `next` 再改 `cur.next`，否则断链；处理 `null` 头/单节点。

---

## 5. 哈希与计数

#### Q6：Top K 高频元素（LeetCode 347）
- `HashMap` 计数 → `PriorityQueue`（小顶堆，容量 k）维护 Top K → O(n log k)。
- 或桶排序（频率范围有限时 O(n)）。

#### Q7：最长无重复子串（LeetCode 3）
- 滑动窗口 + `HashSet`/`HashMap`（记录字符最后位置），窗口左边界 `left = max(left, last[c]+1)`。

---

## 6. 二叉树

#### Q8：遍历（递归 + 迭代）
- 前/中/后序递归一句话；迭代用栈。**中序**非递归是 BST 验有序基础。
- 层序用 `Queue`（BFS），常用于"之字形""每层平均值"。

#### Q9：BST / 最近公共祖先 / 对称树
- BST：左 < 根 < 右，中序有序；查找可二分剪枝。
- 最近公共祖先：递归，左右各找到或节点自身即祖先。

#### Q10：最大深度 / 直径
- 深度：`1 + max(左深, 右深)`；直径 = `左深 + 右深` 最大值（后序遍历顺带算）。

!!! tip "树的题模板"
    90% 用**递归（DFS）**，先想"当前节点要返回什么给父节点"；需要层次信息用 BFS。

---

## 7. 二分查找

#### Q11：标准二分（LeetCode 704）
```java
int lo = 0, hi = n - 1;
while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;        // 防溢出，别写 (lo+hi)/2
    if (a[mid] == t) return mid;
    else if (a[mid] < t) lo = mid + 1;
    else hi = mid - 1;
}
```
- **变体**：找左边界（`nums[mid] >= t` 时 `hi=mid-1`，最后校验 `lo`）、旋转数组找最小值、在答案域二分（如"最少吃香蕉速度"）。

!!! danger "二分三大坑"
    1. `mid` 溢出用 `lo + (hi-lo)/2`；2. `lo<=hi` 还是 `<` 看边界定义；3. 死循环多半是 `mid` 未推进，改 `lo=mid+1`/`hi=mid-1`。

---

## 8. 动态规划

#### Q12：背包 / 子序列
- **0-1 背包**：`dp[i][w] = max(dp[i-1][w], dp[i-1][w-wt]+val)`，可滚成一维 `w` 倒序。
- **最长递增子序列（LIS）**：`dp[i]=max(dp[j]+1)`，或贪心+二分 O(n log n)。
- **编辑距离**：`dp[i][j]` 由左上/左/上转移（替换/删/增）。

#### Q13：打家劫舍 / 斐波那契
- 状态转移 `dp[i] = max(dp[i-1], dp[i-2]+nums[i])`，空间优化只留前两个。

!!! tip "DP 三步法"
    1. 定义 `dp` 含义；2. 写转移方程；3. 定 base case + 遍历顺序。卡住就先写暴力递归再记忆化（`Map` 缓存）。

---

## 9. 回溯（DFS + 剪枝）

#### Q14：全排列 / 子集 / 组合（LeetCode 46/78/77）
- 模板：`choose → backtrack → unchoose`；子集不传 `start` 去重，组合传 `start` 避免重复。
- 去重：先排序，`used[i]` 或 `i>start && nums[i]==nums[i-1]` 跳过同层。

#### Q15：N 皇后 / 数独
- 用 `boolean[]` 记录列/对角占用，逐行放，冲突即剪枝。

!!! danger "回溯易爆栈"
    深度大时递归可能 `StackOverflow`；能转迭代或加剪枝优先。面试写回溯先保证正确，再谈优化。

---

## 10. 堆、栈、单调结构

#### Q16：滑动窗口最大值（LeetCode 239）
- 单调队列（双端队列存下标，保证队首最大），O(n)。

#### Q17：合并 K 个有序链表（LeetCode 23）
- `PriorityQueue` 小顶堆存各链表头，每次取最小，O(n log k)。

#### Q18：有效的括号（LeetCode 20）
- 栈：遇左压栈，遇右弹栈匹配；用 `ArrayDeque<Character>`。

---

## 11. 并查集与图

#### Q19：岛屿数量（LeetCode 200）
- DFS/BFS 淹没法，或并查集把相邻陆地 `union`，统计连通块。
- 并查集模板：`parent[i]=i`；`find` 路径压缩；`union` 按秩合并，近 O(1)。

#### Q20：拓扑排序（课程表 LeetCode 207）
- 入度表 + 队列 BFS；能排完所有节点则无环（可学）。

---

## 12. 高频套路速记表

| 题型 | 首选结构 | 关键词 |
|------|----------|--------|
| 两数/三数之和 | HashMap | 补数、去重 |
| 子数组/子串最值 | 滑动窗口 / 前缀和 | 连续、无重复 |
|  Top K | 堆 | 频次、第 K 大 |
| 单调性最值 | 单调栈/队列 | 左/右第一个更大 |
| 有序查找 | 二分 | 旋转、边界 |
| 树 | 递归/DFS | 深度、LCA、BST |
| 选择/排列/组合 | 回溯 | 子集、去重 |
| 最优子结构 | DP | 背包、LIS、编辑距离 |
| 连通/无环 | 并查集 / 拓扑 | 岛屿、课程表 |

---

## 13. 刷题策略（校招冲刺）

1. **先分类刷**：按本篇 §3-§11 标签各 5-10 道，建立题型直觉。
2. **再刷 Hot 100 / 剑指 Offer**：LeetCode [热题 100](https://leetcode.cn/studyplan/top-100-liked/) + [剑指 Offer](https://leetcode.cn/studyplan/lcof/) 是高频母题。
3. **限时手写**：白板/记事本写，不依赖 IDE 自动补全；重点练边界与命名。
4. **讲清楚**：每题能说"为什么选这个结构、复杂度多少、能否优化空间"。
5. **AI 应用岗附加**：常问"大模型输出如何后处理/RAG 检索排序"，算法是底座，业务理解 + [Spring AI](../java/spring-ai.md) 同样重要。

!!! tip "与 Java 路线配合"
    算法是面试敲门砖；[Java 学习路线](../java/index.md) 的工程能力（Spring Boot / 并发 / JVM）决定你入职后能不能干活。两者都要。

---

## 14. 自测清单

- [ ] 能手写快排 / 归并并说复杂度
- [ ] 两数之和、反转链表、二分、LIS、全排列 闭眼写
- [ ] 二叉树三种遍历（递归+迭代）无卡顿
- [ ] 知道 HashMap / PriorityQueue / 并查集 底层与坑
- [ ] 刷题 ≥ 150 道且覆盖本篇所有题型
