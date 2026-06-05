import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	AGENT_CONFIG_DIRECTORY_NAME,
	TCODE_MCP_SETTINGS_FILE_NAME,
	HOOKS_CONFIG_DIRECTORY_NAME,
	RULES_CONFIG_DIRECTORY_NAME,
	resolveAgentsConfigDirPath,
	resolveTcodeDataDir,
	resolveDbDataDir,
	resolveGlobalAgentsRulesPath,
	resolveGlobalSettingsPath,
	resolveHooksConfigSearchPaths,
	resolveMcpSettingsPath,
	resolveProviderSettingsPath,
	resolveRulesConfigSearchPaths,
	resolveSessionDataDir,
	resolveTeamDataDir,
	resolveWorkflowsConfigSearchPaths,
} from "./paths";

type EnvSnapshot = {
	TCODE_DIR: string | undefined;
	TCODE_DATA_DIR: string | undefined;
	TCODE_DB_DATA_DIR: string | undefined;
	TCODE_GLOBAL_SETTINGS_PATH: string | undefined;
	TCODE_MCP_SETTINGS_PATH: string | undefined;
	TCODE_PROVIDER_SETTINGS_PATH: string | undefined;
	TCODE_SESSION_DATA_DIR: string | undefined;
	TCODE_TEAM_DATA_DIR: string | undefined;
};

function captureEnv(): EnvSnapshot {
	return {
		TCODE_DIR: process.env.TCODE_DIR,
		TCODE_DATA_DIR: process.env.TCODE_DATA_DIR,
		TCODE_DB_DATA_DIR: process.env.TCODE_DB_DATA_DIR,
		TCODE_GLOBAL_SETTINGS_PATH: process.env.TCODE_GLOBAL_SETTINGS_PATH,
		TCODE_MCP_SETTINGS_PATH: process.env.TCODE_MCP_SETTINGS_PATH,
		TCODE_PROVIDER_SETTINGS_PATH: process.env.TCODE_PROVIDER_SETTINGS_PATH,
		TCODE_SESSION_DATA_DIR: process.env.TCODE_SESSION_DATA_DIR,
		TCODE_TEAM_DATA_DIR: process.env.TCODE_TEAM_DATA_DIR,
	};
}

function restoreEnv(snapshot: EnvSnapshot): void {
	process.env.TCODE_DATA_DIR = snapshot.TCODE_DATA_DIR;
	process.env.TCODE_DIR = snapshot.TCODE_DIR;
	process.env.TCODE_DB_DATA_DIR = snapshot.TCODE_DB_DATA_DIR;
	process.env.TCODE_GLOBAL_SETTINGS_PATH = snapshot.TCODE_GLOBAL_SETTINGS_PATH;
	process.env.TCODE_MCP_SETTINGS_PATH = snapshot.TCODE_MCP_SETTINGS_PATH;
	process.env.TCODE_PROVIDER_SETTINGS_PATH =
		snapshot.TCODE_PROVIDER_SETTINGS_PATH;
	process.env.TCODE_SESSION_DATA_DIR = snapshot.TCODE_SESSION_DATA_DIR;
	process.env.TCODE_TEAM_DATA_DIR = snapshot.TCODE_TEAM_DATA_DIR;
}

