"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createBlankProject } from "@/actions/create-blank-project";
import { createFromTemplate } from "@/actions/create-from-template";
import { getTemplatesAction } from "@/actions/get-templates";
import type { TemplateMeta } from "@/lib/templates/loader";

/**
 * Fallback glyph for any template that omits the optional `icon` field in
 * its `meta.json`. Deliberately generic so the picker still renders when
 * a template skips the icon.
 */
const FALLBACK_TEMPLATE_ICON = "📄";

export function NewDesignButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!open || templatesLoaded) return;
    getTemplatesAction()
      .then(setTemplates)
      .catch(console.error)
      .finally(() => setTemplatesLoaded(true));
  }, [open, templatesLoaded]);

  const handleBlank = async () => {
    if (loadingSlug) return;
    setLoadingSlug("__blank__");
    try {
      const project = await createBlankProject();
      router.push(`/chat/${project.id}`);
    } catch (err) {
      console.error(err);
      setLoadingSlug(null);
    }
  };

  const handleTemplate = async (slug: string) => {
    if (loadingSlug) return;
    setLoadingSlug(slug);
    try {
      const project = await createFromTemplate(slug);
      router.push(`/chat/${project.id}`);
    } catch (err) {
      console.error(err);
      setLoadingSlug(null);
    }
  };

  const isBusy = loadingSlug !== null;

  return (
    <>
      <Button
        className="flex items-center gap-2 h-8"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" />
        New Design
      </Button>

      <Dialog open={open} onOpenChange={(v) => !isBusy && setOpen(v)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Start a new design
            </DialogTitle>
            <DialogDescription>
              Pick a template to scaffold the project, or start from a
              blank canvas with just the design-system starter files.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleBlank}
              disabled={isBusy}
              className="group flex items-center gap-3 px-4 py-3 bg-white border border-neutral-200 rounded-lg hover:border-neutral-300 hover:shadow-sm text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingSlug === "__blank__" ? (
                <span className="inline-block w-5 h-5 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin flex-shrink-0" />
              ) : (
                <span className="text-xl flex-shrink-0">✨</span>
              )}
              <div className="min-w-0">
                <span className="text-sm font-medium text-neutral-900 block">
                  Blank Canvas
                </span>
                <p className="text-xs text-neutral-500 truncate">
                  Start from scratch
                </p>
              </div>
            </button>

            {templates.map((template) => (
              <button
                key={template.slug}
                onClick={() => handleTemplate(template.slug)}
                disabled={isBusy}
                className="group flex items-center gap-3 px-4 py-3 bg-white border border-neutral-200 rounded-lg hover:border-neutral-300 hover:shadow-sm text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingSlug === template.slug ? (
                  <span className="inline-block w-5 h-5 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin flex-shrink-0" />
                ) : (
                  <span className="text-xl flex-shrink-0">
                    {template.icon ?? FALLBACK_TEMPLATE_ICON}
                  </span>
                )}
                <div className="min-w-0">
                  <span className="text-sm font-medium text-neutral-900 block truncate">
                    {template.name}
                  </span>
                  <p className="text-xs text-neutral-500 truncate">
                    {template.description}
                  </p>
                </div>
              </button>
            ))}

            {templatesLoaded && templates.length === 0 && (
              <p className="col-span-full text-xs text-neutral-500 text-center py-2">
                No templates configured. Add a{" "}
                <code className="font-mono">templates.dir</code> to{" "}
                <code className="font-mono">uigen.config.ts</code> to show
                options here.
              </p>
            )}

            {!templatesLoaded && (
              <div className="col-span-full flex items-center justify-center py-4 text-xs text-neutral-400">
                Loading templates…
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
