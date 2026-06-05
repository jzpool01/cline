import { Llms } from "@tarogo/core";

export function shouldShowCliUsageCost(providerId: string): boolean {
	return Llms.shouldShowProviderUsageCost(providerId);
}
