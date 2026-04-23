"use client";

import { useMemo, useState } from "react";
import { Download, AlertTriangle } from "lucide-react";
import JSZip from "jszip";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFileSystem } from "@/lib/contexts/file-system-context";
import {
  buildPackageJson,
  buildReadme,
  collectUsedPackages,
  safeProjectName,
} from "@/lib/export/project-export";

interface DownloadZipButtonProps {
  projectName?: string;
}

export function DownloadZipButton({ projectName }: DownloadZipButtonProps) {
  const { getAllFiles } = useFileSystem();
  const [open, setOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const snapshot = useMemo(() => {
    if (!open) return null;
    const files = getAllFiles();
    const packages = collectUsedPackages(files);
    return { files, packages };
  }, [open, getAllFiles]);

  const displayName = projectName?.trim() || "UI Gen Project";
  const packageSlug = safeProjectName(projectName);

  const handleDownload = async () => {
    if (!snapshot || isBusy) return;
    setIsBusy(true);
    try {
      const { files, packages } = snapshot;
      const zip = new JSZip();

      for (const [path, content] of files) {
        zip.file(path.replace(/^\/+/, ""), content);
      }

      zip.file(
        "package.json",
        buildPackageJson(packageSlug, displayName, packages)
      );
      zip.file("README.md", buildReadme(displayName));

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${packageSlug}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setOpen(false);
    } finally {
      setIsBusy(false);
    }
  };

  const fileCount = snapshot?.files.size ?? 0;
  const packageList = snapshot ? Array.from(snapshot.packages).sort() : [];

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setOpen(true)}
            className="p-1.5 rounded transition-colors text-neutral-500 hover:text-neutral-700"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Download project as ZIP</TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download source code
            </DialogTitle>
            <DialogDescription>
              Export <span className="font-medium">{displayName}</span> as
              a ZIP.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 text-sm">
            <div className="flex gap-3 p-3 rounded-md border border-amber-200 bg-amber-50 text-amber-900">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex flex-col gap-1">
                <p className="font-medium">
                  This is a POC export — not a production-ready app.
                </p>
                <p className="text-amber-800">
                  UI Gen does not run Node.js in the browser. There is no
                  real <code className="font-mono text-xs">node_modules</code>,
                  no bundler, and no build step — the live preview uses
                  Babel + an import map against esm.sh inside a sandboxed
                  iframe. The ZIP only contains the files from the virtual
                  file system plus a best-effort{" "}
                  <code className="font-mono text-xs">package.json</code>{" "}
                  and a <code className="font-mono text-xs">README.md</code>.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="font-medium text-neutral-800">What you get</p>
              <ul className="list-disc list-inside text-neutral-600 space-y-1">
                <li>
                  <span className="font-medium text-neutral-800">
                    {fileCount}
                  </span>{" "}
                  file{fileCount === 1 ? "" : "s"} from the VFS.
                </li>
                <li>
                  A generated{" "}
                  <code className="font-mono text-xs">package.json</code>{" "}
                  with React + {packageList.length} detected npm
                  package{packageList.length === 1 ? "" : "s"} (versions
                  pinned to <code className="font-mono text-xs">latest</code>).
                </li>
                <li>
                  A <code className="font-mono text-xs">README.md</code>{" "}
                  explaining caveats and how to wire the components into
                  Vite, Next.js, or any other React host.
                </li>
              </ul>
            </div>

            {packageList.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="font-medium text-neutral-800">
                  Detected packages
                </p>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  {packageList.map((pkg) => (
                    <span
                      key={pkg}
                      className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200"
                    >
                      {pkg}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-neutral-500">
              Private design-system packages may not resolve on a plain{" "}
              <code className="font-mono text-xs">npm install</code>.
              Expect to clean up imports and styling when running the
              project standalone. See the README inside the ZIP for the
              full checklist.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isBusy}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDownload}
              disabled={isBusy || fileCount === 0}
            >
              <Download className="w-4 h-4" />
              {isBusy ? "Packaging…" : "Download source code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
