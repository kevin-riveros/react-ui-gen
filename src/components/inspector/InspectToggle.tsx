"use client";

import { MousePointerClick } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useInspect } from "@/lib/inspect";

export function InspectToggle() {
  const { isInspectMode, toggleInspectMode } = useInspect();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={toggleInspectMode}
          className={`p-1.5 rounded transition-colors ${
            isInspectMode
              ? "bg-blue-100 text-blue-600"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          <MousePointerClick className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {isInspectMode ? "Exit inspect mode (Esc)" : "Inspect element"}
      </TooltipContent>
    </Tooltip>
  );
}
