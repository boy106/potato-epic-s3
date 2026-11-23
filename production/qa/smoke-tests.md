# 土豆史诗 · 黑盒烟雾测试用例（30 条）

- 版本：W1a · 2026-11-21 · 严守真
- 执行环境说明：沙箱无头 Chromium WebGL2 不可用（环境限制），自动化用例覆盖「加载/资源/控制台/DOM/存档/构建卫生」层；3D 对局与大厅层需真实浏览器人工执行。
- 自动化脚本：`production/qa/smoke/smoke_run.py`（Playwright，chromium=/usr/bin/chromium）
  - 运行：`cd production/qa/smoke && python3 smoke_run.py [BASE_URL]`（默认 `http://127.0.0.1:8813/index.html`，需先起静态服务指向 build 解压目录）
  - 结果：stdout + `production/qa/evidence/smoke_results.json`
- 用例语义：断言**期望的正确行为**。当前因 D-001/002/003/006/008 存在，对应用例 FAIL，即为回归门控；缺陷修复后自动转 PASS。

## A 组 · 自动化（Playwright，17 条）

| ID | 名称 | 前置条件 | 步骤 | 预期结果 | 缺陷映射 |
|---|---|---|---|---|---|
| S-01 | 页面可达与标题 | 静态服务指向 build 根目录 | GET `/index.html` | HTTP 200，`<title>`=土豆史诗 | — |
| S-02 | 核心脚本与 mod 入口可达 | 同上 | 逐一 GET pack1-4、mods/index.json、xzguns(data/code/bundle/tiles.webp)、xzrange(data/code) | 全部 200 | — |
| S-03 | mods/index.json 资源完整性 | build 在本地磁盘 | 遍历 index.json 各 mod 的 files，核对磁盘存在 | 声明文件与磁盘 100% 一致 | — |
| S-04 | 控制台无未预期错误/警告 | 浏览器加载页面，等待 8s | 收集 console error/warning，剔除环境白名单（WebGL2）与已归类缺陷告警 | 无未预期条目 | — |
| S-05 | `js/skins_data.js` 可达 | 同 S-01 | GET `/js/skins_data.js` | 200（当前 404=FAIL） | D-001 |
| S-06 | favicon 可达 | 同 S-01 | GET `/favicon.ico` | 200（当前 404=FAIL） | D-006 |
| S-07 | 无 missing tile 告警 | 浏览器加载至贴图初始化 | 收集含 `missing tile` 的 console warning | 0 条（当前 4 条=FAIL） | D-002 |
| S-08 | boot 引导界面结构渲染 | 浏览器加载页面 | 检查 `#boot` 可见、`.bt-logo svg` 存在、`#bootbar` 存在 | 三者皆真 | — |
| S-09 | 加载流程有明确终态 | 加载并等待 ≥8s | 读 `#bootpct`/`#boottext`/`#err` 可见性 | 达到 100%/「准备就绪」，或显示可见错误提示（当前卡 97% 且错误被遮=FAIL） | D-003/D-004 |
| S-10 | 错误提示不被 logo 遮挡 | 同 S-09 | 取 `#err` 与 `.bt-logo` boundingRect 求交 | 无重叠（当前重叠=FAIL） | D-003 |
| S-11 | WebGL2 能力探测路径安全 | 任意浏览器 | 调 `canvas.getContext('webgl2')`，确认失败被捕获 | 返回 true/false，不抛未处理异常 | — |
| S-12 | 大厅功能全局入口齐备 | 脚本全部执行完毕 | 检查 window 上 PotatoSettings/Checkin/Ranked/Custom/Hub/Wardrobe/GunSkins | 7 个入口全部定义 | — |
| S-13 | 启动不污染 localStorage | 清空存储后加载页面 | 读 `Object.keys(localStorage)` | 启动阶段 0 个 key | — |
| S-14 | 存档 key 命名规范 | build 在本地磁盘 | 静态扫描 pack4 的 localStorage key 字面量 | 全部以 `mcjs-` / `potato` 前缀 | — |
| S-15 | mods/index.json 结构合法 | build 在本地磁盘 | 校验 mods 数组、每项含 id/name/files | 合法 | — |
| S-16 | 无开发机残留地址 | build 在本地磁盘 | 扫描 pack1-4 中 `127.0.0.1:8842` 等本地地址 | 0 处（当前 pack4 有 1 处=FAIL） | D-008 |
| S-17 | 两次加载控制台输出稳定（flaky 初筛） | 两次全新加载 | 对比两次 console (type,text) 集合 | 完全一致 | — |

