"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TEMPLATES } from "@/lib/templates/templates";
import { RegexTemplate } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ChevronDown, AlertTriangle } from "lucide-react";

interface TemplatePickerProps {
  onSelect: (template: RegexTemplate) => void;
  onAfterSelect?: () => void;
}

export function TemplatePicker({ onSelect, onAfterSelect }: TemplatePickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (template: RegexTemplate) => {
    onSelect(template);
    setOpen(false);
    
    // Show toast notification
    toast.success(`Loaded template: ${template.name}`, {
      description: template.description,
      duration: 3000,
    });
    
    // Focus editor after selection (with small delay to allow state update)
    if (onAfterSelect) {
      setTimeout(() => {
        onAfterSelect();
      }, 100);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 sm:h-9">
          <BookOpen className="h-4 w-4" />
          <span className="hidden sm:inline">Examples</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[280px] sm:w-[320px] max-h-[60vh] sm:max-h-[400px] overflow-auto"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Select a template to load
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TEMPLATES.map((template) => (
          <DropdownMenuItem
            key={template.id}
            onClick={() => handleSelect(template)}
            className="flex flex-col items-start gap-1 py-2.5 sm:py-2 cursor-pointer touch-manipulation"
          >
            <div className="flex items-center gap-2 w-full">
              <span className="font-medium text-sm">{template.name}</span>
              {template.tags?.includes("danger") && (
                <AlertTriangle className="h-3 w-3 text-amber-400" />
              )}
            </div>
            <span className="text-xs text-muted-foreground line-clamp-2">
              {template.description}
            </span>
            {template.tags && template.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
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
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
