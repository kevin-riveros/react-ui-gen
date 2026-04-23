import type { AppUIMessage } from "./types";

/**
 * Minimum data-URL length that could plausibly contain real image pixels.
 * Anything shorter (bare `data:image/png;base64,` prefix, empty string,
 * stripped-for-persistence placeholder) is treated as "no image" and
 * filtered out before we hand messages to Anthropic — sending an empty
 * image part errors with `image cannot be empty`.
 */
const MIN_VALID_IMAGE_URL_LEN = 200;

function isImageFilePart(
  part: AppUIMessage["parts"][number]
): part is AppUIMessage["parts"][number] & { mediaType: string; url?: string } {
  if (part.type !== "file") return false;
  const mediaType = (part as { mediaType?: string }).mediaType;
  return typeof mediaType === "string" && mediaType.startsWith("image/");
}

function hasUsefulUrl(part: { url?: string }): boolean {
  return typeof part.url === "string" && part.url.length >= MIN_VALID_IMAGE_URL_LEN;
}

/**
 * Produce a deep-enough copy of `messages` with every image-bearing `file`
 * part's `url` replaced by the empty string. Keeps `mediaType`, `filename`,
 * and any other metadata so reloaded projects can still render an
 * `[Image attached]` placeholder.
 *
 * Why strip before persistence:
 *   - The `Project.messages` column is a plain TEXT blob; base64 images
 *     bloat rows and thrash the mid-stream debounced writer.
 *   - Images have already served their purpose in the turn they were
 *     attached to (the model's assistant reply references them); replaying
 *     them on every follow-up would waste Anthropic tokens.
 *
 * Upgrade path: move attachments to a dedicated `Attachment` table and
 * store only IDs in the message. Out of scope for this POC.
 */
export function stripImagePartsForPersistence(
  messages: AppUIMessage[]
): AppUIMessage[] {
  return messages.map((msg) => ({
    ...msg,
    parts: msg.parts.map((part) => {
      // `parts` is an SDK-defined union; the only shape we touch is
      // `{type:"file", mediaType, url}`. Everything else passes through
      // untouched so tool calls, reasoning, and text keep their identity.
      if (isImageFilePart(part)) {
        return { ...part, url: "" } as typeof part;
      }
      return part;
    }),
  }));
}

/**
 * Remove image `file` parts whose `url` is empty or a bare data-URL prefix
 * before handing messages to `convertToModelMessages`. These sneak into
 * the history when:
 *   - A prior turn's screenshot capture returned a blank PNG.
 *   - The user reloaded an older project (persistence stripped the url).
 *   - The UI fired a send with a half-processed attachment.
 * Passing an empty image to Anthropic causes a 400 with
 * `messages.N.content.M.image.source.base64: image cannot be empty`,
 * which poisons the entire conversation until we drop the bad parts.
 */
export function stripEmptyImagePartsForModel(
  messages: AppUIMessage[]
): AppUIMessage[] {
  return messages.map((msg) => ({
    ...msg,
    parts: msg.parts.filter((part) => {
      if (!isImageFilePart(part)) return true;
      return hasUsefulUrl(part);
    }),
  }));
}
