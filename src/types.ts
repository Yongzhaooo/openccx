// AUTO-SPLIT barrel: src/types.ts re-exports every historical name; bodies live in src/types/*.
// Values (runtime): tools + wire. Types (erased): request + config + provider + accounts.

export type { OccxTool, OccxToolChoice } from "./types/tools";
export {
  CODE_MODE_EXEC_TOOL_NAME,
  dottedToolName,
  namespacedToolName,
  normalizeDeclaredToolName,
  toolChoiceAliases,
  createToolChoiceResolver,
  toolChoiceCandidates,
  toolAllowedByChoice,
  resolveToolChoiceWireName,
  modelInList,
  isAllowedToolChoice,
  toolChoiceToolPredicate,
  declaresCodeModeExec,
} from "./types/tools";

export type { UpstreamHttpVersion, ReasoningSummaryDelivery, CodexAccountMode } from "./types/wire";
export {
  UPSTREAM_HTTP_VERSION_VALUES,
  REASONING_SUMMARY_DELIVERY_VALUES,
  OPENAI_PROVIDER_TIER_VERSION,
  MODEL_ADAPTER_OVERRIDE_ALLOWED,
  captureWireAdapterHardPins,
  isWirePinnedModel,
  pinnedWireAdapter,
} from "./types/wire";

export type {
  OccxReasoningReplayIdentity,
  OccxReasoningReplayScopeRef,
  OccxParsedRequest,
  OccxContext,
  OccxMessage,
  OccxUserMessage,
  OccxAssistantMessage,
  OccxDeveloperMessage,
  OccxToolResultMessage,
  OccxTextContent,
  OccxImageContent,
  OccxContentPart,
  OccxThinkingContent,
  OccxToolCall,
  OccxProviderOpaqueToolCallMetadata,
  OccxAssistantContentPart,
  OccxRequestOptions,
  OccxMessagePhase,
  OccxProviderContinuationOwner,
  OccxProviderContinuationState,
  AdapterEvent,
  OccxUrlCitation,
  OccxUsage,
} from "./types/request";

export type {
  OccxClaudeCodeConfig,
  OccxClaudeDesktopFamily,
  OccxClaudeDesktopAssignment,
  OccxClaudeDesktopProfile,
  StorageCleanupPolicy,
  OccxCustomModel,
  OccxApiKeyEntry,
  OccxClientIntegrationsConfig,
  OccxConfigRebaseProvenance,
  OccxHubConfig,
  OccxRemoteGuiConfig,
  OccxConnectedClientId,
  OccxClientConnectionConfig,
  OccxConfig,
  OccxAccountPoolRotationStrategy,
  OccxAccountPoolQuotaWindow,
  OccxComboStrategy,
  OccxComboDefaultEffort,
  OccxComboReasoningEffortMode,
  OccxComboTarget,
  OccxComboConfig,
  OccxRoutingUnknownEvidenceMode,
  OccxRoutingProfileCandidate,
  OccxRoutingProfileRequirements,
  OccxRoutingProfileOptimize,
  OccxRoutingUnknownCostCapMode,
  OccxRoutingProfileLimits,
  OccxRoutingProfileUnknownEvidence,
  OccxRoutingProfileCompatibilitySuite,
  OccxRoutingProfileCompatibility,
  OccxRoutingProfileConfig,
  OccxTokenGuardianConfig,
  OccxImagesConfig,
  OccxSearchConfig,
  OccxVisionSidecarConfig,
  OccxWebSearchSidecarConfig,
} from "./types/config";

export type {
  RefreshPolicy,
  OpenRouterProviderRouting,
  VercelGatewayRouting,
  ResponsesItemIdRepairConfig,
  RateLimitRetryPolicy,
  TransientRetryPolicy,
  ProviderWebSearchBridgeBackend,
  ProviderWebSearchBridgeConfig,
  ProviderCostOverlay,
  RequestPacingRule,
  ProviderRequestPacingConfig,
  FastWire,
  AttemptTierOutcome,
  TierObservationContext,
  TierDecision,
  OccxProviderConfig,
} from "./types/provider";

export { PROVIDER_WEB_SEARCH_BRIDGE_BACKENDS } from "./types/provider";

export type {
  CodexAccount,
  CodexAccountCredentials,
  CodexAccountCredentialRecord,
} from "./types/accounts";
