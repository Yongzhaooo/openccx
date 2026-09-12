# Wayfinder

**Project outcome:** 一个跨平台（macOS / Windows / Linux）的本地代理，**只**服务 Claude Code：
把 Anthropic Messages 请求转成国产模型（先行 DeepSeek 官方 API 与 opencode go），显示额度，
并以独立命名的 MIT fork 分发。简洁和稳定优先于功能覆盖。

## 已定决策（2026-09-12）

- **D1 原地瘦身** — 保留 `src/claude/` 的 Anthropic↔Responses 翻译层、路由、认证；删其余
  provider / adapter / 客户端面。不重写骨架。
- **D2 删 Codex 客户端面** — 目标只写 Claude Code。删 `src/codex/`、catalog 注入、shim、
  `occx restore`、`$CODEX_HOME` 写入。
- **D3 硬 fork 改名** — 新仓库叫 **`openccx`**（2026-09-12 定；npm 与 GitHub 均验证空闲）。
  保留 MIT LICENSE 与 `Copyright (c) 2026 openccx contributors`。重写 `.github/workflows/`。
- **D4 CLI + GUI 保留** — 额度显示走 `occx provider quota` 与 `gui/` 的 Usage 页 +
  Provider workspace 的 QuotaBars。

## 不要动（已核实）

- **Responses 数据面必须留。** Claude Code 的 `/v1/messages` 是翻译成 Responses 再走
  `handleResponses` 的（`src/server/claude-messages.ts`）。删 Codex **客户端** ≠ 删 Responses
  **数据面**。
- **DeepSeek 与额度已存在，不要重写。** `src/providers/registry.ts:2121`（官方 API）、
  `registry.ts:1792`（opencode go）；`src/providers/quota.ts:614`（`api.deepseek.com/user/balance`）、
  `quota.ts:517`（`opencode.ai/zen/go/v1/usage`）。工作是删旁边的，不是加中间的。
- **改代码要连带改文档。** `structure/` SSOT 与 `tests/test-layout.test.ts` 会失败。
- **`occx` 不全是品牌，一部分是协议常量，改名会破坏线路契约**：`occxr1:` reasoning 信封
  （`src/adapters/openai-responses.ts:67`）、`claude-occx-` / `claude-occx2-` 模型别名格式
  （`src/claude/alias.ts:6`）、`occx-route` / `occx-effort` 指令头、`OPENCCX_HOME` 与
  `~/.opencodex` 状态目录。改这些前先确认 `~/.opencodex` 是否已有真实状态会被孤立。

## In progress

（无。Phase 0 已完成并推送；Phase 1 尚未认领。）

## Done (rolling)

- **Phase 0 — 硬 fork 完成并推送**（2026-09-12）。新仓库 **https://github.com/Yongzhaooo/openccx**
  （PUBLIC，默认分支 `main`，3,367 文件）；远端 `main` = `a1ead2d66`，已与本地 HEAD 核对一致。
  remote 按硬 fork 结构重排：`origin` = 新仓库，`upstream` = `lidge-jun/opencodex`（只读参考）。
  落地提交：`4c3555528` 删 5,041 个 upstream 文件（注意此提交非纯删除 —— `git add -A` 时吞进了
  改名进行中的 13 个文件）；`8fd9c9856` 改名 `opencodex`→`openccx` / `ocx`→`occx`；
  `3d04987e3` 修 upstream 包身份（install 脚本、`src/update` 的 `PKG`、重装提示）+ 删掉
  `release.yml` 与 `dev-version-bump.yml`；`a1ead2d66` 修改名引入的 privacy-scan 回归。
  验收：`bun run typecheck` 绿（tsc 加载 1,038 个 src 文件，注入探针可复现报错，非空跑）、
  `bun run privacy:scan` 绿（带反向对照，见下）、`.github/` 无任何远端写操作（grep 验证）。
- **状态目录已迁移**（2026-09-12）。`~/.opencodex` 整目录拷贝为 `~/.openccx`（旧目录保留未动，
  可回退），并剔除陈旧的 `ocx.pid` / `runtime-port.json` / `system-env-port`（实测 pid 48880 已死）。
  `config.json` 6992B、`usage.jsonl` 154 行 / 279KB 完整；`auth.json` 两边都不存在，无需重登。
  注意 `~/.openccx` 里**没有** OAuth 凭据可继承，凭据在 `config.json` 内。
  **「拷贝」不等于「共享」**（Astra 修正）：fork 默认用 `.openccx`，upstream 默认用 `.opencodex`，
  两者不会互相踩。真正可能冲突的是 **Codex / Claude 客户端配置等外部资源**（`$CODEX_HOME/config.toml`、
  Claude 侧配置库）—— 两个版本同时跑会争抢的是那些，不是状态目录。
- **privacy-scan 回归的根因**（`a1ead2d66`）。扫描器的 bearer 模式要求 **24 字符以上**；
  改名把夹具 `ocx_data_test_admission` 从 **23** 推到 **24** 字符，正好越过门限，
  于是 `bun run privacy:scan`（`prepush` 一环）开始报 3 处测试夹具。
  在 `isAllowedBearerToken` 里按形状放行 `*_data_test_*`。
