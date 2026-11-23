# W5b 实现报告 · 陀螺仪（GDD-05）

| 字段 | 值 |
| --- | --- |
| 任务 ID | W5b（P0，用户点名功能） |
| 规格输入 | `docs/gdd/05-gyroscope-spec.md`（唯一输入，14 条验收标准为契约） |
| 实现 | 程基岩 |
| 状态 | 实现完成 · mock 验证 46/46 通过 · 待真机人工验证项见 §6 |
| 验证证据 | `tools/w5b-gyro-evidence.json`（本报告 §5 的机器可读版）、`tools/w5b-gyro-test.py`（可重跑） |

---

## 1. 改动清单

| # | 文件 | 类型 | 内容 |
| --- | --- | --- | --- |
| 1 | `src/js/gyro.js` | **新增** | 陀螺仪模块（~430 行）：调参块 `GYRO_TUNING`、W3C 姿态四元数差分、事件回调只做差分累加、rAF 消费管线（死区→EMA→灵敏度→pitch×0.8→±30°钳制→统一写入口）、三档状态机、iOS 权限流、设置 API、`Game.prototype.frame` 挂钩、visibilitychange/orientationchange 处理、冷启动监听恢复、`_test` 钩子 |
| 2 | `src/js/touch.js` | 接入点（H2） | 新增全局 `lookWrite(g, dYaw, dPitch, src)`（唯一视角写入口，记录 `_lookWriteAt/_lookWriteSrc` 供帧级仲裁）；`TouchControls.movePlay` 的 "look" 分支由内联写入改为调用 `lookWrite`——**公式逐项保留（0.0045×touchLook、invertX/invertY、±90° pitch 钳制），触屏行为零变化** |
| 3 | `src/js/potato.js` | 接入点（设置页） | `PotatoSettings.build()` touch 页「灵敏度」之后新增「陀螺仪」分组：三档分段按钮 + 双灵敏度滑条（10–300，步进 5）+ 辅助说明一行小字 + 「恢复默认」行；对战类对局中整组锁定（标题追加「（对局中锁定）」、控件 disabled） |
| 4 | `src/js/potato.js` | 接入点（控件模板） | `fill()` 新增 `t.seg` 分段控件渲染分支（复用 `.st-row` 网格与 `--i` 入场动画）；滑条 `input` 支持 `enabled===false → disabled` 属性；`mount()` 点击委托新增 `[data-gm]` 分支 |
| 5 | `src/index.html` | 注册 | `js/gyro.js` 插入 `js/touch.js` 之后、`js/perf.js` 之前（依赖：Game/game.js、TouchDevice/lookWrite/touch.js） |
| 6 | `tools/pack-order.json` | 注册 | pack4 在 `js/touch.js` 后插入 `js/gyro.js`（共 103 模块）；`node tools/build.mjs` 重建通过 |
| 7 | `docs/architecture/module-map.md` | 文档 | 清单新增 gyro.js 条目（#76）、pack4 重编号、touch.js 全局增 `lookWrite`、新增 §六（模块契约 + 接入点清单） |
| 8 | `tools/w5b-gyro-test.py` | 新增（测试资产） | Playwright mock 驱动验证脚本（46 项断言，可重跑） |

**未触碰**：`mods/`（xzguns/xzrange 只读参考）；assets/util/worldgen*/blockdata/modapi（无 worker 侧影响）；其余全部既有代码。

---

## 2. 关键实现决策

