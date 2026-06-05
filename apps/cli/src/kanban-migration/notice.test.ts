import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	getTcodeCliMigrationNotice,
	markTcodeCliMigrationNoticeShown,
	resolveCliNoticeStatePath,
} from "./notice";

const tempDirs: string[] = [];

function createTempDataDir(): string {
	const dir = mkdtempSync(join(tmpdir(), "cline-cli-notice-"));
	tempDirs.push(dir);
	return dir;
}

describe("migration notice", () => {
	afterEach(() => {
		for (const dir of tempDirs.splice(0)) {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("returns the notice for a fresh data dir", () => {
		const dataDir = createTempDataDir();

		expect(getTcodeCliMigrationNotice(dataDir)?.title).toBe(
			"Welcome to the new Tarogo CLI",
		);
	});

	it("does not show after the notice is marked as shown", () => {
		const dataDir = createTempDataDir();

		markTcodeCliMigrationNoticeShown(dataDir);

		expect(getTcodeCliMigrationNotice(dataDir)).toBeUndefined();
	});

	it("shows after the notice is marked as shown when forced", () => {
		const dataDir = createTempDataDir();

		markTcodeCliMigrationNoticeShown(dataDir);

		expect(
			getTcodeCliMigrationNotice(dataDir, {
				TCODE_FORCE_MIGRATION_NOTICE: "1",
			}),
		).toBeDefined();
	});

	it("does not show when disabled through the environment", () => {
		const dataDir = createTempDataDir();

		expect(
			getTcodeCliMigrationNotice(dataDir, {
				TCODE_DISABLE_MIGRATION_NOTICE: "1",
			}),
		).toBeUndefined();
	});

	it("shows when forced even if disabled through the environment", () => {
		const dataDir = createTempDataDir();

		expect(
			getTcodeCliMigrationNotice(dataDir, {
				TCODE_DISABLE_MIGRATION_NOTICE: "1",
				TCODE_FORCE_MIGRATION_NOTICE: "1",
			}),
		).toBeDefined();
	});

	it("marks the notice as shown", () => {
		const dataDir = createTempDataDir();

		markTcodeCliMigrationNoticeShown(dataDir);

		const rawState = readFileSync(resolveCliNoticeStatePath(dataDir), "utf8");
		expect(rawState).toContain("cline-cli-tui-default");
		expect(getTcodeCliMigrationNotice(dataDir)).toBeUndefined();
	});
});