describe("storage path resolution", () => {
	let snapshot: EnvSnapshot = captureEnv();

	afterEach(() => {
		restoreEnv(snapshot);
	});

	it("uses TCODE_DATA_DIR as-is when set", () => {
		snapshot = captureEnv();
		process.env.TCODE_DATA_DIR = "/tmp/cline-data";

		expect(resolveTcodeDataDir()).toBe("/tmp/cline-data");
	});

	it("falls back to TCODE_DATA_DIR/sessions for session storage", () => {
		snapshot = captureEnv();
		delete process.env.TCODE_SESSION_DATA_DIR;
		process.env.TCODE_DATA_DIR = "/tmp/cline-data";

		expect(resolveSessionDataDir()).toBe(join("/tmp/cline-data", "sessions"));
	});

	it("falls back to TCODE_DATA_DIR/teams for team storage", () => {
		snapshot = captureEnv();
		delete process.env.TCODE_TEAM_DATA_DIR;
		process.env.TCODE_DATA_DIR = "/tmp/cline-data";

		expect(resolveTeamDataDir()).toBe(join("/tmp/cline-data", "teams"));
	});

	it("falls back to TCODE_DATA_DIR/db for sqlite storage", () => {
		snapshot = captureEnv();
		delete process.env.TCODE_DB_DATA_DIR;
		process.env.TCODE_DATA_DIR = "/tmp/cline-data";

		expect(resolveDbDataDir()).toBe(join("/tmp/cline-data", "db"));
	});

	it("falls back to TCODE_DATA_DIR/settings/providers.json for provider settings", () => {
		snapshot = captureEnv();
		delete process.env.TCODE_PROVIDER_SETTINGS_PATH;
		process.env.TCODE_DATA_DIR = "/tmp/cline-data";

		expect(resolveProviderSettingsPath()).toBe(
			join("/tmp/cline-data", "settings", "providers.json"),
		);
	});

	it("falls back to TCODE_DATA_DIR/settings/global-settings.json for global settings", () => {
		snapshot = captureEnv();
		delete process.env.TCODE_GLOBAL_SETTINGS_PATH;
		process.env.TCODE_DATA_DIR = "/tmp/cline-data";

		expect(resolveGlobalSettingsPath()).toBe(
			join("/tmp/cline-data", "settings", "global-settings.json"),
		);
	});

	it("falls back to TCODE_DATA_DIR/settings/tcode_mcp_settings.json for MCP settings", () => {
		snapshot = captureEnv();
		delete process.env.TCODE_MCP_SETTINGS_PATH;
		process.env.TCODE_DATA_DIR = "/tmp/cline-data";

		expect(resolveMcpSettingsPath()).toBe(
			join("/tmp/cline-data", "settings", TCODE_MCP_SETTINGS_FILE_NAME),
		);
	});

	it("falls back to ~/.cline/.agents for agent configs", () => {
		snapshot = captureEnv();
		process.env.TCODE_DIR = "/tmp/home/.cline";

		expect(resolveAgentsConfigDirPath()).toBe(
			join("/tmp/home", ".tcode", AGENT_CONFIG_DIRECTORY_NAME),
		);
	});

	it("resolves global hooks from ~/.cline", () => {
		snapshot = captureEnv();
		process.env.TCODE_DIR = "/tmp/home/.cline";
		process.env.TCODE_DATA_DIR = "/tmp/home/.cline/data";

		expect(resolveHooksConfigSearchPaths()).toEqual(
			expect.arrayContaining([
				join("/tmp/home", ".tcode", HOOKS_CONFIG_DIRECTORY_NAME),
			]),
		);
		expect(resolveHooksConfigSearchPaths()).not.toContain(
			join("/tmp/home", ".tcode", "data", HOOKS_CONFIG_DIRECTORY_NAME),
		);
	});

	it("resolves global rules from ~/.cline", () => {
		snapshot = captureEnv();
		process.env.TCODE_DIR = "/tmp/home/.cline";
		process.env.TCODE_DATA_DIR = "/tmp/home/.cline/data";

		expect(resolveRulesConfigSearchPaths()).toEqual(
			expect.arrayContaining([
				resolveGlobalAgentsRulesPath(),
				join("/tmp/home", ".tcode", RULES_CONFIG_DIRECTORY_NAME),
			]),
		);
		expect(resolveRulesConfigSearchPaths()).not.toContain(
			join("/tmp/home", ".tcode", "data", RULES_CONFIG_DIRECTORY_NAME),
		);
	});

	it("resolves legacy and new workflow paths, with .cline paths later for duplicate-name precedence", () => {
		snapshot = captureEnv();
		process.env.TCODE_DIR = "/tmp/home/.cline";
		const workspacePath = "/repo/demo";

		const paths = resolveWorkflowsConfigSearchPaths(workspacePath);

		expect(paths).toEqual([
			join(workspacePath, ".clinerules", "workflows"),
			expect.stringContaining(join("Documents", "Cline", "Workflows")),
			join("/tmp/home", ".tcode", "workflows"),
			join(workspacePath, ".tcode", "workflows"),
		]);
	});
});
