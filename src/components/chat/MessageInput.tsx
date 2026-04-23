"use client";

import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { ImagePlus, Send, Square, X } from "lucide-react";
import { toast } from "sonner";
import { StreamStatsBar } from "./StreamStats";
import { useChat } from "@/lib/contexts/chat-context";
import { fileToImageAttachment } from "@/lib/chat/image-attachment";
import { AVAILABLE_MODELS, type ModelId } from "@/lib/ai/models";

interface MessageInputProps {
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  stop: () => void;
}

export function MessageInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  stop,
}: MessageInputProps) {
  const { attachment, setAttachment, model, setModel } = useChat();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDropping, setIsDropping] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Only image files can be attached.");
        return;
      }
      setIsProcessingFile(true);
      try {
        const att = await fileToImageAttachment(file);
        setAttachment(att);
      } catch (err) {
        console.error(err);
        toast.error("Could not process that image.");
      } finally {
        setIsProcessingFile(false);
      }
    },
    [setAttachment]
  );

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    // Reset so picking the same file again re-triggers change.
    e.target.value = "";
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const file = Array.from(e.clipboardData?.files ?? []).find((f) =>
      f.type.startsWith("image/")
    );
    if (!file) return;
    e.preventDefault();
    void processFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLFormElement>) => {
    if (!Array.from(e.dataTransfer.types ?? []).includes("Files")) return;
    e.preventDefault();
    setIsDropping(true);
  };

  const handleDragLeave = () => setIsDropping(false);

  const handleDrop = (e: DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsDropping(false);
    const file = Array.from(e.dataTransfer?.files ?? []).find((f) =>
      f.type.startsWith("image/")
    );
    if (file) void processFile(file);
  };

  const canSubmit = (!!input.trim() || !!attachment) && !isProcessingFile;

  return (
    <form
      onSubmit={handleSubmit}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative p-4 bg-white border-t border-neutral-200/60 transition-colors ${
        isDropping ? "bg-blue-50" : ""
      }`}
    >
      <div className="relative max-w-4xl mx-auto">
        <div className="flex items-center gap-1.5 mb-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isProcessingFile}
            aria-label="Attach image"
            className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[11px] font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ImagePlus className="h-3 w-3" />
            Attach
          </button>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-100 text-[11px] text-neutral-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <label htmlFor="model-select" className="sr-only">
              Model
            </label>
            <select
              id="model-select"
              aria-label="Model"
              value={model}
              onChange={(e) => setModel(e.target.value as ModelId)}
              disabled={isLoading}
              className="bg-transparent border-0 p-0 pr-4 text-[11px] font-medium text-neutral-600 focus:outline-none focus:ring-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id} title={m.description}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          {isDropping && (
            <span className="text-[11px] text-blue-600 font-medium">
              Drop image to attach
            </span>
          )}
        </div>

        {attachment && (
          <div className="mb-2 flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachment.dataUrl}
              alt={attachment.filename}
              className="h-14 w-14 rounded-md object-cover border border-neutral-200"
            />
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm text-neutral-800">
                {attachment.filename}
              </div>
              <div className="text-[11px] text-neutral-500">
                {attachment.mediaType}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              aria-label="Remove attachment"
              className="flex-shrink-0 rounded-md p-1.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            attachment
              ? "Describe what to build from this image (optional)..."
              : "Describe what you want to build..."
          }
          disabled={isLoading}
          className="w-full min-h-[80px] max-h-[200px] pl-4 pr-14 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 text-neutral-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white transition-all placeholder:text-neutral-400 text-[15px] font-normal shadow-sm"
          rows={3}
        />

        {isLoading ? (
          <button
            type="button"
            onClick={stop}
            aria-label="Stop generating"
            className="absolute right-3 bottom-3 p-2.5 rounded-lg bg-neutral-900 text-white transition-all hover:bg-neutral-800"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSubmit}
            className="absolute right-3 bottom-3 p-2.5 rounded-lg transition-all hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent group"
          >
            <Send
              className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                !canSubmit ? "text-neutral-300" : "text-blue-600"
              }`}
            />
          </button>
        )}
      </div>
      {/* Stats bar below input */}
      <div className="max-w-4xl mx-auto mt-1">
        <StreamStatsBar />
      </div>
    </form>
  );
}
