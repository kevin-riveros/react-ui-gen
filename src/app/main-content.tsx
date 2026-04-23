"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FileSystemProvider } from "@/lib/contexts/file-system-context";
import type { FileNode } from "@/lib/file-system";
import { ChatProvider } from "@/lib/contexts/chat-context";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { FileTree } from "@/components/editor/FileTree";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { PreviewFrame } from "@/components/preview/PreviewFrame";
import { BrowserFrame } from "@/components/preview/BrowserFrame";
import { InspectProvider, useInspect } from "@/lib/inspect";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeaderActions } from "@/components/HeaderActions";
import { getBrand } from "@/lib/config/client";

import type { AppUIMessage } from "@/lib/chat/types";

const brand = getBrand();

interface MainContentProps {
  project?: {
    id: string;
    name: string;
    messages: AppUIMessage[];
    data: Record<string, FileNode>;
    createdAt: Date;
    updatedAt: Date;
  };
  initialPrompt?: string;
}

export function MainContent({ project, initialPrompt }: MainContentProps) {
  const [activeView, setActiveView] = useState<"preview" | "code">("preview");

  const urlPathMap: Record<string, string> = {
    Homepage: "",
    Profile: "/profile",
    "My Profile": "/profile",
    Frame: "/new-page",
  };
  const browserUrlPath = project
    ? urlPathMap[project.name] ?? `/${project.id}`
    : "";

  return (
    <FileSystemProvider initialData={project?.data}>
      <ChatProvider projectId={project?.id} initialMessages={project?.messages} initialPrompt={initialPrompt}>
        <div className="h-screen w-screen overflow-hidden bg-neutral-50">
          <ResizablePanelGroup id="main-layout" direction="horizontal" className="h-full">
            {/* Left Panel - Chat */}
            <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
              <div className="h-full flex flex-col bg-white">
                {/* Chat Header */}
                <div className="h-14 flex items-center px-6 border-b border-neutral-200/60">
                  <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Image
                      src="/logo/UIGen.svg"
                      alt={brand.name}
                      width={337}
                      height={83}
                      priority
                      className="h-5 w-auto"
                    />
                  </Link>
                </div>

                {/* Chat Content */}
                <div className="flex-1 overflow-hidden">
                  <ChatInterface />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle className="w-[1px] bg-neutral-200 hover:bg-neutral-300 transition-colors" />

            {/* Right Panel - Preview/Code */}
            <ResizablePanel defaultSize={65}>
              <div className="h-full flex flex-col bg-white">
                {/* Top Bar */}
                <div className="h-14 border-b border-neutral-200/60 px-6 flex items-center justify-between bg-neutral-50/50">
                  <Tabs
                    value={activeView}
                    onValueChange={(v) =>
                      setActiveView(v as "preview" | "code")
                    }
                  >
                    <TabsList className="bg-white/60 border border-neutral-200/60 p-0.5 h-9 shadow-sm">
                      <TabsTrigger value="preview" className="data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm text-neutral-600 px-4 py-1.5 text-sm font-medium transition-all">Preview</TabsTrigger>
                      <TabsTrigger value="code" className="data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm text-neutral-600 px-4 py-1.5 text-sm font-medium transition-all">Code</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <HeaderActions projectId={project?.id} />
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden bg-neutral-50">
                  {activeView === "preview" ? (
                    <InspectProvider>
                      <InspectPreview
                        urlPath={browserUrlPath}
                        projectId={project?.id}
                        projectName={project?.name}
                      />
                    </InspectProvider>
                  ) : (
                    <ResizablePanelGroup
                      id="code-layout"
                      direction="horizontal"
                      className="h-full"
                    >
                      {/* File Tree */}
                      <ResizablePanel
                        defaultSize={30}
                        minSize={20}
                        maxSize={50}
                      >
                        <div className="h-full bg-neutral-50 border-r border-neutral-200">
                          <FileTree />
                        </div>
                      </ResizablePanel>

                      <ResizableHandle className="w-[1px] bg-neutral-200 hover:bg-neutral-300 transition-colors" />

                      {/* Code Editor */}
                      <ResizablePanel defaultSize={70}>
                        <div className="h-full bg-white">
                          <CodeEditor />
                        </div>
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </ChatProvider>
    </FileSystemProvider>
  );
}

/** Thin wrapper that connects the InspectProvider's iframeRef to PreviewFrame */
function InspectPreview({
  urlPath,
  projectId,
  projectName,
}: {
  urlPath: string;
  projectId?: string;
  projectName?: string;
}) {
  const { iframeRef } = useInspect();
  return (
    <BrowserFrame urlPath={urlPath} projectId={projectId} projectName={projectName}>
      <PreviewFrame externalIframeRef={iframeRef} />
    </BrowserFrame>
  );
}
