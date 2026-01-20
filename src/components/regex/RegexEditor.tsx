"use client";

import { useRef, useCallback } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { ParseResult } from "@/types";
import { useHoverSync } from "@/hooks/useHoverSync";
import { cn } from "@/lib/utils";

interface RegexEditorProps {
  value: string;
  onChange: (value: string) => void;
  parseResult: ParseResult;
}

export function RegexEditor({ value, onChange, parseResult }: RegexEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const { hoverState, setHoveredRange } = useHoverSync();

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

  // Update error decorations when parse result changes
  const decorations = useCallback(() => {
    if (!editorRef.current || !monacoRef.current) return [];

    const decorationsList: editor.IModelDeltaDecoration[] = [];

    // Error decoration
    if (!parseResult.ok && parseResult.errorRange) {
      decorationsList.push({
        range: new monacoRef.current.Range(
          1,
          parseResult.errorRange.start + 1,
          1,
          parseResult.errorRange.end + 1
        ),
        options: {
          className: "regex-error-decoration",
          inlineClassName: "regex-error-inline",
          hoverMessage: { value: parseResult.errorMessage },
        },
      });
    }

    // Hover highlight decoration
    if (hoverState.hoveredRange) {
      decorationsList.push({
        range: new monacoRef.current.Range(
          1,
          hoverState.hoveredRange.start + 1,
          1,
          hoverState.hoveredRange.end + 1
        ),
        options: {
          className: "regex-hover-decoration",
          inlineClassName: "regex-hover-inline",
        },
      });
    }

    return decorationsList;
  }, [parseResult, hoverState.hoveredRange]);

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
        }
      `}</style>
    </div>
  );
}
