"use client";

import { useEffect, useRef } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/lib/contexts/chat-context";

export function ChatInterface() {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { messages, input, handleInputChange, handleSubmit, stop, regenerate, status } = useChat();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full p-4 overflow-hidden">
      {/*
        Radix's ScrollArea.Viewport wraps its children in a
        `min-width: 100%; display: table` div (see
        @radix-ui/react-scroll-area/dist/index.js). `display: table` sizes
        to content, so any wide child (long inline code, an image
        thumbnail, etc.) pushes the column past the panel's right edge —
        the arbitrary variant below forces that inner wrapper back to
        `display: block` so it respects the viewport width.
      */}
      <ScrollArea
        ref={scrollAreaRef}
        className="flex-1 overflow-hidden [&_[data-slot=scroll-area-viewport]>div]:!block"
      >
        <div className="pr-4">
          <MessageList
            messages={messages}
            isLoading={status === "streaming"}
            onRegenerate={() => regenerate()}
          />
        </div>
      </ScrollArea>
      <div className="mt-4 flex-shrink-0">
        <MessageInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={status === "submitted" || status === "streaming"}
          stop={stop}
        />
      </div>
    </div>
  );
}
