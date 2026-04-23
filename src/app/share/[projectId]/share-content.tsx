"use client";

import Link from "next/link";
import { FileSystemProvider } from "@/lib/contexts/file-system-context";
import { PreviewFrame } from "@/components/preview/PreviewFrame";
import type { FileNode } from "@/lib/file-system";
import { ArrowLeft, MessageSquare } from "lucide-react";

interface ShareContentProps {
  project: {
    id: string;
    name: string;
    data: Record<string, FileNode>;
    createdAt: Date;
  };
}

export function ShareContent({ project }: ShareContentProps) {
  return (
    <FileSystemProvider initialData={project.data}>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-white">
        {/* Fullscreen iframe */}
        <div className="flex-1 relative overflow-hidden">
          <PreviewFrame />
        </div>

        {/* Footer */}
        <div className="h-12 flex items-center justify-between px-4 border-t border-neutral-200/60 bg-neutral-50">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Home</span>
          </Link>

          <span className="text-xs text-neutral-400">
            {project.name}
          </span>

          <Link
            href={`/chat/${project.id}`}
            className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Open in editor</span>
          </Link>
        </div>
      </div>
    </FileSystemProvider>
  );
}