- **`structure:check` 33 → 0**（`3e0f902b5`）。它**是 CI 门槛**：`tests/ci-workflows/structure-ssot.test.ts:114`
  断言 `runStructureChecks(repoRoot())` 返回 `[]`。我先前记的「ci.yml 不跑它所以 CI 不红」是错的，已改。
  做法：删掉整篇写 docs-site / devlog / 发布流程的 `structure/ops/docs-and-release.md`（它已无题材可写），
  连带三个作废 ADR（0080 GitHub Pages、0081 容器配方、0083 治理 —— 对应功能均已删）。
  仍活着的 ADR-0082 改归属 `ops/service-and-sidecars.md`，新章节的 present-tense 契约已对
  `src/service.ts:2196/2203` 的 `exit /b 3` 分支核实过。`HISTORICAL_ROOTS` 保留 devlog/docs-site 是
  **刻意**的 —— 那正是「被删的树持续被检查」的机制，别去清。
- **Astra 独立审阅**（2026-09-12）推翻了本会话的三个数字与一个结论，均已修正：
  可达性口径（见 Watching）、`structure:check` 的 CI 地位、Phase 1 的删除粒度与验收条件。
- **D5 Claude Desktop 与 Claude CLI 都保留**（2026-09-12 用户决定）。两个都是产品面。
  后果：`src/claude/desktop-*`（12 文件 / 2,096 行）**不删**，其经 `codex/desired-state` 与
  `codex/catalog` 的耦合保留。Phase 1 只删 Codex 专属面，不动 Claude 侧任何东西。
- **Phase 1 切片 1 完成**（`86cd384cc`）：Codex 提示词面端到端删除 —— 实现 9 文件、
  `codex-prompt-routes.ts` + 8 条路由注册、`occx inspect codex-prompt` + capabilities 条目、
  GUI Prompt 面板（`codex-set-prompt.tsx`、`codex-set-tab.ts`、9 个 `components/codex-set/*`）、
  契约测试清单条目、提示词 CSS、9 个 locale 的 `codexSet.tab.*`、11 个根测试 + 5 个 GUI 测试。
  共删 36 / 改 23。`CodexSet` 页面保留为纯 Multi-auth，`app-routing` 不再认领 `codex-set/prompt`。
  顺带清掉两处耦合残留：`ReplacePublisher` 的死成员 `"prompt-journal"`、`transition-state.ts`
  指向已删文件的注释。

## Waiting

