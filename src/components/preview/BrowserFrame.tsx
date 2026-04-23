"use client";

import { useState, useRef, useEffect } from "react";
import { Monitor, Tablet, Smartphone, Maximize, Minimize, ExternalLink } from "lucide-react";
import { InspectToggle, InspectOverlay } from "@/components/inspector";
import { DownloadZipButton } from "@/components/preview/DownloadZipButton";
import { useInspect } from "@/lib/inspect";
import { getPreviewDomain } from "@/lib/config/client";

const previewDomain = getPreviewDomain();
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Viewport = "desktop" | "tablet" | "mobile";

const viewportConfigs: Record<Viewport, { width: number; displayWidth?: number }> = {
  desktop: { width: 1280 },
  tablet: { width: 768, displayWidth: 600 },
  mobile: { width: 375 },
};

interface BrowserFrameProps {
  children: React.ReactNode;
  urlPath?: string;
  projectId?: string;
  projectName?: string;
}

export function BrowserFrame({ children, urlPath = "", projectId, projectName }: BrowserFrameProps) {
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const inspect = useInspect();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const containerWidth = container.clientWidth;
      const config = viewportConfigs[viewport];
      // displayWidth: the visual space to fit into (defaults to actual width)
      // width: the real iframe width (for correct media query triggers)
      const fitWidth = config.displayWidth ?? config.width;
      setScale(Math.min(fitWidth / config.width, containerWidth / config.width));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [viewport]);

  // Sync scale to inspect context
  useEffect(() => {
    inspect.setScale(scale);
  }, [scale, inspect]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const targetWidth = `${viewportConfigs[viewport].width}px`;

  const handleShare = () => {
    if (!projectId) return;
    const shareUrl = `${window.location.origin}/share/${projectId}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <TooltipProvider>
      <div className={`flex flex-col bg-neutral-100 p-3 transition-all duration-300 ${
        isFullscreen ? "fixed inset-0 z-50" : "h-full"
      }`}>
        {/* Browser Chrome */}
        <div className="bg-[#e8e6e8] rounded-t-xl border border-neutral-300 border-b-0">
          {/* Title bar with traffic lights */}
          <div className="flex items-center px-4 h-10 gap-3">
            {/* Traffic lights */}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#d4a123]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29]" />
            </div>

            {/* Viewport switcher */}
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center bg-white/60 rounded-md p-0.5 gap-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setViewport("desktop")}
                      className={`p-1.5 rounded transition-colors ${
                        viewport === "desktop"
                          ? "bg-white shadow-sm text-neutral-900"
                          : "text-neutral-500 hover:text-neutral-700"
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Desktop (1280px)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setViewport("tablet")}
                      className={`p-1.5 rounded transition-colors ${
                        viewport === "tablet"
                          ? "bg-white shadow-sm text-neutral-900"
                          : "text-neutral-500 hover:text-neutral-700"
                      }`}
                    >
                      <Tablet className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Tablet (768px)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setViewport("mobile")}
                      className={`p-1.5 rounded transition-colors ${
                        viewport === "mobile"
                          ? "bg-white shadow-sm text-neutral-900"
                          : "text-neutral-500 hover:text-neutral-700"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Mobile (375px)</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Inspect + Share + Fullscreen */}
            <div className="flex items-center gap-0.5">
              <InspectToggle />
              <DownloadZipButton projectName={projectName} />
              {projectId && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleShare}
                      className="p-1.5 rounded transition-colors text-neutral-500 hover:text-neutral-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Open share link</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsFullscreen((f) => !f)}
                    className="p-1.5 rounded transition-colors text-neutral-500 hover:text-neutral-700"
                  >
                    {isFullscreen ? (
                      <Minimize className="w-3.5 h-3.5" />
                    ) : (
                      <Maximize className="w-3.5 h-3.5" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

        {/* URL bar */}
        <div className="px-4 pb-2">
          <div className="flex items-center h-7 bg-white/80 rounded-md px-3">
            <svg
              className="w-3 h-3 text-neutral-400 mr-2 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="text-xs text-neutral-500 truncate">
              {previewDomain}{urlPath}
            </span>
          </div>
        </div>
      </div>

      <InspectOverlay />

      {/* Content area */}
      <div
        ref={containerRef}
        className="flex-1 border border-neutral-300 rounded-b-xl overflow-hidden flex justify-center"
      >
        <div
          style={{
            width: targetWidth,
            minWidth: targetWidth,
            height: `${100 / scale}%`,
            transform: `scale(${scale})`,
            transformOrigin: "top center",
          }}
        >
          {children}
        </div>
      </div>
      </div>
    </TooltipProvider>
  );
}