1. **存储路径（§1.1）**：还原树为单对象序列化（`game.settings` → `potato-settings`），按规格推荐在对象上新增 `gyroMode/gyroSensBase/gyroSensAds` 三字段；缺失/非法值按默认 1/100/100 处理（§1.3），不报错。
2. **H1 开镜唯一事实源**：现成标志已存在——xzguns 的 `XZ.aimAmount(player)`（`player.xz.aimT`，xzguns HUD 自身用它点亮开镜按钮）。陀螺仪直接读取该源（>0.01 判定），**未新建**、**未用 FOV 推断**。XZ 未加载（基础模式）时开镜档永不激活，"总是开启"档不受影响。
3. **H2 统一视角写入口**：触屏滑动的视角写入原本内联在 `movePlay`。提取为 `lookWrite()` 并让触屏与陀螺仪共用——同一入口天然实现 §7.5 帧级仲裁（陀螺仪消费时检查「本次消费以来是否有 touch 来源写入」）。陀螺仪传入的增量已含自身灵敏度/翻转语义（§5.5 首版不做翻转），不继承触屏 invert 设置。
4. **差分数学（§5.6/§7.3）**：不做 alpha/beta/gamma 逐角欧拉差分（横屏 + 万向锁 + 回绕问题多），而是每事件把姿态转四元数（W3C 内旋 Z-X'-Y''），与上一事件求**世界系相对旋转**，投影分解出：绕世界竖直轴分量 = 视角 yaw；绕「设备顶边轴（地心系）」分量 = 视角 pitch。回绕/±180 跳变天然免疫，漂移免疫（§7.3 增量式）。pitch 符号随横握方向自动翻转（按「设备右缘相对天顶方向」判定），左右横握都正确。
5. **帧级仲裁（§7.5）**：代码库无手柄支持（全树 grep 无 gamepad），首版仲裁 = touch > gyro；陀螺仪写入口带 `src:"gyro"` 标记不自我否决。手柄将来接入时在 `lookWrite` 仲裁条件中追加来源即可，架构已预留。
6. **衰减尾（§4.4 可选打磨）**：实现为截止后 80ms 指数衰减尾（K=0.6/帧），仅在「上一帧确实刚消费过增量」时触发（防止对久未消费的陈旧增量补尾——数据停流场景干净退出）。验收按"无跳变无回弹"口径测（§4.4 硬口径），尾部幅度为手感调参项。
7. **toast 计数**：denied toast 会话上限 2 次（§3.2 逐字）；"环境异常" toast 独立计数同样封顶 2（异常环境反复点击防刷屏；规格原文仅"一次性"，此处从紧处理，如需完全逐字可放宽为不设限——一行常量）。
8. **「恢复默认」入口位置（规格偏差声明）**：§2.2 要求"统一走设置页全局「恢复默认」"，但还原树中 PotatoSettings **不存在**全局恢复默认按钮（仅准星组有局部"恢复默认准星"）。为不虚构全局重置语义（会牵连无关设置项），「恢复默认」以一行入口落在陀螺仪分组内，行为完全符合 §2.4（双滑条=100%、档位按授权状态写 1 或 0+toast、**不触发权限弹窗**）。此为**唯一一处规格布局偏差**，理由如上，请主理人/文策渊确认接受或另行安排全局按钮需求。

---

## 3. 14 条验收标准自查

图例：✅ 已验证（本沙箱真跑）｜🧪 mock 验证（合成事件/桩，不依赖真机传感器）｜📱 需真机人工验证

| # | 验收标准 | 结果 | 证据 |
| --- | --- | --- | --- |
| 1 | 设置页「陀螺仪」分组：三档分段 + 双滑条，默认「开镜开启」/100% | 🧪✅ | AC1a–e（DOM 渲染、默认高亮、数值） |
| 2 | 「总是开启」未开镜转手机视角随动、方向正确 | 🧪 合成四元数流验证映射正确（右转=yaw 减、上抬=pitch 增 0.8×）；**物理轴向符号需真机确认** | AC2a/b；§6 待真机 |
| 3 | 「开镜开启」未开镜不动/开镜生效/收镜立即停（无跳变无回弹） | 🧪 | AC3a/b/c（-10° 生效、收镜 0 增量、无回弹） |
| 4 | 基础/开镜灵敏度独立（100% vs 200% → 2 倍 ±10%） | 🧪 | AC4/AC4b（ratio=2.00） |
| 5 | 桌面端/无传感器整组隐藏 + 无报错 | ✅ | A3/A4/AC5a/b（桌面上下文：无监听、组隐藏、pageerror=0） |
| 6 | iOS 首次选非关闭档：弹窗即时、授权生效、冷启动保持 | 🧪（granted 桩）+ 冷启动恢复已实现（存储直读恢复监听）；真机弹窗时序 📱 | AC6/AC6b；§6 |
| 7 | 拒绝 → 回退「关闭」+ toast（§3.3 逐字）+ 重进显示关闭 | 🧪 | AC7a/b（文案逐字比对） |
| 8 | 权限请求仅在点选回调内；加载/恢复默认不触发 | 🧪 | AC8a（调用计数=1）、AC8b（恢复默认计数不变+写 0+toast） |
| 9 | 暂停/切后台不生效；恢复后前 2 事件丢弃无瞬移 | 🧪 | AC9（hidden 挂起、dropCount=2 消费、恢复后正常） |
| 10 | 死亡/观战不影响；复活自动恢复 | 🧪 | AC10（deathTime/health/spectator 三态） |
| 11 | 甩机单帧 ≤30° 钳制 | 🧪 | AC11（100°@300% → 30°） |
| 12 | 手柄摇杆同帧不叠加，松开恢复 | 🧪（以触屏写入验证仲裁；代码库无手柄源） | AC12 |
| 13 | 对战对局锁定 / 靶场实时调参 / 退出保持 | 🧪（`XZ.match.on` 桩切换） | AC13a/b |
| 14 | 10 分钟无帧率劣化；回调内无 DOM/渲染操作 | 🧪 微基准（事件回调 4.8µs/个、帧消费 5.8µs/帧）+ 回调代码仅差分/入队（走查）；**10 分钟真机对照需真机** | AC14；§6 |

