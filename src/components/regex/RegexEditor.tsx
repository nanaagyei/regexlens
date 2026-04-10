"use client";

import { useRef, useCallback, useImperativeHandle, forwardRef, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { ParseResult } from "@/types";
import { useHoverSelector } from "@/hooks/useHoverSync";

interface RegexEditorProps {
  value: string;
  onChange: (value: string) => void;
  parseResult: ParseResult;
}

export interface RegexEditorRef {
  focus: () => void;
}

export const RegexEditor = forwardRef<RegexEditorRef, RegexEditorProps>(
  function RegexEditor({ value, onChange, parseResult: _parseResult }, ref) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const decorationIdsRef = useRef<string[]>([]);

  const hoveredRange = useHoverSelector((s) => s.hoveredRange);
  const lockedStepId = useHoverSelector((s) => s.lockedStepId);

  // Apply Monaco decorations when hoveredRange changes
  useEffect(() => {
    const ed = editorRef.current;
    const monaco = monacoRef.current;
    if (!ed || !monaco) return;

    if (!hoveredRange) {
      decorationIdsRef.current = ed.deltaDecorations(decorationIdsRef.current, []);
      return;
    }

    const isLocked = lockedStepId !== null;
    const decoClass = isLocked ? "regex-locked-decoration" : "regex-hover-decoration";
    const inlineClass = isLocked ? "regex-locked-inline" : "regex-hover-inline";

    decorationIdsRef.current = ed.deltaDecorations(decorationIdsRef.current, [
      {
        range: new monaco.Range(1, hoveredRange.start + 1, 1, hoveredRange.end + 1),
        options: {
          className: decoClass,
          inlineClassName: inlineClass,
        },
      },
    ]);
  }, [hoveredRange, lockedStepId]);

  // Expose focus method via ref
  useImperativeHandle(ref, () => ({
    focus: () => {
      editorRef.current?.focus();
    },
  }), []);

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure editor options
    editor.updateOptions({
      minimap: { enabled: false },
      lineNumbers: "off",
      glyphMargin: false,
      folding: false,
      lineDecorationsWidth: 12,
      lineNumbersMinChars: 0,
      renderLineHighlight: "none",
      scrollBeyondLastLine: false,
      wordWrap: "on",
      fontSize: 14,
      fontFamily: "var(--font-mono)",
      padding: { top: 12, bottom: 12 },
      automaticLayout: true,
      // Avoid auto-pairing `[` `]` etc.; paired brackets turn invalid test patterns like `[` into valid `[]`.
      autoClosingBrackets: "never",
      autoClosingQuotes: "never",
      autoSurround: "never",
      scrollbar: {
        vertical: "hidden",
        horizontal: "hidden",
      },
    });

    // Define custom theme
    monaco.editor.defineTheme("regexlens-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "regex-escape", foreground: "60a5fa" },
        { token: "regex-group", foreground: "f59e0b" },
        { token: "regex-quantifier", foreground: "a78bfa" },
        { token: "regex-anchor", foreground: "34d399" },
        { token: "regex-charclass", foreground: "fb7185" },
        { token: "regex-alternation", foreground: "fbbf24" },
      ],
      colors: {
        "editor.background": "#0d1117",
        "editor.foreground": "#e6edf3",
        "editorCursor.foreground": "#3b82f6",
        "editor.selectionBackground": "#3b82f640",
      },
    });

    monaco.editor.setTheme("regexlens-dark");
  }, []);

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      onChange(newValue ?? "");
    },
    [onChange]
  );

  return (
    <div className="h-full min-h-[80px] relative">
      <Editor
        height="100%"
        defaultLanguage="plaintext"
        value={value}
        onChange={handleChange}
        onMount={handleEditorMount}
        options={{
          minimap: { enabled: false },
          lineNumbers: "off",
          glyphMargin: false,
          folding: false,
          wordWrap: "on",
          fontSize: 14,
          fontFamily: "var(--font-mono)",
          scrollBeyondLastLine: false,
          lineDecorationsWidth: 12,
          padding: { top: 12, bottom: 12 },
          autoClosingBrackets: "never",
          autoClosingQuotes: "never",
          autoSurround: "never",
        }}
        theme="vs-dark"
        loading={
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Loading editor...
          </div>
        }
      />
      {value === "" && (
        <div className="absolute top-3 left-[22px] text-muted-foreground text-sm pointer-events-none">
          Type or paste a regex pattern...
        </div>
      )}
      <style jsx global>{`
        .regex-error-decoration {
          background-color: rgba(239, 68, 68, 0.2);
        }
        .regex-error-inline {
          text-decoration: wavy underline;
          text-decoration-color: #ef4444;
        }
        .regex-hover-decoration {
          background-color: rgba(59, 130, 246, 0.2);
        }
        .regex-hover-inline {
          background-color: rgba(59, 130, 246, 0.3);
          border-radius: 2px;
          transition: background-color 150ms ease;
        }
        .regex-locked-decoration {
          background-color: rgba(59, 130, 246, 0.3);
          transition: background-color 150ms ease;
        }
        .regex-locked-inline {
          background-color: rgba(59, 130, 246, 0.45);
          border-radius: 2px;
          outline: 1.5px solid rgba(59, 130, 246, 0.6);
          outline-offset: -1px;
          transition: background-color 150ms ease;
        }
      `}</style>
    </div>
  );
});
