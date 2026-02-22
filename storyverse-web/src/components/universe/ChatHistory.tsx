"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Bot, Sparkles } from "lucide-react";
import type { ChatMessage } from "./useUniverseState";
import { cn } from "@/lib/utils";

interface ChatHistoryProps {
  messages: ChatMessage[];
}

export function ChatHistory({ messages }: ChatHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Only show if there are more than the initial welcome message
  if (messages.length <= 1) return null;

  return (
    <div className="rounded-2xl border border-cosmos-200/15 bg-panel/60 backdrop-blur-xl">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-cosmos-800/30"
      >
        <span className="font-display text-xs tracking-wider text-cosmos-200/60 uppercase">
          Query Log ({messages.length - 1})
        </span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-cosmos-200/40" />
        ) : (
          <ChevronRight className="h-4 w-4 text-cosmos-200/40" />
        )}
      </button>

      {isOpen && (
        <div className="max-h-64 space-y-2 overflow-y-auto border-t border-cosmos-200/10 p-4">
          {messages.slice(1).map((message) => (
            <div
              key={message.id}
              className={cn(
                "rounded-lg px-3 py-2 text-sm leading-relaxed",
                message.role === "assistant"
                  ? "bg-cosmos-800/50 text-cosmos-200/80"
                  : "bg-neon-violet/10 text-cosmos-100",
              )}
            >
              <div className="mb-1 flex items-center gap-1.5 text-[10px] tracking-wider text-cosmos-200/40 uppercase">
                {message.role === "assistant" ? (
                  <Bot className="h-3 w-3 text-neon-cyan/60" />
                ) : (
                  <Sparkles className="h-3 w-3 text-neon-rose/60" />
                )}
                {message.role}
              </div>
              <p className="whitespace-pre-wrap text-xs">{message.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
