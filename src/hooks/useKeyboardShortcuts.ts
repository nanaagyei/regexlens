"use client";

import { useEffect, useCallback } from "react";

interface ShortcutHandlers {
  onFocusEditor?: () => void;
  onReparse?: () => void;
  onClearSelection?: () => void;
  onCopyShareLink?: () => void;
}

/**
 * Handle global keyboard shortcuts
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { key, metaKey, ctrlKey, shiftKey } = event;
      const isMod = metaKey || ctrlKey;

      // "/" - Focus regex editor
      if (key === "/" && !isMod && !shiftKey) {
        // Only trigger if not in an input
        const target = event.target as HTMLElement;
        if (
          target.tagName !== "INPUT" &&
          target.tagName !== "TEXTAREA" &&
          !target.isContentEditable
        ) {
          event.preventDefault();
          handlers.onFocusEditor?.();
        }
      }

      // "Cmd/Ctrl + Enter" - Force reparse
      if (key === "Enter" && isMod && !shiftKey) {
        event.preventDefault();
        handlers.onReparse?.();
      }

      // "Escape" - Clear selection
      if (key === "Escape" && !isMod && !shiftKey) {
        event.preventDefault();
        handlers.onClearSelection?.();
      }

      // "Cmd/Ctrl + Shift + C" - Copy share link
      if (key === "c" && isMod && shiftKey) {
        event.preventDefault();
        handlers.onCopyShareLink?.();
      }
    },
    [handlers]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}
