"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  TEMPLATES,
  TEMPLATE_CATEGORIES,
  searchTemplates,
  getTemplatesByCategory,
} from "@/lib/templates/templates";
import { RegexTemplate, TemplateCategoryId } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, AlertTriangle, X } from "lucide-react";

interface TemplatePickerProps {
  onSelect: (template: RegexTemplate) => void;
  onAfterSelect?: () => void;
}

export function TemplatePicker({
  onSelect,
  onAfterSelect,
}: TemplatePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<TemplateCategoryId | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus search input when dialog opens
  useEffect(() => {
    if (open) {
      // Small delay to let dialog animate in
      const timer = setTimeout(() => searchRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    } else {
      // Reset filters on close
      setSearch("");
      setActiveCategory(null);
    }
  }, [open]);

  const filteredTemplates = useMemo(() => {
    let results: RegexTemplate[];

    if (search.trim()) {
      results = searchTemplates(search);
    } else if (activeCategory) {
      results = getTemplatesByCategory(activeCategory);
    } else {
      results = TEMPLATES;
    }

    return results;
  }, [search, activeCategory]);

  const handleSelect = (template: RegexTemplate) => {
    onSelect(template);
    setOpen(false);

    toast.success(`Loaded template: ${template.name}`, {
      description: template.description,
      duration: 3000,
    });

    if (onAfterSelect) {
      setTimeout(() => onAfterSelect(), 100);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 h-8 sm:h-9"
        onClick={() => setOpen(true)}
      >
        <BookOpen className="h-4 w-4" />
        <span className="hidden sm:inline">Examples</span>
      </Button>

      <DialogContent className="max-w-2xl w-[calc(100%-2rem)] max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 space-y-3">
          <DialogTitle>Example Patterns</DialogTitle>
          <DialogDescription className="sr-only">
            Browse curated regex patterns to review and learn from
          </DialogDescription>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search patterns..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value.trim()) setActiveCategory(null);
              }}
              className="w-full h-9 rounded-md border border-input bg-transparent pl-9 pr-9 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mb-1 scrollbar-none">
            <Button
              variant={activeCategory === null && !search ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs px-3 shrink-0"
              onClick={() => {
                setActiveCategory(null);
                setSearch("");
              }}
            >
              All
            </Button>
            {TEMPLATE_CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-3 shrink-0"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSearch("");
                }}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </DialogHeader>

        {/* Template grid */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 pb-4 sm:px-6 sm:pb-6">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No templates found</p>
                <p className="text-xs mt-1">
                  Try a different search term or category
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: RegexTemplate;
  onSelect: (template: RegexTemplate) => void;
}) {
  return (
    <button
      onClick={() => onSelect(template)}
      className="group text-left rounded-lg border border-border p-3 hover:border-foreground/20 hover:bg-accent/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="font-medium text-sm truncate">{template.name}</span>
        {template.tags?.includes("danger") && (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        )}
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
        {template.description}
      </p>
      <code className="block text-xs font-mono text-muted-foreground/80 bg-muted/50 rounded px-2 py-1 truncate">
        {template.pattern}
      </code>
      {template.tags && template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {template.tags
            .filter((t) => t !== "danger")
            .slice(0, 3)
            .map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                {tag}
              </Badge>
            ))}
        </div>
      )}
    </button>
  );
}
