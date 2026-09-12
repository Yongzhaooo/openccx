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
- **privacy-scan 回归的根因**（`a1ead2d66`）。扫描器的 bearer 模式要求 **24 字符以上**；
  改名把夹具 `ocx_data_test_admission` 从 **23** 推到 **24** 字符，正好越过门限，
  于是 `bun run privacy:scan`（`prepush` 一环）开始报 3 处测试夹具。
  在 `isAllowedBearerToken` 里按形状放行 `*_data_test_*`。

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
- **service / tray 子系统的去留** — 阻塞 Phase 4。删掉它同时减少代码与平台差异
  （`src/tray/windows.ts`、`openccx-service-*.vbs/cmd/task.xml`、macOS `launchctl setenv`），
  但会让 GUI 失去开机自启。需要一次决策。

## Next actions

按顺序，每步有验收点。

1. **Phase 1 — 删 Codex 客户端面**（按 D2）。*验收：* `bun run typecheck` 通过，且
   `occx provider quota --refresh` 仍能取到 DeepSeek 余额。
   测试验收**必须换普通终端**（本 App 容器跑不了，见 Waiting），所以别把「测试全绿」当成
   本阶段的完成条件 —— 用 CLI 冒烟 + typecheck 代替。
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

- **`structure:check` 有 33 处失败**（非阻塞，`ci.yml` **不**跑它，只在本地/prepush 之外手动跑）。
  全是 `structure/*.md` 指向已删路径的散文引用：`devlog/` 17 处、`docs-site/` 10 处、
  `.github/workflows/dev-version-bump.yml` 等。涉及 5 个文件：`ops/docs-and-release.md`、
  `providers/chat-compat.md`、`providers/openai-tiers.md`、`providers/xai-grok.md`、`subagents.md`。
  **刻意不修**：Phase 1-4 会继续删掉 `structure/` 正在描述的 adapter / provider / CLI，
  现在修等于修四遍。留给 Phase 3 一并决定 `structure/` 这个上游治理层的去留。
- **README.md 仍指向 upstream**：`@bitkyc08/opencodex` 的 npm 徽章与安装命令（第 7-13、84、190、350 行）、
  `github.com/lidge-jun/opencodex` 的 LICENSE 链接。改名的机械替换没覆盖它（README 内容本身也需要重写，
  不是替换能解决的）。推上去了不影响功能，但对外观感是错的。
- **`scripts/release.ts` 已成死代码** —— 它派发的 `release.yml` 已被删。随 Phase 3 一起清。
- `src/providers/registry.ts` 3665 行、`src/config.ts` 4385 行是全项目最大的两个上帝文件；
  Phase 2 会切到它们，届时评估是否值得拆分，**不要提前拆**。
