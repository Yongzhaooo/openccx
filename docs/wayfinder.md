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

- **Phase 0 — 硬 fork** — paused on branch `openccx/phase-0-fork`（领先 `origin/main` 3 个提交）。
  resume: `git log openccx/phase-0-fork`。
  已落地：`4c3555528` 删除 5,041 个 upstream 文件（devlog / docs-site / readme 多语言 /
  docker+compose / CREDITS+SPONSORS+MAINTAINERS / deploy-docs.yml）——
  注意此提交非纯删除，`git add -A` 时吞进了改名进行中的 13 个文件；
  `8fd9c9856` 改名 1,869 文件 + 24 条路径 + 包身份；
  `3d04987e3` 修好改名漏掉的 upstream 包身份（`install.sh`/`install.ps1`、`src/update/index.ts`
  的 `PKG`、`job.ts` 重装提示），并删掉 `release.yml` 与 `dev-version-bump.yml` ——
  `.github/` 现已无任何远端写操作（已用 grep 验证）。
  已验证：`bun run typecheck` 绿（tsc 加载 1,038 个 src 文件；注入 `__tsc_probe.ts` 可复现报错，
  证明不是空跑）、`bun run src/cli/index.ts --version` 输出 `openccx 2.52.0`、
  上游 URL 与 MIT 版权行完整保留（`lidge-jun/opencodex` 23 文件、`opencodex.me` 17、
  `bitkyc08/opencodex` 32，畸形形态为 0）。
  next: 建新仓库并推 —— 受 Waiting 的 `~/.opencodex` 决策阻塞。

## Waiting

- **`~/.opencodex` 已有真实状态** — 阻塞 push。实测 `~/.opencodex` 存在、`~/.openccx` 不存在，
  说明本机已在用 upstream。改名会把 `config.json` / `auth.json` / `codex-accounts.json` /
  `usage.jsonl` / 额度缓存全部孤立。需要决定：迁移旧状态，还是保留旧状态目录名。
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

1. **Phase 0 — 硬 fork。** 建新仓库、改名、拆 `.github/workflows/` 里会写上游的动作：
   `release.yml:348` `npm publish`、`:416` `git push origin refs/tags/*`、`:419` `gh release create`；
   `deploy-docs.yml` 的 Pages 发布；`dev-version-bump.yml:211` `git push origin`。
   *验收：* `npm pack` 不再产出 `@bitkyc08/opencodex`；仓库内无指向 upstream 的写操作。

   实测规模（2026-09-12）：`openccx` 全仓库 20,872 处 / 3,170 文件，但其中
   **`devlog/` 1,731 文件、`docs-site/` 337 文件、`readme/` 7 语言、CREDITS/SPONSORS/MAINTAINERS
   共 106 处应当整片删除而非改名**；存活代码树只有 1,018 文件 / 8,783 处。先删后改，别先改名。
2. **Phase 1 — 删 Codex 客户端面**（按 D2）。*验收：* `bun run typecheck` 与 `bun run test` 通过，
   且 `occx provider quota --refresh` 仍能取到 DeepSeek 余额。
3. **Phase 2 — 删其他 provider。** `src/adapters/registry.ts` 现为 8 个 provider 条目
   （codebuddy / anthropic / google / kiro / azure / cursor / devin / qoder），收敛到 DeepSeek
   需要的 2 条 wire；删 `cursor/`（~50 文件）、`devin/`、`devin-cli/`、`qoder/`、`codebuddy/`、
   `kiro-*`、`google*`、`azure.ts`、`mimo-free.ts`、`ollama-native*`、`command-code.ts`，
   以及 `registry.ts` 里对应的 provider 行与跨厂商 model 表。
   *验收：* `src/adapters/` 只剩 `openai-chat.ts` / `openai-responses.ts` 及其共享叶子。
4. **Phase 3 — 删 CLI 面**（`src/cli/` 现约 60 文件）。保留 start / status / provider /
   quota / usage / claude / restore 所需，其余删除。*验收：* `occx --help` 的顶层命令面收敛。
5. **Phase 4 — 跨平台收缩**（依赖 Waiting 中的 service/tray 决策）。

## Watching

- `src/providers/registry.ts` 3665 行、`src/config.ts` 4385 行是全项目最大的两个上帝文件；
  Phase 2 会切到它们，届时评估是否值得拆分，**不要提前拆**。
