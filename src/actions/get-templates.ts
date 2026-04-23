"use server";

import { getTemplates } from "@/lib/templates/loader";
import type { TemplateMeta } from "@/lib/templates/loader";

/**
 * Thin server-action wrapper around `getTemplates()` so client components
 * (e.g. the "New Design" picker in the header) can pull the list of
 * available templates without having their parent page prop-drill it
 * through from an RSC.
 */
export async function getTemplatesAction(): Promise<TemplateMeta[]> {
  return getTemplates();
}
