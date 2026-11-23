# production/qa/smoke · 运行说明

## 可运行脚本

| 文件 | 用途 |
|---|---|
| `smoke_run.py` | **主烟雾套件**：S-01~S-17 共 17 条自动化用例（Playwright） |
| `probe1.py` | 首轮自由探测（收集 console/网络/截图，不产生判定） |

## 运行前置

1. 静态服务指向 build 解压目录（默认 8813 端口）：
   ```
   cd <build解压目录> && python3 -m http.server 8813 --bind 127.0.0.1
   ```
2. 依赖：python3 + playwright（chromium 在 `/usr/bin/chromium`，已带 SwiftShader 参数，无需配置）。

## 运行

```
cd production/qa/smoke
python3 smoke_run.py                      # 默认 http://127.0.0.1:8813/index.html
python3 smoke_run.py http://127.0.0.1:8811/index.html   # 指定其他服务地址
```

- 输出：逐条 `[PASS/FAIL]` + 汇总；结果 JSON 落 `production/qa/evidence/smoke_results.json`。
- 判定语义：断言**期望的正确行为**。当前 5 条 FAIL 分别对应缺陷 D-001/002/003/006/008（见 defects.md）；缺陷修复后重跑应全绿，即为回归门控。
- 已知环境限制：沙箱无头 Chromium WebGL2 不可用 → 游戏停在 boot 态。脚本内 `ENV_WHITELIST` 已豁免该环境错误；大厅/对局层用例见 `../smoke-tests.md` M 组（S-18~S-30，需真实浏览器人工执行）。
- 用例挂载点：新功能「陀螺仪」对应 `smoke-tests.md` S-30（预留，待 Story 验收标准到位后补充）。
