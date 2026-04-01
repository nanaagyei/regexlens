import { AIAction, AIContext } from "@/types";

export function buildSystemPrompt(context: AIContext): string {
  const parts: string[] = [
    `You are a regex expert embedded in RegexLens, a professional regex development tool. You have deep knowledge of regular expression syntax, performance characteristics, edge cases, and best practices.`,
    ``,
    `You always respond in the context of the user's current regex work. Be concise, precise, and practical. Use markdown formatting. When showing regex patterns, wrap them in backticks.`,
    ``,
    `## Current Regex Context`,
  ];

  if (context.pattern) {
    parts.push(`**Pattern:** \`/${context.pattern}/${context.flags}\``);
  } else {
    parts.push(`**Pattern:** (empty)`);
  }

  if (context.testText) {
    const truncated =
      context.testText.length > 500
        ? context.testText.slice(0, 500) + "..."
        : context.testText;
    parts.push(`**Test text:** \`\`\`\n${truncated}\n\`\`\``);
  }

  if (context.matches) {
    parts.push(
      `**Matches found:** ${context.matches.count}${context.matches.truncated ? " (truncated)" : ""}`
    );
  }

  if (context.warnings && context.warnings.length > 0) {
    parts.push(`**Warnings:**`);
    for (const w of context.warnings) {
      parts.push(`- [${w.severity}] ${w.title}: ${w.message}`);
    }
  }

  if (context.explanationSteps && context.explanationSteps.length > 0) {
    parts.push(`**Explanation steps:**`);
    for (const step of context.explanationSteps) {
      const detail = step.detail ? ` — ${step.detail}` : "";
      parts.push(`- [${step.kind}] ${step.label}${detail}`);
    }
  }

  parts.push(
    ``,
    `## Guidelines`,
    `- Reference the user's actual pattern and test text in your responses`,
    `- When suggesting pattern changes, show the complete new pattern`,
    `- Flag potential ReDoS or performance issues proactively`,
    `- Use JavaScript regex syntax (the user is working in JS flavor)`,
    `- Keep responses focused and actionable — no filler`
  );

  return parts.join("\n");
}

const ACTION_PROMPTS: Record<AIAction, string> = {
  polish: `Rewrite the explanation steps above into flowing, natural prose that a developer would enjoy reading. Don't just list them — weave them into a coherent narrative that explains what this regex does and why each part matters. Keep it concise (2-4 paragraphs max).`,

  edge_cases: `Analyze this regex pattern and identify strings that might unexpectedly match or fail to match. Focus on:
- Boundary cases (empty strings, single characters, very long inputs)
- Unicode/special character issues
- Common inputs that look like they should match but don't (or vice versa)
Provide specific examples for each edge case.`,

  security_review: `Review this regex for production safety:
- ReDoS vulnerability (catastrophic backtracking)
- Performance with large inputs
- Correctness issues that could lead to security bypasses
- Whether it's too permissive or too restrictive for its apparent purpose
Give a clear verdict: Safe / Caution / Unsafe, with specific reasoning.`,

  optimize: `Suggest ways to make this regex more efficient without changing its behavior:
- Reduce backtracking potential
- Use atomic groups or possessive quantifiers where applicable
- Simplify redundant constructs
- Consider whether the flags are optimal
Show the optimized pattern and explain each change.`,

  explain_simple: `Explain this regex as if teaching a junior developer who understands basic programming but is new to regex. Use analogies and simple language. Break it down piece by piece, explaining what each symbol means and why it's there. Include a simple example of what matches and what doesn't.`,

  generate_tests: `Generate a comprehensive set of test cases for this regex pattern. Include:
- Strings that SHOULD match (with expected capture groups if any)
- Strings that SHOULD NOT match
- Edge cases and boundary conditions
Format as a list with ✅ for expected matches and ❌ for expected non-matches.`,

  generate_pattern: `The user will describe what they want to match. Generate a regex pattern that fulfills their requirements. Respond with:
1. The pattern and recommended flags
2. A brief explanation of how it works
3. Example matches and non-matches
4. Any caveats or limitations`,

  fix_suggestions: `Based on the warnings identified for this pattern, suggest specific fixes:
- For each warning, provide a corrected version of the pattern
- Explain why the fix resolves the issue
- Note if any fix changes the matching behavior
Show the complete fixed pattern at the end.`,

  freeform: `Answer the user's question about this regex pattern. Use the context provided to give a specific, relevant answer.`,
};

export function buildUserPrompt(
  action: AIAction,
  message?: string
): string {
  if (action === "freeform" && message) {
    return message;
  }

  const actionPrompt = ACTION_PROMPTS[action];
  if (message) {
    return `${actionPrompt}\n\nAdditional context from user: ${message}`;
  }
  return actionPrompt;
}
