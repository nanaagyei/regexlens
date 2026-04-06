"use client";

import { useRef, useImperativeHandle, forwardRef } from "react";
import { Panel } from "./Panel";
import { RegexEditor, RegexEditorRef } from "@/components/regex/RegexEditor";
import { FlagsToggle } from "@/components/regex/FlagsToggle";
import { TokenToolbar } from "@/components/regex/TokenToolbar";
import { ParseStatus } from "@/components/regex/ParseStatus";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export interface PatternSectionRef {
  focusEditor: () => void;
}

export const PatternSection = forwardRef<PatternSectionRef>(
  function PatternSection(_props, ref) {
    const regexEditorRef = useRef<RegexEditorRef>(null);
    const { state, actions, parseResult } = useWorkspace();

    useImperativeHandle(ref, () => ({
      focusEditor: () => regexEditorRef.current?.focus(),
    }));

    return (
      <div className="flex flex-col gap-3 sm:gap-4 min-h-0 shrink-0 md:row-span-2 xl:row-span-1">
        <Panel title="Pattern" className="flex-1 min-h-[180px] sm:min-h-[200px] xl:min-h-0">
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-[80px] sm:min-h-[100px]">
              <RegexEditor
                ref={regexEditorRef}
                value={state.pattern}
                onChange={actions.setPattern}
                parseResult={parseResult}
              />
            </div>
            <div className="border-t border-border p-2 sm:p-3 space-y-2">
              <FlagsToggle
                flags={state.flags}
                onToggle={actions.toggleFlag}
              />
              <TokenToolbar onInsert={actions.setPattern} currentPattern={state.pattern} />
              <ParseStatus parseResult={parseResult} />
            </div>
          </div>
        </Panel>
      </div>
    );
  }
);
