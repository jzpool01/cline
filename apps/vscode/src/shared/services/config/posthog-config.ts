import { BUILD_CONSTANTS } from "../../constants"

export interface PostHogClientConfig {
	/**
	 * The main API key for PostHog telemetry service.
	 */
	apiKey?: string | undefined
	/**
	 * The API key for PostHog used only for error tracking service.
	 */
	errorTrackingApiKey?: string | undefined
	enableErrorAutocapture?: boolean
	host: string
	uiHost: string
}

/**
 * Helper type for a valid PostHog client configuration.
 * Must contains api keys for both telemetry and error tracking.
 */
export interface PostHogClientValidConfig extends PostHogClientConfig {
	apiKey: string
	errorTrackingApiKey: string
}

/**
 * PostHog configuration - telemetry is disabled to prevent sending data to external servers.
 */
export const posthogConfig: PostHogClientConfig = {
	apiKey: undefined,
	errorTrackingApiKey: undefined,
	host: "",
	uiHost: "",
}

const isTestEnv = process.env.E2E_TEST === "true" || process.env.IS_TEST === "true"

export function isPostHogConfigValid(config: PostHogClientConfig): config is PostHogClientValidConfig {
	// Allow invalid config in test environment to enable mocking and stubbing
	if (isTestEnv) {
		return false
	}
	return (
		typeof config.apiKey === "string" &&
		typeof config.errorTrackingApiKey === "string" &&
		typeof config.host === "string" &&
		typeof config.uiHost === "string"
	)
}
