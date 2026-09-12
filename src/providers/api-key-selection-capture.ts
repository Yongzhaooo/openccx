import type { OccxProviderConfig } from "../types";
import type { ProviderApiKeySelection } from "../types/provider";

export function captureProviderApiKeySelection(provider: OccxProviderConfig): ProviderApiKeySelection {
  return {
    entryId: provider.apiKeyPool?.find(entry => entry.key === provider.apiKey)?.id,
    reference: provider.apiKey,
    revision: provider.apiKeySelectionRevision,
  };
}
