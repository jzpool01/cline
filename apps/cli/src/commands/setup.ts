import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { resolveClineDataDir } from "@cline/core";
import { Command } from "commander";

const DEFAULT_MCP_SERVERS: Record<string, unknown> = {
	"browser-use": {
		command: "npx",
		args: ["-y", "@anthropic/browser-use-mcp"],
	},
	playwright: {
		command: "npx",
		args: ["-y", "@playwright/mcp"],
	},
};

function getMcpSettingsPath(): string {
	return join(resolveClineDataDir(), "mcp.json");
}

function writeMcpConfig(servers: Record<string, unknown>): string {
	const configPath = getMcpSettingsPath();
	const dir = dirname(configPath);
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}

	let existing: Record<string, unknown> = {};
	if (existsSync(configPath)) {
		try {
			existing = JSON.parse(readFileSync(configPath, "utf-8")) as Record<
				string,
				unknown
			>;
		} catch {
			// ignore broken config
		}
	}

	const existingServers =
		(existing.mcpServers as Record<string, unknown> | undefined) ?? {};
	const mergedServers = { ...servers, ...existingServers };
	const config = { mcpServers: mergedServers };
	writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
	return configPath;
}

async function installPlaywright(io: { log: (msg: string) => void }): Promise<boolean> {
	io.log("Installing Playwright browsers (Chromium)...");
	const result = spawnSync("npx", ["playwright", "install", "chromium"], {
		cwd: join(homedir(), ".cline"),
		stdio: "inherit",
		timeout: 300_000,
	});
	return result.status === 0;
}

export function createSetupCommand(
	writeln: (msg: string) => void,
	writeErr: (msg: string) => void,
	setExitCode: (code: number) => void,
): Command {
	const setup = new Command("setup")
		.description("Install and configure built-in plugins (MCP servers, Playwright browser)")
		.option("--skip-browser", "Skip Playwright browser installation")
		.option("--dry-run", "Show what would be installed without making changes")
		.action(async function (this: Command) {
			const opts = this.opts<{ skipBrowser?: boolean; dryRun?: boolean }>();

			writeln("Cline Setup - Installing built-in plugins");
			writeln("");

			// Step 1: MCP config
			const configPath = getMcpSettingsPath();
			if (opts.dryRun) {
				writeln(`[dry-run] Would write MCP config to: ${configPath}`);
				for (const [name, server] of Object.entries(DEFAULT_MCP_SERVERS)) {
					const srv = server as { command: string; args?: string[] };
					writeln(`  - ${name}: ${srv.command} ${(srv.args ?? []).join(" ")}`);
				}
			} else {
				writeMcpConfig(DEFAULT_MCP_SERVERS);
				writeln(`✓ MCP config written: ${configPath}`);
				for (const [name, server] of Object.entries(DEFAULT_MCP_SERVERS)) {
					const srv = server as { command: string; args?: string[] };
					writeln(`  - ${name}: ${srv.command} ${(srv.args ?? []).join(" ")}`);
				}
			}

			writeln("");

			// Step 2: Playwright browsers
			if (!opts.skipBrowser) {
				if (opts.dryRun) {
					writeln("[dry-run] Would install Playwright Chromium (~300MB)");
				} else {
					writeln("Installing Playwright Chromium (required for browser-use MCP)...");
					const ok = await installPlaywright({ log: writeln });
					if (ok) {
						writeln("✓ Playwright Chromium installed");
					} else {
						writeErr("✗ Playwright installation failed");
						writeln("  You can retry later with: npx playwright install chromium");
					}
				}
			}

			writeln("");
			writeln("Setup complete!");
			if (!opts.skipBrowser) {
				writeln("Restart cline with --tui to start using browser automation.");
			}
			setExitCode(0);
		});

	return setup;
}
