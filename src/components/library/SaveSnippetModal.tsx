"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/useUser";
import { SignInCallout } from "@/components/auth/SignInCallout";
import { Snippet, CreateSnippetInput, UpdateSnippetInput } from "./types";
import { Loader2, X, Plus, GitBranch } from "lucide-react";

interface SaveSnippetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pattern: string;
  flags: string;
  snippet?: Snippet | null; // If provided, we're editing
  onSaved: (snippet: Snippet) => void;
}

export function SaveSnippetModal({
  open,
  onOpenChange,
  pattern,
  flags,
  snippet,
  onSaved,
}: SaveSnippetModalProps) {
  const { user, isLoading: isUserLoading } = useUser();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingVersion, setIsSavingVersion] = useState(false);

  const isEditing = !!snippet;

  // Populate form when editing
  useEffect(() => {
    if (snippet) {
      setName(snippet.name);
      setDescription(snippet.description || "");
      setTags(snippet.tags || []);
    } else {
      setName("");
      setDescription("");
      setTags([]);
    }
  }, [snippet, open]);

  const handleAddTag = useCallback(() => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 25) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  }, [tagInput, tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  }, [tags]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  const handleSave = useCallback(async () => {
    if (!user || !name.trim()) return;

    setIsSaving(true);

    try {
      const url = isEditing ? `/api/snippets/${snippet.id}` : "/api/snippets";
      const method = isEditing ? "PATCH" : "POST";

      const body: CreateSnippetInput | UpdateSnippetInput = isEditing
        ? {
            name: name.trim(),
            description: description.trim() || undefined,
            tags: tags.length > 0 ? tags : undefined,
          }
        : {
            name: name.trim(),
            pattern,
            flags,
            description: description.trim() || undefined,
            tags: tags.length > 0 ? tags : undefined,
          };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save snippet");
      }

      const savedSnippet = await response.json();
      toast.success(isEditing ? "Snippet updated" : "Snippet saved");
      onSaved(savedSnippet);
      onOpenChange(false);
    } catch (error) {
      console.error("Save error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save snippet"
      );
    } finally {
      setIsSaving(false);
    }
  }, [user, name, description, tags, pattern, flags, isEditing, snippet, onSaved, onOpenChange]);

  const handleSaveAsVersion = useCallback(async () => {
    if (!user || !snippet) return;

    setIsSavingVersion(true);

    try {
      const response = await fetch(`/api/snippets/${snippet.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pattern,
          flags,
          notes: description.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save version");
      }

      toast.success("Version saved");
    } catch (error) {
      console.error("Save version error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save version"
      );
    } finally {
      setIsSavingVersion(false);
    }
  }, [user, snippet, pattern, flags, description]);

  const handleClose = useCallback(() => {
    setName("");
    setDescription("");
    setTags([]);
    setTagInput("");
    onOpenChange(false);
  }, [onOpenChange]);

  const showSignInPrompt = !isUserLoading && !user;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Snippet" : "Save Regex"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your saved regex snippet."
              : "Save this regex pattern to your library for quick access later."}
          </DialogDescription>
        </DialogHeader>

        {showSignInPrompt ? (
          <SignInCallout
            className="py-6 space-y-0"
            title="Sign in required"
            description="Sign in to save and organize your regex patterns."
          />
        ) : (
          <div className="space-y-4">
            {/* Pattern preview */}
            {!isEditing && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Pattern</label>
                <div className="font-mono text-sm bg-muted rounded-md px-3 py-2 break-all">
                  /{pattern}/{flags}
                </div>
              </div>
            )}

            {/* Name input */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Email validation"
                maxLength={120}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                {name.length}/120 characters
              </p>
            </div>

            {/* Description input */}
            <div className="space-y-1.5">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this regex do?"
                maxLength={2000}
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            {/* Tags input */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tags</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a tag..."
                  maxLength={32}
                  className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim() || tags.length >= 25}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs gap-1 pr-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {tags.length}/25 tags
              </p>
            </div>

            <DialogFooter className="flex-wrap gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              {isEditing && (
                <Button
                  variant="outline"
                  onClick={handleSaveAsVersion}
                  disabled={isSavingVersion}
                  className="gap-1.5"
                >
                  {isSavingVersion ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <GitBranch className="h-4 w-4" />
                      Save as version
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={isSaving || !name.trim()}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : isEditing ? (
                  "Update"
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
