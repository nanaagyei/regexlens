"use client";

import { useCallback } from "react";
import { SavedLibrary, SaveSnippetModal } from "@/components/library";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface WorkspaceModalsProps {
  saveModalOpen: boolean;
  onSaveModalChange: (open: boolean) => void;
  libraryOpen: boolean;
  onLibraryChange: (open: boolean) => void;
  onFocusEditor: () => void;
}

export function WorkspaceModals({
  saveModalOpen,
  onSaveModalChange,
  libraryOpen,
  onLibraryChange,
  onFocusEditor,
}: WorkspaceModalsProps) {
  const { state, actions } = useWorkspace();

  const handleLoadSnippet = useCallback(
    (pattern: string, flags: string) => {
      actions.setPattern(pattern);
      actions.setFlags(flags);
      onFocusEditor();
    },
    [actions, onFocusEditor]
  );

  const handleSnippetSaved = useCallback(() => {
    // Could refresh library or show notification
  }, []);

  return (
    <>
      <SaveSnippetModal
        open={saveModalOpen}
        onOpenChange={onSaveModalChange}
        pattern={state.pattern}
        flags={state.flags}
        onSaved={handleSnippetSaved}
      />

      <SavedLibrary
        open={libraryOpen}
        onOpenChange={onLibraryChange}
        onLoadSnippet={handleLoadSnippet}
      />
    </>
  );
}
