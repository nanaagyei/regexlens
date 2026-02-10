"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Snippet } from "./types";
import {
  MoreHorizontal,
  Copy,
  Trash2,
  Edit,
  ExternalLink,
  Clock,
} from "lucide-react";

interface SnippetCardProps {
  snippet: Snippet;
  onLoad: (snippet: Snippet) => void;
  onEdit: (snippet: Snippet) => void;
  onDelete: (snippet: Snippet) => void;
}

export function SnippetCard({
  snippet,
  onLoad,
  onEdit,
  onDelete,
}: SnippetCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopyPattern = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(snippet.pattern);
      toast.success("Pattern copied to clipboard");
    } catch (error) {
      console.error("Copy error:", error);
      toast.error("Failed to copy pattern");
    }
  }, [snippet.pattern]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/snippets/${snippet.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete");
      }

      toast.success("Snippet deleted");
      onDelete(snippet);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete snippet"
      );
    } finally {
      setIsDeleting(false);
    }
  }, [snippet, onDelete]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="group rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-sm truncate">{snippet.name}</h3>
            {snippet.flags && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                /{snippet.flags}
              </Badge>
            )}
          </div>

          <div className="font-mono text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 truncate mb-2">
            {snippet.pattern}
          </div>

          {snippet.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {snippet.description}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {snippet.tags?.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[10px] px-1.5 py-0"
              >
                {tag}
              </Badge>
            ))}
            {snippet.tags?.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{snippet.tags.length - 3} more
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onLoad(snippet)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Load in editor</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onLoad(snippet)}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Load in editor
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyPattern}>
                <Copy className="h-4 w-4 mr-2" />
                Copy pattern
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(snippet)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-1 mt-3 text-[10px] text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>Updated {formatDate(snippet.updated_at)}</span>
      </div>
    </div>
  );
}
