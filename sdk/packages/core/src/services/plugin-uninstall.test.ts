import { chmodSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTcodeDir, setHomeDir } from "@tarogo/shared/storage";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readGlobalSettings, writeGlobalSettings } from "./global-settings";
import { uninstallPlugin } from "./plugin-uninstall";

describe("plugin uninstall service", () => {
	let root = "";
	let home = "";
	let originalHome: string | undefined;
	let originalTcodeDir: string | undefined;
	let originalTcodeDataDir: string | undefined;
	let originalGlobalSettingsPath: string | undefined;

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "core-plugin-uninstall-"));
		home = join(root, "home");
		originalHome = process.env.HOME;
		originalTcodeDir = process.env.TCODE_DIR;
		originalTcodeDataDir = process.env.TCODE_DATA_DIR;
		originalGlobalSettingsPath = process.env.TCODE_GLOBAL_SETTINGS_PATH;
		process.env.HOME = home;
		process.env.TCODE_DIR = join(home, ".tcode");
		process.env.TCODE_DATA_DIR = join(home, ".tcode", "data");
		process.env.TCODE_GLOBAL_SETTINGS_PATH = join(
			home,
			".tcode",
			"data",
			"settings",
			"global-settings.json",
		);
		setHomeDir(home);
		setTcodeDir(process.env.TCODE_DIR);
	});

	afterEach(() => {
		if (originalHome === undefined) {
			delete process.env.HOME;
		} else {
			process.env.HOME = originalHome;
		}
		if (originalTcodeDir === undefined) {
			delete process.env.TCODE_DIR;
		} else {
			process.env.TCODE_DIR = originalTcodeDir;
		}
		if (originalTcodeDataDir === undefined) {
			delete process.env.TCODE_DATA_DIR;
		} else {
			process.env.TCODE_DATA_DIR = originalTcodeDataDir;
		}
		if (originalGlobalSettingsPath === undefined) {
			delete process.env.TCODE_GLOBAL_SETTINGS_PATH;
		} else {
			process.env.TCODE_GLOBAL_SETTINGS_PATH = originalGlobalSettingsPath;
		}
		rmSync(root, { recursive: true, force: true });
	});

	it("uninstalls an installed package plugin by package name", async () => {
		const installPath = join(
			home,
			".tcode",
			"plugins",
			"_installed",
			"local",
			"bundled-skills-demo-123456789abc",
		);
		const entryPath = join(installPath, "package", "index.ts");
		await mkdir(join(installPath, "package"), { recursive: true });
		await writeFile(
			join(installPath, "package.json"),
			JSON.stringify(
				{
					name: "cline-installed-plugin-test",
					cline: {
						plugins: [{ paths: ["./package/index.ts"] }],
					},
				},
				null,
				2,
			),
			"utf8",
		);
		await writeFile(
			join(installPath, "package", "package.json"),
			JSON.stringify({ name: "cline-internal-bundled-skills-demo" }, null, 2),
			"utf8",
		);
		await writeFile(
			entryPath,
			"export default { name: 'demo', manifest: { capabilities: ['skills'] } };",
			"utf8",
		);
		writeGlobalSettings({
			disabledPlugins: [entryPath, "/tmp/other-plugin.ts"],
		});

		const result = await uninstallPlugin({
			name: "cline-internal-bundled-skills-demo",
		});

		expect(result.installPath).toBe(installPath);
		expect(existsSync(installPath)).toBe(false);
		expect(readGlobalSettings()).toEqual({
			disabledPlugins: ["/tmp/other-plugin.ts"],
			telemetryOptOut: false,
		});
	});

	it("uninstalls a direct plugin file by path", async () => {
		const pluginPath = join(home, ".tcode", "plugins", "direct-plugin.ts");
		await mkdir(join(home, ".tcode", "plugins"), { recursive: true });
		await writeFile(
			pluginPath,
			"export default { name: 'direct', manifest: { capabilities: ['tools'] } };",
			"utf8",
		);

		const result = await uninstallPlugin({ path: pluginPath });

		expect(result.installPath).toBe(pluginPath);
		expect(existsSync(pluginPath)).toBe(false);
	});

	it("keeps disabled plugin settings if file deletion fails", async () => {
		const pluginRoot = join(home, ".tcode", "plugins");
		const pluginPath = join(pluginRoot, "locked-plugin.ts");
		await mkdir(pluginRoot, { recursive: true });
		await writeFile(
			pluginPath,
			"export default { name: 'locked', manifest: { capabilities: ['tools'] } };",
			"utf8",
		);
		writeGlobalSettings({ disabledPlugins: [pluginPath] });
		chmodSync(pluginRoot, 0o555);

		try {
			await expect(uninstallPlugin({ path: pluginPath })).rejects.toThrow();
			expect(existsSync(pluginPath)).toBe(true);
			expect(readGlobalSettings()).toEqual({
				disabledPlugins: [pluginPath],
				telemetryOptOut: false,
			});
		} finally {
			chmodSync(pluginRoot, 0o755);
		}
	});

	it("reports unmatched names clearly", async () => {
		await expect(uninstallPlugin({ name: "missing-plugin" })).rejects.toThrow(
			/No plugin found matching "missing-plugin"/,
		);
	});
});
