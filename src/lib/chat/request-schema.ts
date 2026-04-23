import { z } from "zod";
import type { FileNode } from "@/lib/file-system";
import { DEFAULT_MODEL_ID, MODEL_IDS, type ModelId } from "@/lib/ai/models";
import type { AppUIMessage } from "./types";

/**
 * Per-attachment base64-URL size ceiling enforced server-side. 10 MB covers
 * a 2048×2048 JPEG at quality 0.85 (client resizes below this) with margin
 * for the `data:<mime>;base64,` prefix and line breaks. Anything larger is
 * almost certainly abuse or a client bug, so we 400 it instead of paying
 * the serialization cost.
 */
const MAX_FILE_PART_URL_BYTES = 10 * 1024 * 1024;

/**
 * Body shape for POST /api/chat. Opaque shapes (`messages`, `files`) are
 * validated only structurally — their internal shape comes from the AI SDK
 * and the VFS serializer, so re-validating here would just duplicate work
 * and couple this schema to those runtimes.
 *
 * The purpose of the schema is to cut malformed requests (non-JSON body,
 * empty body, wrong shape) before the handler destructures them.
 */
export const ChatRequestSchema = z.object({
  messages: z.array(z.any()),
  files: z.record(z.string(), z.any()),
  projectId: z.string().optional(),
  // Allowlist-validated at the edge: anything outside `MODEL_IDS` → 400,
  // so the handler never passes an untrusted string to the provider.
  model: z.enum(MODEL_IDS).optional(),
});

/**
 * Guard against runaway base64 uploads. Walks user messages for `file`
 * parts and rejects any whose `url` exceeds `MAX_FILE_PART_URL_BYTES`.
 * Assistant messages can carry file parts too (tool outputs), but today
 * they don't carry giant data URLs, so we only scope this to user turns.
 */
function hasOversizedAttachment(messages: unknown[]): boolean {
  for (const msg of messages) {
    if (!msg || typeof msg !== "object") continue;
    const m = msg as { role?: string; parts?: unknown };
    if (m.role !== "user" || !Array.isArray(m.parts)) continue;
    for (const part of m.parts) {
      if (!part || typeof part !== "object") continue;
      const p = part as { type?: string; url?: unknown };
      if (p.type === "file" && typeof p.url === "string" && p.url.length > MAX_FILE_PART_URL_BYTES) {
        return true;
      }
    }
  }
  return false;
}

export interface ParsedChatRequest {
  messages: AppUIMessage[];
  files: Record<string, FileNode>;
  projectId?: string;
  model: ModelId;
}

export async function parseChatRequest(
  req: Request
): Promise<
  | { ok: true; data: ParsedChatRequest }
  | { ok: false; status: number; body: unknown }
> {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return { ok: false, status: 400, body: { error: "Invalid JSON body" } };
  }

  const parsed = ChatRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      body: { error: "Invalid request body", issues: parsed.error.issues },
    };
  }

  if (hasOversizedAttachment(parsed.data.messages)) {
    return {
      ok: false,
      status: 413,
      body: { error: "An attached image exceeds the 10 MB limit." },
    };
  }

  return {
    ok: true,
    data: {
      messages: parsed.data.messages as AppUIMessage[],
      files: parsed.data.files as Record<string, FileNode>,
      projectId: parsed.data.projectId,
      model: parsed.data.model ?? DEFAULT_MODEL_ID,
    },
  };
}