- **测试套件在本容器内无法运行** — 阻塞 Phase 0 的测试验收，但不阻塞 push。不是代码缺陷：
  Claude Desktop 的 MSIX 容器把 `AppData\Local` 写入重定向到
  `Packages\Claude_pzs8sxrjxfjjc\LocalCache\Local\`，而 `src/codex/user-identity.ts:413` 的
  realpath 一致性校验会把**真实位置原本不存在**的目录名判为 junction/reparse 而拒绝。
  已用从未存在过的名字 `ZzqProbe9182` 证明同样被重定向，与本次改名无关。
  → 改名后的验收目前只到 typecheck + CLI 冒烟；跑测试要用**普通终端**（非本 App 容器）。
  **第二次独立复现**（2026-09-12，本会话）：`bun test tests/ci-workflows/` 得
  `0 pass / 34 fail / 34 error`，全部落在 `scripts/test-run-lock.ts:431`
  `resolveDefaultTestRunLockPath`，栈顶同为 `src/codex/user-identity.ts:100`。
  ⚠️ 更早一次同命令曾得「320 pass / 50 fail / 13 error」—— 那是在树改到一半、且该锁路径
  尚可解析时测的，**数字无效，不可当基线**。这直接推翻了「Phase 0 验收＝测试全绿」的可行性，
  Phase 1 的测试验收同样改用普通终端。
  **但 GUI 套件不受此限，可跑**（2026-09-12 实测）：`cd gui && bun test tests` 基线
  **1979 pass / 0 fail**（248 文件 / 106 秒），`cd gui && bun run build` 亦通过。
  所以凡带 GUI 的切片在本容器里**可以完整验收**；只有根套件必须换普通终端。
- **service / tray 子系统的去留** — 阻塞 Phase 4。删掉它同时减少代码与平台差异
  （`src/tray/windows.ts`、`openccx-service-*.vbs/cmd/task.xml`、macOS `launchctl setenv`），
  但会让 GUI 失去开机自启。需要一次决策。

## Next actions

按顺序，每步有验收点。

1. **Phase 1 — 删 Codex 客户端面**（按 D2）。**按完整功能切片删，不要按文件计数**
   （Astra 修正：不再把「38 个文件」当删除指标）。每个切片同时处理
   **GUI 入口 / API / CLI / 启动停止钩子 / 实现 / 测试 / 文档**；实现和它的引用链一起走，
   不需要先提交「断引用」再提交「删文件」。

   ✅ **切片 1「Codex 提示词面」已完成**（`86cd384cc`）。

   剩余切片（都由 Codex 专属面撑着）：
   - **Codex Set 页的 Multi-auth 半** —— `codex-set-multiauth.tsx` + `/api/codex-auth/*` + 账号池
   - **日志保护** —— `log-guard/*`（9 文件）+ `codex-log-guard-doctor.ts` + `storage-log-guard-routes.ts`
     + `StorageWorkspace` 面板（注意 `StorageWorkspace` 是共享宿主，只摘面板）
   - **catalog 同步与注入** —— `sync`、`shim`、`refresh`、`admission`、`catalog-admission`
   - **Codex 生命周期** —— `convergence*`、`native-profile-api`、`app-server-restart-service`、
     `desktop-app-restart`、`autostart-health`
   - **ChatGPT 额度与重置机器** —— `quota-auto-redeem`、`quota-auto-refresh`、`reset-credit-auto-redeem`
   - **Codex 诊断与迁移** —— `plugins-doctor`、`cli-install-provenance`、`legacy-config-keys`、
     `history-migration-guardian`、`retired-model-migration`、`occx-compaction-history`、`plan-from-token`

   ⚠️ **只删 dashboard 与 Codex CLI 调用点覆盖不全**：普通服务启动也调它们 ——
   `src/server/index.ts:1079` 注册额度刷新任务、`src/cli/index.ts:555` 启动历史守护。
   ⚠️ **GUI 宿主常是共享的**（切片 1 的 `CodexSet` 宿主同时装 multiauth、`StorageWorkspace`
   同时装日志面板）：只删属于该功能的面板，别顺手把宿主也端了。宿主若是纯 Codex 专属，
   写成同一份切片或单列，别拆成两半留下畸形页面。
   *验收（Astra 修正版；typecheck + 余额查询不够）*：`bun run typecheck`；**GUI 构建与 GUI 测试**
   （根 `tsconfig.json` 只含 `src`，覆盖不到 `gui/`）；保留页面的实际显示验证；消息链路覆盖
   **流式与非流式、工具调用、错误处理**；启动/停止需验证**不再写 Codex 配置**。优先复用已有测试。
   普通终端跑套件仍是最终验收；环境阻塞只能标「待验收」，不能用余额查询替代。
2. **Phase 2 — 删其他 provider。** `src/adapters/registry.ts` 现为 8 个 provider 条目
   （codebuddy / anthropic / google / kiro / azure / cursor / devin / qoder），收敛到 DeepSeek
   需要的 2 条 wire；删 `cursor/`（~50 文件）、`devin/`、`devin-cli/`、`qoder/`、`codebuddy/`、
   `kiro-*`、`google*`、`azure.ts`、`mimo-free.ts`、`ollama-native*`、`command-code.ts`，
   以及 `registry.ts` 里对应的 provider 行与跨厂商 model 表。
   *验收：* `src/adapters/` 只剩 `openai-chat.ts` / `openai-responses.ts` 及其共享叶子。
3. **Phase 3 — 删 CLI 面**（`src/cli/` 现约 60 文件）。保留 start / status / provider /
   quota / usage / claude / restore 所需，其余删除。*验收：* `occx --help` 的顶层命令面收敛。
4. **Phase 4 — 跨平台收缩**（依赖 Waiting 中的 service/tray 决策）。

## Watching

- **依赖可达性的正确口径**（本会话在这条轴上错了三次 —— 动手前先读这条）。
  工具 `%TEMP%\reach.mjs`（约 60 行）。两种模式回答两个**不同**问题：静态边 = 「加载时是否拉起」；
  `INCLUDE_DYNAMIC=1` = 「还有没有人用」——**删文件前该问的是后者**。
  必须**排除 `import type`**（emit 时被擦除，不是运行时依赖）；把它算进去正是把数据面数字
  从 78 抬到 100 的那个 bug。Astra 用 Bun 解析器独立核对：数据面静态 **78**、数据面+动态+Worker
  **101**、全入口 **136**；我的工具得 78 / 98 / 133（差的 3 是未建模的 Worker 链）。
  结论：**`src/codex/` 没有可整文件删除的死模块**；但「文件内部没有死代码」不成立，别扩大解读。
- **README.md 仍指向 upstream**：`@bitkyc08/opencodex` 的 npm 徽章与安装命令（第 7-13、84、190、350 行）、
  `github.com/lidge-jun/opencodex` 的 LICENSE 链接。改名的机械替换没覆盖它（README 内容本身也需要重写，
  不是替换能解决的）。推上去了不影响功能，但对外观感是错的。
- **`scripts/release.ts` 已成死代码** —— 它派发的 `release.yml` 已被删。随 Phase 3 一起清。
- `src/providers/registry.ts` 3665 行、`src/config.ts` 4385 行是全项目最大的两个上帝文件；
  Phase 2 会切到它们，届时评估是否值得拆分，**不要提前拆**。