分布：🧪 mock 验证 12 项（含 2 项叠加真实页面加载 ✅）｜📱 需真机 2 项（AC2 物理方向、AC6 系统弹窗时序、AC14 长时对照——严格说 3 处子项）。

---

## 4. mock 驱动验证覆盖的逻辑

运行环境：Playwright chromium（`--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --no-sandbox`），8814 端口静态服务 `src/index.html`。

- **真实页面级**：双上下文（桌面无触屏 / Android 手机模拟），全 103 脚本加载 pageerror=0；`Game.prototype.frame` 包装链验证（调用 frame → `Gyro._test.state.lastGame` 被置位，确认 gyro 在活动调用链内，与 net.js 等后加载包装共存）。
- **设置页 DOM 级**：PotatoSettings 实例化 → 分组渲染/默认态/分段点击/滑条 input 事件/步进吸附/置灰联动/恢复默认，全部走真实 DOM 事件委托路径。
- **权限流**：`DeviceOrientationEvent.requestPermission` 桩（granted/denied/同步抛错三态），验证同步调用时机、会话计数、无中间态 UI、无权限环境直接生效、调用计数。
- **传感器数据级**：合成 `deviceorientation` 事件（构造姿态四元数 → ZXY 反解欧拉角 → `DeviceOrientationEvent` 派发）驱动完整 onOrient → frameTick 管线；`_test.pushDelta` 注入差分驱动消费管线单元（死区/EMA/钳制/仲裁/状态机各态）。每场景独立复位状态机（`_test.reset()`）。
- **微基准**：600 事件连发 + 600 帧消费，事件回调 ≈4.8µs、帧消费 ≈5.8µs（余量对 AC14 的 <1ms/帧 指标充足）。

---

## 5. 已知限制与风险

1. **物理轴向符号（最大残留风险）**：yaw/pitch 分解的数学在四元数域自洽并有 mock 断言，但「右转手机=yaw 减、上抬=pitch 增」的最终符号依赖 W3C 设备系约定与引擎 yaw 约定的匹配，**必须真机横屏一次确认**。若反了，只需翻转 `GYRO_TUNING` 增加 `SIGN_YAW/SIGN_PITCH` 常量（当前内联在 `frameTick` 的 `yawRight=-S.emaY` / `dPitch=-ap` 两处，集中可调）。
2. **iOS 真机权限流**：`requestPermission` 桩无法覆盖系统级「设置→Safari→动作」关闭、webview 二次进场的静默 granted 等真实行为（§3.4 已按规格走 denied 分支，无独立路径）。
3. **Toy webview 传感器裁剪**（§7.2）：已实现 1.5s 无有效数据静默挂起 + `gyroNoSensor` 冷启动隐藏 + 收到数据自愈清除；真机裁剪行为需实测。
4. **对局内锁定文案**：锁定通过标题后缀「（对局中锁定）」+ 控件 disabled 实现；若测试/运营侧希望更醒目的遮罩样式，属 UI 打磨，不改逻辑。
5. **衰减尾参数**：80ms/K=0.6 为手感预估值；测试环境虚拟连帧会放大累计幅度（真实 60Hz 下约等于“末帧速度再延续 ~24ms”），真机确认后再定稿。
6. **性能**：AC14 微基准余量大（µs 级 vs 1ms 预算）；10 分钟对照基线按验收口径需真机跑一轮。

## 6. 遗留真机验证清单（交测试）

| 项 | 环境 | 内容 |
| --- | --- | --- |
| T1 | iOS 手机 · Toy webview（横屏） | AC2 方向（右转/上抬/左横握+右横握各一次）；AC6 权限弹窗时序与系统级关闭场景；AC7 拒绝回退+toast |
| T2 | Android 手机 · Toy webview | AC2 方向复验；无权限 API 直接生效；后台切回丢 2 事件 |
| T3 | 双端 | AC14 十分钟对照（关闭 vs 开启档平均帧时长增量 <1ms）；死亡/观战/复活（2V2）实流 |
| T4 | 靶场 | AC13 靶场实时调参手感；退出对局数值保持 |
| T5 | 蓝牙手柄（如有） | §7.5 摇杆与陀螺仪同帧仲裁（当前无手柄源，接入后复验） |

## 7. 给测试的注意事项

- localStorage 位于 `potato-settings` key；测试可用 `localStorage.removeItem('potato-settings')` 回到默认档（1/100/100）。
- 桌面 Chrome 无 `DeviceOrientationEvent.requestPermission`，权限流桩直接赋值 `DeviceOrientationEvent.requestPermission = () => Promise.resolve('denied')` 即可复现 iOS 路径（测试脚本已内置）。
- 陀螺仪挂起判定包含「菜单/暂停屏打开」「竖屏」「`XZ.match.state().paused`」——真机复验卡点时先核对这些前置。
- 全部调参常量集中在 `gyro.js` 顶部 `GYRO_TUNING`，调参不改结构；`_test` 命名空间仅供测试，运行时路径不含。
