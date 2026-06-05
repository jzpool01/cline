/**
 * `BUILD_CONSTANTS` represent the variables that will be overwriten at build-time with predefined values.
 * Once the extension has been built, the values in this object will be fixed.
 *
 * @see [esbuild.mjs](../../esbuild.mjs)
 * @see {@link https://esbuild.github.io/api/#define|docs}
 */
export const BUILD_CONSTANTS = {
	TELEMETRY_SERVICE_API_KEY: undefined,
	ERROR_SERVICE_API_KEY: undefined,
	ENABLE_ERROR_AUTOCAPTURE: undefined,
	OTEL_TELEMETRY_ENABLED: undefined,
	OTEL_METRICS_EXPORTER: undefined,
	OTEL_LOGS_EXPORTER: undefined,
	OTEL_EXPORTER_OTLP_PROTOCOL: undefined,
	OTEL_EXPORTER_OTLP_ENDPOINT: undefined,
	OTEL_EXPORTER_OTLP_HEADERS: undefined,
	OTEL_METRIC_EXPORT_INTERVAL: undefined,
}
