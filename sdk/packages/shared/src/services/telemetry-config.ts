import type { OpenTelemetryClientConfig, TelemetryMetadata } from "./telemetry";

export interface ClineTelemetryServiceConfig extends OpenTelemetryClientConfig {
	metadata: TelemetryMetadata;
}

function getTelemetryBuildTimeConfig(): OpenTelemetryClientConfig {
	// Telemetry is disabled by default to prevent sending data to Cline's servers.
	// The code structure is preserved for compatibility but no telemetry data is collected.
	return {
		enabled: false,
	};
}

export function createClineTelemetryServiceMetadata(
	overrides: Partial<TelemetryMetadata> = {},
): TelemetryMetadata {
	return {
		extension_version: "unknown",
		cline_type: "unknown",
		platform: "terminal",
		platform_version: process?.version || "unknown",
		os_type: process?.platform || "unknown",
		os_version:
			process?.platform === "win32"
				? (process?.env?.OS ?? "unknown")
				: "unknown",
		...overrides,
	};
}

export function createClineTelemetryServiceConfig(
	configOverrides: Partial<ClineTelemetryServiceConfig> = {},
): ClineTelemetryServiceConfig {
	return {
		...getTelemetryBuildTimeConfig(),
		...configOverrides,
		metadata: createClineTelemetryServiceMetadata(configOverrides.metadata),
	};
}
