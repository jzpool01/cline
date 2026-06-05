import type { ClineCore } from "@tarogo/core";
import type { Message } from "@tarogo/shared";

export async function loadInteractiveResumeMessages(
	sessionManager: ClineCore,
	resumeSessionId?: string,
): Promise<Message[] | undefined> {
	const target = resumeSessionId?.trim();
	if (!target) {
		return undefined;
	}
	return await sessionManager.readMessages(target);
}
