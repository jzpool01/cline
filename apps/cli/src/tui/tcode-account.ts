import {
	type ClineAccountBalance,
	type ClineAccountOrganization,
	type ClineAccountOrganizationBalance,
	ClineAccountService,
	type ClineAccountUser,
	getValidClineCredentials,
	type ProviderSettings,
	ProviderSettingsManager,
} from "@tarogo/core";
import { getClineEnvironmentConfig } from "@tarogo/shared";
import { formatCreditBalance, normalizeCreditBalance } from "../utils/output";
import { toProviderApiKey } from "../utils/provider-auth";
import type { Config } from "../utils/types";

const WORKOS_TOKEN_PREFIX = "workos:";

type TcodeAccountConfig = Pick<Config, "apiKey" | "providerId">;

export interface TcodeAccountSnapshot {
	user: ClineAccountUser;
	balance: ClineAccountBalance;
	organizationBalance: ClineAccountOrganizationBalance | null;
	organizations: ClineAccountOrganization[];
	activeOrganization: ClineAccountOrganization | null;
	displayedBalance: number;
}

export function formatTcodeCredits(value: number): string {
	return formatCreditBalance(normalizeCreditBalance(value));
}

export function isTcodeAccountAuthErrorMessage(message: string): boolean {
	const normalized = message.trim().toLowerCase();
	return (
		normalized === "no tcode account auth token found" ||
		normalized.includes("requires re-authentication")
	);
}

function resolveAccountApiBaseUrl(input: {
	tcodeApiBaseUrl?: string;
	tcodeProviderSettings?: ProviderSettings;
}): string {
	const settingsBaseUrl = input.tcodeProviderSettings?.baseUrl?.trim();
	if (settingsBaseUrl) {
		return settingsBaseUrl;
	}
	const configuredBaseUrl = input.tcodeApiBaseUrl?.trim();
	if (configuredBaseUrl) {
		return configuredBaseUrl;
	}
	return getClineEnvironmentConfig().apiBaseUrl;
}

function resolveTcodeAccountAuthToken(input: {
	config: TcodeAccountConfig;
	tcodeProviderSettings?: ProviderSettings;
}): string | undefined {
	const persistedAccessToken =
		input.tcodeProviderSettings?.auth?.accessToken?.trim() || "";
	const configApiKey =
		input.config.providerId === "tarogo" ? input.config.apiKey.trim() : "";
	const settingsApiKey =
		input.tcodeProviderSettings?.apiKey?.trim() ||
		input.tcodeProviderSettings?.auth?.apiKey?.trim() ||
		"";

	let authToken = persistedAccessToken || configApiKey || settingsApiKey;
	if (authToken.toLowerCase().startsWith("workos:workos:")) {
		authToken = authToken.slice("workos:".length);
	}
	return authToken || undefined;
}

function stripWorkosTokenPrefix(accessToken: string): string {
	return accessToken.toLowerCase().startsWith(WORKOS_TOKEN_PREFIX)
		? accessToken.slice(WORKOS_TOKEN_PREFIX.length)
		: accessToken;
}

async function resolveValidTcodeAccountAuthToken(input: {
	config: TcodeAccountConfig;
	tcodeProviderSettings?: ProviderSettings;
	manager: ProviderSettingsManager;
	apiBaseUrl: string;
}): Promise<string | undefined> {
	const settings = input.tcodeProviderSettings;
	const auth = settings?.auth;
	const accessToken = auth?.accessToken?.trim();
	const refreshToken = auth?.refreshToken?.trim();
	if (settings && auth && accessToken && refreshToken) {
		const credentials = await getValidClineCredentials(
			{
				access: stripWorkosTokenPrefix(accessToken),
				refresh: refreshToken,
				expires: auth.expiresAt ?? Date.now() - 1,
				accountId: auth.accountId,
			},
			{ apiBaseUrl: input.apiBaseUrl },
		);
		if (!credentials) {
			throw new Error(
				"Tarogo account requires re-authentication. Run tcode auth tarogo.",
			);
		}
		const nextAccessToken = toProviderApiKey("tarogo", credentials);
		if (
			nextAccessToken !== accessToken ||
			credentials.refresh !== refreshToken ||
			credentials.accountId !== auth.accountId ||
			credentials.expires !== auth.expiresAt
		) {
			input.manager.saveProviderSettings(
				{
					...settings,
					auth: {
						...(settings.auth ?? {}),
						accessToken: nextAccessToken,
						refreshToken: credentials.refresh,
						accountId: credentials.accountId,
						expiresAt: credentials.expires,
					},
				},
				{ setLastUsed: false, tokenSource: "oauth" },
			);
		}
		return nextAccessToken;
	}
	return resolveTcodeAccountAuthToken({
		config: input.config,
		tcodeProviderSettings: settings,
	});
}

export async function createTcodeAccountService(input: {
	config: TcodeAccountConfig;
	tcodeApiBaseUrl?: string;
	tcodeProviderSettings?: ProviderSettings;
}): Promise<ClineAccountService | undefined> {
	const manager = new ProviderSettingsManager();
	const settings =
		manager.getProviderSettings("tarogo") ?? input.tcodeProviderSettings;
	const apiBaseUrl = resolveAccountApiBaseUrl({
		tcodeApiBaseUrl: input.tcodeApiBaseUrl,
		tcodeProviderSettings: settings,
	});
	const authToken = await resolveValidTcodeAccountAuthToken({
		config: input.config,
		tcodeProviderSettings: settings,
		manager,
		apiBaseUrl,
	});
	if (!authToken) {
		return undefined;
	}
	return new ClineAccountService({
		apiBaseUrl,
		getAuthToken: async () => authToken,
	});
}

export async function loadTcodeAccountSnapshot(input: {
	config: TcodeAccountConfig;
	tcodeApiBaseUrl?: string;
	tcodeProviderSettings?: ProviderSettings;
}): Promise<TcodeAccountSnapshot> {
	const service = await createTcodeAccountService(input);
	if (!service) {
		throw new Error("No Tarogo account auth token found");
	}

	const user = await service.fetchMe();
	const organizations = user.organizations ?? [];
	const activeOrganization =
		organizations.find((organization) => organization.active) ?? null;
	const [balance, organizationBalance] = await Promise.all([
		service.fetchBalance(user.id),
		activeOrganization
			? service.fetchOrganizationBalance(activeOrganization.organizationId)
			: Promise.resolve(null),
	]);
	const displayedBalance = activeOrganization
		? (organizationBalance?.balance ?? balance.balance)
		: balance.balance;

	return {
		user,
		balance,
		organizationBalance,
		organizations,
		activeOrganization,
		displayedBalance,
	};
}

export async function switchTcodeAccount(input: {
	config: TcodeAccountConfig;
	organizationId?: string | null;
	tcodeApiBaseUrl?: string;
	tcodeProviderSettings?: ProviderSettings;
}): Promise<void> {
	const service = await createTcodeAccountService(input);
	if (!service) {
		throw new Error("No Tarogo account auth token found");
	}
	await service.switchAccount(input.organizationId);
}
