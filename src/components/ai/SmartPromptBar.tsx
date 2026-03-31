"use client";

import { AIAction } from "@/types";
import {
  AlertTriangle,
  Shield,
  Zap,
  GraduationCap,
  TestTube,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartPrompt {
  action: AIAction;
  label: string;
  icon: React.ReactNode;
  requiresWarnings?: boolean;
}

const SMART_PROMPTS: SmartPrompt[] = [
  {
    action: "edge_cases",
    label: "Edge cases",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  {
    action: "security_review",
    label: "Production safe?",
    icon: <Shield className="h-3 w-3" />,
  },
  {
    action: "optimize",
    label: "Optimize",
    icon: <Zap className="h-3 w-3" />,
  },
  {
    action: "explain_simple",
    label: "Explain simply",
    icon: <GraduationCap className="h-3 w-3" />,
  },
  {
    action: "generate_tests",
    label: "Test cases",
    icon: <TestTube className="h-3 w-3" />,
  },
  {
    action: "fix_suggestions",
    label: "Fix warnings",
    icon: <Wrench className="h-3 w-3" />,
    requiresWarnings: true,
  },
];

interface SmartPromptBarProps {
  onAction: (action: AIAction) => void;
  warningCount: number;
  disabled?: boolean;
  hasPattern: boolean;
}

export function SmartPromptBar({
  onAction,
  warningCount,
  disabled,
  hasPattern,
}: SmartPromptBarProps) {
  const visiblePrompts = SMART_PROMPTS.filter(
    (p) => !p.requiresWarnings || warningCount > 0
  );

  return (
    <div className="flex flex-wrap gap-1.5">
      {visiblePrompts.map((prompt) => (
        <button
          key={prompt.action}
          onClick={() => onAction(prompt.action)}
          disabled={disabled || !hasPattern}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full",
            "text-[11px] font-medium transition-all",
            "border border-border bg-background",
            "hover:bg-primary/10 hover:border-primary/30 hover:text-primary",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border disabled:hover:text-current"
          )}
        >
          {prompt.icon}
          {prompt.label}
        </button>
      ))}
    </div>
  );
}
