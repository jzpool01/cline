import { resolveSessionBackend, listSessionHistoryFromBackend } from "@cline/core";
import { getCliTelemetryService } from "../utils/telemetry";
import { Command } from "commander";

function fmt(n: number | undefined | null): string {
	const v = n ?? 0;
	if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
	if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
	return String(v);
}

function fmtCost(c: number | undefined | null): string {
	const v = c ?? 0;
	if (v === 0) return "$0.00";
	if (v < 0.01) return `$${v.toFixed(4)}`;
	return `$${v.toFixed(2)}`;
}

interface UsageSummary {
	sessions: number;
	inputTokens: number;
	outputTokens: number;
	cacheReadTokens: number;
	cacheWriteTokens: number;
	totalCost: number;
}

export function createStatusCommand(
	writeln: (msg: string) => void,
	setExitCode: (code: number) => void,
): Command {
	const status = new Command("status")
		.description("Show detailed status and token usage summary")
		.option("--json", "Output as JSON")
		.option("--sessions <count>", "Number of recent sessions to aggregate", "50")
		.action(async function (this: Command) {
			const opts = this.opts<{ json?: boolean; sessions?: string }>();
			const limit = Math.min(parseInt(opts.sessions ?? "50", 10) || 50, 500);

			// 1. Provider config
			const { ProviderSettingsManager } = await import("@cline/core");
			const psm = new ProviderSettingsManager();
			const lastUsed = psm.getLastUsedProviderSettings();
			const providerId = lastUsed?.provider ?? "not configured";
			const modelId = lastUsed?.model ?? "not configured";
			const baseUrl = lastUsed?.baseUrl ?? "(default)";

			// 2. Session usage from history
			let usage: UsageSummary = {
				sessions: 0,
				inputTokens: 0,
				outputTokens: 0,
				cacheReadTokens: 0,
				cacheWriteTokens: 0,
				totalCost: 0,
			};
			try {
				const backend = await resolveSessionBackend({
					telemetry: getCliTelemetryService(),
				});
				const records = await listSessionHistoryFromBackend(backend, {
					limit,
					includeManifestFallback: true,
					hydrate: false,
					includeSubagents: false,
				});
				usage.sessions = records.length;
				for (const r of records) {
					const m = r.metadata;
					const u = m?.usage;
					if (u) {
						usage.inputTokens += u.inputTokens ?? 0;
						usage.outputTokens += u.outputTokens ?? 0;
						usage.cacheReadTokens += u.cacheReadTokens ?? 0;
						usage.cacheWriteTokens += u.cacheWriteTokens ?? 0;
					}
					usage.totalCost += m?.totalCost ?? 0;
				}
			} catch {
				// session backend not available
			}

			// 3. Compute derived stats
			const totalInput = usage.inputTokens + usage.cacheWriteTokens;
			const cacheHitRate =
				totalInput > 0
					? ((usage.cacheReadTokens / totalInput) * 100).toFixed(1)
					: "N/A";

			if (opts.json) {
				const json = {
					provider: providerId,
					model: modelId,
					baseUrl,
					sessions: usage.sessions,
					usage: {
						inputTokens: usage.inputTokens,
						outputTokens: usage.outputTokens,
						cacheReadTokens: usage.cacheReadTokens,
						cacheWriteTokens: usage.cacheWriteTokens,
						cacheHitRate:
							cacheHitRate === "N/A" ? null : parseFloat(cacheHitRate),
						totalCost: usage.totalCost,
					},
				};
				writeln(JSON.stringify(json, null, 2));
				setExitCode(0);
				return;
			}

			// Text output
			writeln("Cline Status");
			writeln("");

			// Provider section
			writeln("  Provider");
			writeln(`    ID:       ${providerId}`);
			writeln(`    Model:    ${modelId}`);
			writeln(`    Base URL: ${baseUrl}`);

			writeln("");

			// Usage section
			if (usage.sessions > 0) {
				writeln(`  Token Usage (last ${usage.sessions} sessions)`);
				writeln(`    Input:          ${fmt(usage.inputTokens)}`);
				writeln(`    Output:         ${fmt(usage.outputTokens)}`);
				writeln(`    Cache Hit:      ${fmt(usage.cacheReadTokens)}`);
				writeln(`    Cache Write:    ${fmt(usage.cacheWriteTokens)}`);
				writeln(`    Cache Hit Rate: ${cacheHitRate}%`);
				writeln(`    Total Cost:     ${fmtCost(usage.totalCost)}`);
			} else {
				writeln("  Token Usage");
				writeln("    No session data found. Start a session with `cline --tui`.");
			}

			setExitCode(0);
		});

	return status;
}
