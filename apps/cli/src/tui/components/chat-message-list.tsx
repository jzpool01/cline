import "opentui-spinner/react";
import type { AgentMode } from "@tarogo/core";
import type { ScrollBoxRenderable } from "@opentui/core";
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import type { TranscriptCommand } from "../hooks/transcript-keybinds";
import { useTerminalTheme } from "../hooks/use-terminal-background";
import { getModeAccent } from "../palette";
import type { ChatEntry } from "../types";
import { ChatEntryView } from "./chat-entry";

export interface TranscriptScrollHandle {
	runTranscriptCommand: (command: TranscriptCommand) => void;
}

interface ChatMessageListProps {
	entries: ChatEntry[];
	isStreaming?: boolean;
	uiMode?: AgentMode;
}

export const ChatMessageList = forwardRef<
	TranscriptScrollHandle,
	ChatMessageListProps
>(function ChatMessageList(props, ref) {
	const scrollboxRef = useRef<ScrollBoxRenderable | null>(null);
	const lastEntry = props.entries.at(-1);
	const terminalTheme = useTerminalTheme();
	const accent = getModeAccent(props.uiMode ?? "act", terminalTheme);
	const userSubmissionScrollKey =
		lastEntry?.kind === "user_submitted" ? props.entries.length : 0;
	const [hasNewBelow, setHasNewBelow] = useState(false);
	const prevEntryCountRef = useRef(props.entries.length);
	const isManuallyScrolledRef = useRef(false);

	const checkAtBottom = useCallback(() => {
		const scrollbox = scrollboxRef.current;
		if (!scrollbox) return true;
		return scrollbox.scrollTop + scrollbox.height >= scrollbox.scrollHeight - 1;
	}, []);

	// Detect new content arriving while scrolled up
	useEffect(() => {
		if (props.entries.length <= prevEntryCountRef.current) {
			prevEntryCountRef.current = props.entries.length;
			return;
		}
		prevEntryCountRef.current = props.entries.length;
		if (isManuallyScrolledRef.current && !checkAtBottom()) {
			setHasNewBelow(true);
		}
	}, [props.entries.length, checkAtBottom]);

	// Reset manual scroll flag on user-initiated scroll via shortcuts
	const markManualScroll = useCallback(() => {
		isManuallyScrolledRef.current = true;
	}, []);

	const runTranscriptCommand = useCallback((command: TranscriptCommand) => {
		const scrollbox = scrollboxRef.current;
		if (!scrollbox) return;

		markManualScroll();

		switch (command) {
			case "messages_page_up":
				scrollbox.scrollBy(-scrollbox.height / 2);
				return;
			case "messages_page_down":
				scrollbox.scrollBy(scrollbox.height / 2);
				return;
			case "messages_half_page_up":
				scrollbox.scrollBy(-scrollbox.height / 4);
				return;
			case "messages_half_page_down":
				scrollbox.scrollBy(scrollbox.height / 4);
				return;
			case "messages_line_up":
				scrollbox.scrollBy(-1);
				return;
			case "messages_line_down":
				scrollbox.scrollBy(1);
				return;
			case "messages_first":
				scrollbox.scrollTo(0);
				return;
			case "messages_last":
				scrollbox.scrollTo(scrollbox.scrollHeight);
				setHasNewBelow(false);
				isManuallyScrolledRef.current = false;
				return;
		}
	}, [markManualScroll]);

	useImperativeHandle(
		ref,
		() => ({
			runTranscriptCommand,
		}),
		[runTranscriptCommand],
	);

	useEffect(() => {
		if (!userSubmissionScrollKey) return;

		const scrollTo = () => {
			const scrollbox = scrollboxRef.current;
			if (!scrollbox) return;
			scrollbox.scrollTo(scrollbox.scrollHeight);
		};

		scrollTo();
		queueMicrotask(scrollTo);
		const timeout = setTimeout(scrollTo, 0);
		return () => clearTimeout(timeout);
	}, [userSubmissionScrollKey]);

	return (
		<scrollbox
			ref={scrollboxRef}
			flexGrow={1}
			stickyScroll
			stickyStart="bottom"
			verticalScrollbarOptions={{
				showArrows: true,
				trackOptions: {
					foregroundColor: "#888888",
					backgroundColor: terminalTheme === "dark" ? "#333333" : "#dddddd",
				},
			}}
		>
			<box flexDirection="column" paddingX={1} paddingY={1} gap={1}>
				{props.entries.map((entry, i) => {
					const key = `${i}:${entry.kind}`;
					return (
						<ChatEntryView
							key={key}
							entry={entry}
							accent={accent}
							terminalTheme={terminalTheme}
						/>
					);
				})}
				{props.isStreaming && (
					<box flexDirection="row" gap={1}>
						<spinner name="dots" color={accent} />
						<text fg="gray">Thinking... (esc to cancel)</text>
					</box>
				)}
			</box>
			{hasNewBelow && (
				<box
					position="absolute"
					bottom={0}
					width="100%"
					backgroundColor={accent}
					paddingX={1}
					paddingY={0}
				>
					<text fg="black"> ▼ New messages below (Ctrl+Alt+G)</text>
				</box>
			)}
		</scrollbox>
	);
});
