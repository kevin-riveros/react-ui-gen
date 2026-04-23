"use client";

// The overlay reads iframeRef.current during render to compute highlight +
// popover positions from the live iframe rect. A ResizeObserver-driven state
// would be the proper fix for the react-hooks/refs rule; keeping this simple
// until the positioning actually glitches in practice.
/* eslint-disable react-hooks/refs */

import { useState, useRef, useEffect } from "react";
import { Send, X } from "lucide-react";
import { useInspect } from "@/lib/inspect";

export function InspectOverlay() {
  const { selection, clearSelection, sendAnnotatedMessage, iframeRef, scale } =
    useInspect();
  const [instruction, setInstruction] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selection) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInstruction("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [selection]);

  if (!selection) return null;
  const iframeEl = iframeRef.current;
  if (!iframeEl) return null;

  // iframeRect already accounts for the parent's `transform: scale()` — we
  // multiply the iframe-space rect by `scale` to land back in parent viewport
  // coords.
  const iframeRect = iframeEl.getBoundingClientRect();
  const selRect =
    selection.type === "element"
      ? selection.data.boundingRect
      : selection.data.rect;

  const highlightTop = iframeRect.top + selRect.top * scale;
  const highlightLeft = iframeRect.left + selRect.left * scale;
  const highlightWidth = selRect.width * scale;
  const highlightHeight = selRect.height * scale;

  const popoverTop = Math.min(
    highlightTop + highlightHeight + 8,
    window.innerHeight - 160
  );
  const popoverLeft = Math.max(
    8,
    Math.min(highlightLeft, window.innerWidth - 320)
  );

  const description =
    selection.type === "element"
      ? selection.data.sourceComponent
        ? `${selection.data.sourceComponent} — <${selection.data.tagName}>`
        : `<${selection.data.tagName}>`
      : `${selection.data.elements.length} element${selection.data.elements.length !== 1 ? "s" : ""} selected`;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!instruction.trim()) return;
    sendAnnotatedMessage(instruction.trim());
    setInstruction("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === "Escape") clearSelection();
  }

  return (
    <>
      <div
        className="pointer-events-none fixed z-[9998] border-2 border-blue-500 rounded-sm bg-blue-500/10"
        style={{
          top: highlightTop,
          left: highlightLeft,
          width: highlightWidth,
          height: highlightHeight,
        }}
      />

      <div
        className="fixed z-[9999] w-[300px] bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden"
        style={{ top: popoverTop, left: popoverLeft }}
      >
        <div className="flex items-center justify-between px-3 py-2 bg-neutral-50 border-b border-neutral-100">
          <span className="text-xs font-mono text-neutral-600 truncate pr-2">
            {description}
          </span>
          <button
            onClick={clearSelection}
            className="flex-shrink-0 p-0.5 rounded hover:bg-neutral-200 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-2">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. change color to red..."
              rows={2}
              className="flex-1 resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
            <button
              type="submit"
              disabled={!instruction.trim()}
              className="self-end p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