## M 组 · 需真实浏览器人工执行（12 条 + 1 条预留 = 13 条）

> 前置（所有 M 组）：桌面 Chrome/Edge 最新版，WebGL2 + 硬件加速开启；另备一台手机（M-30 用）。

| ID | 名称 | 前置条件 | 步骤 | 预期结果 | 关联 |
|---|---|---|---|---|---|
| S-18 | 大厅可达与布局 | 真机浏览器 | 打开页面，等待 boot 动画结束 | 进入大厅；菜单卡片齐全（天梯/淘汰赛/乱斗/人机/靶场/设置等）；无 JS error | — |
| S-19 | 大厅 logo 正常显示 | 同 S-18 | 观察左上 logo 板 | logo 图完整显示，无碎图/空框；boot→大厅 logo 飞行动画结束后 logo 仍在 | D-005 |
| S-20 | 段位图标显示 | 有历史段位分的账号 | 打开天梯/排行界面 | 各段位图标为位图而非兜底占位；若 404 兜底生效则无碎图 | D-005 |
| S-21 | 大厅背景图显示 | 同 S-18 | 观察大厅背景 | 背景为 bg.jpg 或程序化兜底，无黑屏/碎图 | D-005 |
| S-22 | 靶场教学完整流程 | 大厅可进 | 大厅 → 靶场 → 按教学引导拿枪、射击、完成引导 | 全程无阻断；铜门方块（若有）贴图正常 | D-002 |
| S-23 | 1V1 天梯一局完整流程 | 登录态 | 天梯 → 匹配 → 打完一局 → 结算 | 五局三胜制提示正确；结算加分/段位变化正确 | — |
| S-24 | 2V2 打满五局 | 双方队友 | 天梯 2V2，打到 3:1 或 3:2 前故意拖到第五局 | 第五局强制进行（打满五局规则）；比分与结算正确 | — |
| S-25 | 皮肤系统与持久化 | 大厅可进 | 衣柜 → 查看预设列表 → 应用涂装 → 刷新页面 | 预设列表**非空**（D-001 修复后）；涂装选择持久化 | D-001 |
| S-26 | 每日签到 | 大厅可进 | 签到页 → 领取 → 次日重复 | 领取成功提示；同日重复领取被拒；跨日可再领 | — |
| S-27 | 好友约战邀请码 | 两个账号 | A 创建约战 → 复制邀请码 → B 输入加入 | B 成功进入 A 的对局/房间 | OBS-1 |
| S-28 | 创建房间/队伍与联机 | 后端可达 | 创建房间 → 邀请 → 开始对局 | rooms/pm 接口正常；断网时给出友好错误而非卡死 | OBS-1 |
| S-29 | 设置修改持久化 | 大厅可进 | 设置 → 改灵敏度/画质 → 完全刷新页面 | 重启后设置保留（localStorage `potato-settings`） | — |
| S-30 | 【预留挂载点】陀螺仪（新功能） | 移动端浏览器 | 待功能落地后填入：三档开关切换、双灵敏度滑条（水平/垂直）边界值与持久化用例 | 待功能规格（GDD/Story 验收标准）到位后由测试团队补充，勿臆造验收点 | 新功能 |

## 覆盖与不覆盖

- 覆盖：构建完整性、资源可达性、控制台卫生、boot 流程终态与错误呈现、全局入口、存档卫生、flaky 初筛、构建卫生（残留地址）。
- 不覆盖（原因）：3D 渲染/帧率、射击手感、联机对战、段位数值 —— 沙箱 WebGL2 不可用且无后端测试账号；见 M 组人工用例与《test-report.md》未覆盖范围章节。
