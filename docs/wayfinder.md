# Wayfinder

**Project outcome:** 保留 openccx 代码和历史试验作为学习参考。

**Current answer:** 2026-09-24 定为放弃独立产品开发，仅作学习实验。当前无进行中工作、无发布维护承诺，原裁剪路线已全面终止。历史提交、重命名、切片验证及调试细节已完整归档至 [wayfinder-done.md](wayfinder-done.md)。

**Current focus:** 冻结现有代码库，保持协议与状态目录契约清晰，仅按明确提出的学习问题开展有限实验。

## 技术边界与协议契约

- **Responses 数据面必须保留**：Claude Code 的 `/v1/messages` 依赖 `src/server/claude-messages.ts` 翻译为 Responses 并调用 `handleResponses`。
- **协议常量与线路契约（不可随意重命名）**：
  - `occxr1:` reasoning 信封格式（`src/adapters/openai-responses.ts:67`）。
  - `claude-occx-` / `claude-occx2-` 模型别名格式（`src/claude/alias.ts:6`）。
  - `occx-route` / `occx-effort` 路由与推理控制请求头。
  - 环境变量与状态目录：`OPENCCX_HOME` 与 `~/.openccx`（历史 `~/.opencodex` 保留作回退隔离）。
- **Provider 与额度实现**：
  - DeepSeek 官方 API：`src/providers/registry.ts:2121`；余额接口：`src/providers/quota.ts:614`（`api.deepseek.com/user/balance`）。
  - opencode go：`src/providers/registry.ts:1792`；余额接口：`src/providers/quota.ts:517`（`opencode.ai/zen/go/v1/usage`）。
- **测试执行约定**：
  - Windows 环境下根测试套件需指定 `OCCX_TEST_NO_QUEUE=1` 避开 junction 锁限制：`OCCX_TEST_NO_QUEUE=1 bun test <file>`。

## 归档参考

历史决策 D1–D5、Phase 0 硬 fork 提交哈希（`4c3555528`、`8fd9c9856`、`3d04987e3`、`a1ead2d66`）、privacy-scan 调试细节、Phase 1 切片 1 删除清单及已放弃的裁剪计划，参见 [wayfinder-done.md](wayfinder-done.md)。
