# Wayfinder 历史归档 (Done)

本文档归档 openccx 项目历史 Phase 0 交付、改名记录、调试细节与已放弃的旧裁剪路线，供历史参考与复现检索。当前项目主状态请参见 [wayfinder.md](wayfinder.md)。

---

## 历史决策（2026-09-12 定）

- **D1 原地瘦身** — 保留 `src/claude/` 的 Anthropic↔Responses 翻译层、路由、认证；删其余 provider / adapter / 客户端面。不重写骨架。
- **D2 删 Codex 客户端面** — 目标只写 Claude Code。删 `src/codex/`、catalog 注入、shim、`occx restore`、`$CODEX_HOME` 写入。
- **D3 硬 fork 改名** — 新仓库叫 **`openccx`**（2026-09-12 定；npm 与 GitHub 均验证空闲）。保留 MIT LICENSE 与 `Copyright (c) 2026 openccx contributors`。重写 `.github/workflows/`。
- **D4 CLI + GUI 保留** — 额度显示走 `occx provider quota` 与 `gui/` 的 Usage 页 + Provider workspace 的 QuotaBars。
- **D5 Claude Desktop 与 Claude CLI 都保留**（2026-09-12 用户决定）— 两个都是产品面。后果：`src/claude/desktop-*`（12 文件 / 2,096 行）不删，其经 `codex/desired-state` 与 `codex/catalog` 的耦合保留。Phase 1 只删 Codex 专属面，不动 Claude 侧任何东西。

---

## 历史交付与验证详情

- **Phase 0 — 硬 fork 完成并推送**（2026-09-12）：
  - 远端仓库：`https://github.com/Yongzhaooo/openccx`（PUBLIC，默认分支 `main`，3,367 文件）；远端 `main` = `a1ead2d66`，已与本地 HEAD 核对一致。
  - remote 结构：`origin` = 新仓库，`upstream` = `lidge-jun/opencodex`（只读参考）。
  - 落地提交序列：
    - `4c3555528`：删 5,041 个 upstream 文件（`git add -A` 时含改名进行中的 13 个文件）。
    - `8fd9c9856`：改名 `opencodex`→`openccx` / `ocx`→`occx`。
    - `3d04987e3`：修 upstream 包身份（install 脚本、`src/update` 的 `PKG`、重装提示）+ 删掉 `release.yml` 与 `dev-version-bump.yml`。
    - `a1ead2d66`：修改名引入的 privacy-scan 回归。
  - 验收结果：`bun run typecheck` 绿（tsc 加载 1,038 个 src 文件，注入探针可复现报错）、`bun run privacy:scan` 绿、`.github/` 无远端写操作（grep 验证）。

- **状态目录迁移记录**（2026-09-12）：
  - `~/.opencodex` 整目录拷贝为 `~/.openccx`（旧目录保留未动，可回退），剔除陈旧的 `ocx.pid` / `runtime-port.json` / `system-env-port`（pid 48880 已死）。
  - `config.json` 6992B、`usage.jsonl` 154 行 / 279KB 完整；`auth.json` 两边均不存在。
  - 凭据机制：`~/.openccx` 无 OAuth 凭据，凭据在 `config.json` 内。
  - 边界说明：fork 默认用 `.openccx`，upstream 默认用 `.opencodex`，两者目录隔离。真正可能冲突的是 Codex / Claude 客户端外部配置（`$CODEX_HOME/config.toml`、Claude 侧配置库）。

- **privacy-scan 回归根因与修复**（`a1ead2d66`）：
  - 扫描器 bearer 模式要求 24 字符以上。改名把夹具 `ocx_data_test_admission` 从 23 字符推到 24 字符，越过门限导致 `bun run privacy:scan` 报 3 处夹具错误。
  - 修复：在 `isAllowedBearerToken` 里按形状放行 `*_data_test_*`。

- **`structure:check` 33 → 0**（`3e0f902b5`）：
  - 地位核实：为 CI 门槛（`tests/ci-workflows/structure-ssot.test.ts:114` 断言 `runStructureChecks(repoRoot())` 返回 `[]`）。
  - 处置：删除撰写 docs-site / devlog / 发布流程的 `structure/ops/docs-and-release.md`，作废 ADR 0080（GitHub Pages）、ADR 0081（容器配方）、ADR 0083（治理）。
  - ADR-0082 归属迁至 `ops/service-and-sidecars.md`，契约核对 `src/service.ts:2196/2203` 的 `exit /b 3`。`HISTORICAL_ROOTS` 保留 devlog/docs-site。

