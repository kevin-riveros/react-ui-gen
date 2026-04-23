import type { InferUITools, UIMessage } from "ai";
import type { buildReadTool } from "@/lib/tools/read";
import type { buildWriteTool } from "@/lib/tools/write";
import type { buildEditTool } from "@/lib/tools/edit";
import type { buildGrepTool } from "@/lib/tools/grep";
import type { buildFileManagerTool } from "@/lib/tools/file-manager";
import type { buildSkillTool } from "@/lib/tools/skill";

/** Per-message metadata we attach via `toUIMessageStreamResponse.messageMetadata`. */
export interface ChatMetadata {
  /** Server-assigned at start-of-stream, missing on messages persisted before we added this. */
  createdAt?: number;
  /** Error-stub message persisted by `onError` so users see failures on reload. */
  isError?: boolean;
}

/** Data parts (custom `data-*` stream parts). We don't use any yet. */
export type ChatDataParts = Record<string, never>;

/**
 * The tool surface the chat exposes to the model. Using `InferUITools` on the
 * concrete tool builders keeps the input/output shapes in sync with each
 * tool's Zod schema — no drift between route wiring and UI rendering.
 */
export type AppTools = InferUITools<{
  Read: ReturnType<typeof buildReadTool>;
  Write: ReturnType<typeof buildWriteTool>;
  Edit: ReturnType<typeof buildEditTool>;
  Grep: ReturnType<typeof buildGrepTool>;
  FileManager: ReturnType<typeof buildFileManagerTool>;
  Skill: ReturnType<typeof buildSkillTool>;
}>;

/** The app's concrete UIMessage — use instead of bare `UIMessage` everywhere. */
export type AppUIMessage = UIMessage<ChatMetadata, ChatDataParts, AppTools>;
