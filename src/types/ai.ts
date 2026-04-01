export type AIAction =
  | "polish"
  | "edge_cases"
  | "security_review"
  | "optimize"
  | "explain_simple"
  | "generate_tests"
  | "generate_pattern"
  | "fix_suggestions"
  | "freeform";

export interface AIContext {
  pattern: string;
  flags: string;
  testText?: string;
  matches?: { count: number; truncated: boolean };
  warnings?: Array<{ severity: string; title: string; message: string }>;
  explanationSteps?: Array<{
    label: string;
    kind: string;
    detail?: string;
  }>;
}

export interface AIChatRequest {
  action: AIAction;
  context: AIContext;
  message?: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: AIAction;
  timestamp: number;
}