- **Phase 1 切片 1「Codex 提示词面」完成与修补**（`86cd384cc`、`56c875d29`）：
  - 初始删除（`86cd384cc`）：实现 9 文件、`codex-prompt-routes.ts`、8 条路由注册、`occx inspect codex-prompt`、capabilities 条目、GUI Prompt 面板、契约测试清单、提示词 CSS、9 个 locale 的 `codexSet.tab.*`、11 个根测试 + 5 个 GUI 测试。共删 36 / 改 23 文件。`CodexSet` 页面保留为纯 Multi-auth。
  - 审阅修补（`56c875d29`）：
    - ① 同步 `skill:surface:check` 生成的 `01_management_surface.md` 并修正 `SKILL.md`；
    - ② `tests/cli/cli-storage-inspect.test.ts` 改为断言已删命令被拒绝且不发请求；
    - ③ `tests/server/system-routes.test.ts` 的 publisher 替换为 `storage-cleanup`；
    - ④ `CodexSet.tsx` 摘除无 tablist 的 `role="tabpanel"`；
    - ⑤ 跨平台 CI 契约迁入 `structure/ops/service-and-sidecars.md`。

- **Phase 0 遗留包名修复**（`tests/helpers/repo-root.ts:4`）：
  - `PACKAGE_NAME` 遗留 `@bitkyc08/opencodex`，导致 `repoRoot()` 无法解析本包从而使测试套件失败；已修复为 `openccx`。

- **测试套件运行锁解锁方案**（2026-09-13 验证）：
  - 根测试套件可通过指定环境变量 `OCCX_TEST_NO_QUEUE=1` 运行。
  - 原理：`scripts/test-run-lock.ts:189` 在该变量为 `1` 时直接跳过锁路径解析，避开 `resolveWindowsRuntimeRoot` 触发的 Windows junction 限制。运行命令：`OCCX_TEST_NO_QUEUE=1 bun test <file>`。

---

## 历史裁剪计划与切片拆解（2026-09-24 已放弃推进）

1. **Phase 1 — 删 Codex 客户端面**：
   - 切片 1：Codex 提示词面（已完成，提交 `86cd384cc` / `56c875d29`）。
   - 切片 2：Codex Set 页 Multi-auth 拆分与账号池收敛（按上游认证方式收缩，不按客户端名称切）。
   - 切片 3：日志保护（`log-guard/*` 9 文件、`codex-log-guard-doctor.ts`、`storage-log-guard-routes.ts`、`StorageWorkspace` 面板）。
   - 切片 4：catalog 同步与注入（`sync`、`shim`、`refresh`、`admission`、`catalog-admission`）。
   - 切片 5：Codex 生命周期（`convergence*`、`native-profile-api`、`app-server-restart-service`、`desktop-app-restart`、`autostart-health`）。
   - 切片 6：ChatGPT 额度与重置（`quota-auto-redeem`、`quota-auto-refresh`、`reset-credit-auto-redeem`）。
   - 切片 7：Codex 诊断与迁移（`plugins-doctor`、`cli-install-provenance`、`legacy-config-keys`、`history-migration-guardian`、`retired-model-migration`、`occx-compaction-history`、`plan-from-token`）。
2. **Phase 2 — 删其他 provider**：收敛 `src/adapters/registry.ts` 中非 DeepSeek/OpenAI 所需适配器，清理 `cursor/`、`devin/`、`qoder/` 等。
3. **Phase 3 — 删 CLI 面**：收敛 `src/cli/`，仅保留核心管理与额度命令。
4. **Phase 4 — 跨平台收缩**：评估 service / tray（Windows 任务与 macOS launchctl）精简。

---

## 历史观察与分析记录

- **依赖可达性统计口径**：
  - 工具 `%TEMP%\reach.mjs`。需区分静态入口（是否加载）与包含动态引用的使用链（`INCLUDE_DYNAMIC=1`）。
  - 必须排除 `import type`（TS 擦除后不影响运行时）。
  - 统计基线：数据面静态 78，数据面+动态+Worker 101，全入口 136。`src/codex/` 内部无整文件死模块。
- **README.md 遗留状态**：仍包含 upstream `@bitkyc08/opencodex` 的徽章与链接，历史重命名时未机械重写。
- **死脚本**：`scripts/release.ts` 在 `release.yml` 删除后已失活。
