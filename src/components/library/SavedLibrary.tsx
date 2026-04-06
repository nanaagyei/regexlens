"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/hooks/useUser";
import { SignInCallout } from "@/components/auth/SignInCallout";
import { Snippet, SnippetListResponse } from "./types";
import { SnippetCard } from "./SnippetCard";
import { SnippetDetailModal } from "./SnippetDetailModal";
import { SaveSnippetModal } from "./SaveSnippetModal";
import {
  Loader2,
  Search,
  FolderOpen,
  RefreshCw,
} from "lucide-react";

interface SavedLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadSnippet: (pattern: string, flags: string, text?: string) => void;
}

export function SavedLibrary({
  open,
  onOpenChange,
  onLoadSnippet,
}: SavedLibraryProps) {
  const { user, isLoading: isUserLoading } = useUser();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [historySnippet, setHistorySnippet] = useState<Snippet | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);

  const fetchSnippets = useCallback(
    async (cursor?: string, append = false) => {
      if (!user) return;

      setIsLoading(true);

      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set("query", searchQuery);
        if (selectedTag) params.set("tag", selectedTag);
        if (cursor) params.set("cursor", cursor);
        params.set("limit", "20");

        const response = await fetch(`/api/snippets?${params.toString()}`);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to fetch snippets");
        }

        const data: SnippetListResponse = await response.json();

        if (append) {
          setSnippets((prev) => [...prev, ...data.items]);
        } else {
          setSnippets(data.items);
        }
        setNextCursor(data.next_cursor);

        // Extract unique tags from all snippets
        if (!append) {
          const tags = new Set<string>();
          data.items.forEach((s) => s.tags?.forEach((t) => tags.add(t)));
          setAllTags(Array.from(tags).sort());
        }
      } catch (error) {
        console.error("Fetch snippets error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to load snippets"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [user, searchQuery, selectedTag]
  );

  // Fetch snippets when dialog opens or filters change
  useEffect(() => {
    if (open && user) {
      fetchSnippets();
    }
  }, [open, user, searchQuery, selectedTag, fetchSnippets]);

  const handleLoadMore = useCallback(() => {
    if (nextCursor) {
      fetchSnippets(nextCursor, true);
    }
  }, [nextCursor, fetchSnippets]);

  const handleLoadSnippet = useCallback(
    (snippet: Snippet) => {
      onLoadSnippet(snippet.pattern, snippet.flags);
      onOpenChange(false);
      toast.success(`Loaded: ${snippet.name}`);
    },
    [onLoadSnippet, onOpenChange]
  );

  const handleLoadVersion = useCallback(
    (pattern: string, flags: string) => {
      onLoadSnippet(pattern, flags);
      setHistorySnippet(null);
      onOpenChange(false);
    },
    [onLoadSnippet, onOpenChange]
  );

  const handleRestoreVersion = useCallback(
    async (snippetId: string, pattern: string, flags: string) => {
      const res = await fetch(`/api/snippets/${snippetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern, flags }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to restore version");
      }
      const updated: Snippet = await res.json();
      setSnippets((prev) =>
        prev.map((s) => (s.id === snippetId ? updated : s))
      );
    },
    []
  );

  const handleDeleteSnippet = useCallback((deletedSnippet: Snippet) => {
    setSnippets((prev) => prev.filter((s) => s.id !== deletedSnippet.id));
  }, []);

  const handleSnippetSaved = useCallback((savedSnippet: Snippet) => {
    setSnippets((prev) => {
      const index = prev.findIndex((s) => s.id === savedSnippet.id);
      if (index >= 0) {
        // Update existing
        const updated = [...prev];
        updated[index] = savedSnippet;
        return updated;
      }
      // Add new at the beginning
      return [savedSnippet, ...prev];
    });
    setEditingSnippet(null);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedTag(null);
  }, []);

  const showSignInPrompt = !isUserLoading && !user;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              My Library
            </DialogTitle>
            <DialogDescription>
              Your saved regex patterns. Click to load one into the editor.
            </DialogDescription>
          </DialogHeader>

          {showSignInPrompt ? (
            <SignInCallout
              className="py-8 space-y-0"
              title="Sign in required"
              description="Sign in to save and organize your regex patterns."
            />
          ) : (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Search and filters */}
              <div className="space-y-3 pb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or pattern..."
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.slice(0, 10).map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTag === tag ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() =>
                          setSelectedTag(selectedTag === tag ? null : tag)
                        }
                      >
                        {tag}
                      </Badge>
                    ))}
                    {(searchQuery || selectedTag) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                        className="h-6 text-xs"
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Snippets list */}
              <ScrollArea className="flex-1 -mx-6 px-6">
                {isLoading && snippets.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : snippets.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery || selectedTag
                        ? "No snippets match your filters"
                        : "No saved snippets yet"}
                    </p>
                    {(searchQuery || selectedTag) && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={handleClearFilters}
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 pb-4">
                    {snippets.map((snippet) => (
                      <SnippetCard
                        key={snippet.id}
                        snippet={snippet}
                        onLoad={handleLoadSnippet}
                        onEdit={setEditingSnippet}
                        onDelete={handleDeleteSnippet}
                        onOpenHistory={setHistorySnippet}
                      />
                    ))}

                    {nextCursor && (
                      <div className="text-center pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleLoadMore}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Load more
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Version history / Diff modal */}
      {historySnippet && (
        <SnippetDetailModal
          open={!!historySnippet}
          onOpenChange={(open) => !open && setHistorySnippet(null)}
          snippet={historySnippet}
          onLoadVersion={handleLoadVersion}
          onRestoreVersion={handleRestoreVersion}
        />
      )}

      {/* Edit modal */}
      {editingSnippet && (
        <SaveSnippetModal
          open={!!editingSnippet}
          onOpenChange={(open) => !open && setEditingSnippet(null)}
          pattern={editingSnippet.pattern}
          flags={editingSnippet.flags}
          snippet={editingSnippet}
          onSaved={handleSnippetSaved}
        />
      )}
    </>
  );
}
