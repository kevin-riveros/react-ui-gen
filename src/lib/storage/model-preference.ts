import { DEFAULT_MODEL_ID, isValidModelId, type ModelId } from "@/lib/ai/models";

/**
 * localStorage key for the user's preferred chat model.
 *
 * Purpose: namespaced under the `uigen.` prefix so we can grep and bulk-clear
 * this app's storage without colliding with other apps on the same origin
 * during local dev. Trade-off: renaming this key orphans existing users'
 * preferences (they'll silently fall back to the default) — do a migration
 * read of the old key if that ever becomes a problem.
 */
const STORAGE_KEY = "uigen.preferred-model";

/**
 * Reads the persisted model preference. Returns `DEFAULT_MODEL_ID` during
 * SSR (no `window`), when nothing is stored, or when the stored value is
 * not in the current allowlist (e.g. an id we removed in a later release).
 */
export function loadModelPreference(): ModelId {
  if (typeof window === "undefined") return DEFAULT_MODEL_ID;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isValidModelId(raw) ? raw : DEFAULT_MODEL_ID;
  } catch {
    return DEFAULT_MODEL_ID;
  }
}

/** Writes the model preference. No-op in SSR or when storage is unavailable. */
export function saveModelPreference(id: ModelId): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Private mode / quota exceeded / disabled storage — preference is
    // ephemeral this session, which is acceptable.
  }
}
