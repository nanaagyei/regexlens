"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TemplatePicker } from "@/components/templates/TemplatePicker";
import { FixturePicker } from "@/components/fixtures/FixturePicker";
import { ShareBar } from "@/components/share/ShareBar";
import { UserMenu } from "./UserMenu";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { buildShareUrl } from "@/lib/regex/serialize";
import {
  BookText,
  Save,
  FolderOpen,
  Share2,
  MoreHorizontal,
  RotateCcw,
  Home,
} from "lucide-react";
import { DOCS_URL } from "@/lib/site";
import Link from "next/link";
import Image from "next/image";
import type { FixtureSuite } from "@/lib/fixtures/types";

interface AppHeaderProps {
  onSaveClick: () => void;
  onLibraryClick: () => void;
  onSelectFixtureSuite: (suite: FixtureSuite) => void;
  onFocusEditor: () => void;
}

export function AppHeader({
  onSaveClick,
  onLibraryClick,
  onSelectFixtureSuite,
  onFocusEditor,
}: AppHeaderProps) {
  const { state, actions, explanation, warnings } = useWorkspace();

  const handleSelectFixtureSuite = useCallback(
    (suite: FixtureSuite) => {
      onSelectFixtureSuite(suite);
    },
    [onSelectFixtureSuite]
  );

  return (
    <header className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-border">
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <Link href="/app" className="flex items-center shrink-0">
          <Image
            src="/regexlens-logo.png"
            alt="RegexLens"
            width={100}
            height={100}
            className="rounded-lg w-[80px] sm:w-[100px]"
            priority
          />
        </Link>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2 sm:px-3 shrink-0" asChild>
              <Link href="/">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Homepage</span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back to homepage</TooltipContent>
        </Tooltip>
      </div>

      {/* Desktop/Tablet Navigation */}
      <div className="hidden md:flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
                <BookText className="h-4 w-4" />
                <span className="hidden lg:inline">Docs</span>
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>View documentation</TooltipContent>
        </Tooltip>
        <TemplatePicker onSelect={actions.applyTemplate} onAfterSelect={onFocusEditor} />
        <FixturePicker onSelectSuite={handleSelectFixtureSuite} onAfterSelect={onFocusEditor} />

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onSaveClick}
                disabled={!state.pattern}
                className="gap-1.5"
              >
                <Save className="h-4 w-4" />
                <span className="hidden lg:inline">Save</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {state.pattern ? "Save to library" : "Paste a pattern to save"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onLibraryClick}
                className="gap-1.5"
              >
                <FolderOpen className="h-4 w-4" />
                <span className="hidden lg:inline">Library</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open saved patterns</TooltipContent>
          </Tooltip>
        </div>

        <ShareBar
          state={state}
          steps={explanation.steps}
          warnings={warnings.warnings}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={actions.reset}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Reset all"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset all</TooltipContent>
        </Tooltip>
        <div className="w-px h-6 bg-border mx-1" />
        <UserMenu />
      </div>

      {/* Mobile Navigation */}
      <MobileNav
        state={state}
        actions={actions}
        onSaveClick={onSaveClick}
        onLibraryClick={onLibraryClick}
        onSelectFixtureSuite={handleSelectFixtureSuite}
        onFocusEditor={onFocusEditor}
      />
    </header>
  );
}

function MobileNav({
  state,
  actions,
  onSaveClick,
  onLibraryClick,
  onSelectFixtureSuite,
  onFocusEditor,
}: {
  state: ReturnType<typeof useWorkspace>["state"];
  actions: ReturnType<typeof useWorkspace>["actions"];
  onSaveClick: () => void;
  onLibraryClick: () => void;
  onSelectFixtureSuite: (suite: FixtureSuite) => void;
  onFocusEditor: () => void;
}) {
  return (
    <div className="flex md:hidden items-center gap-2">
      <TemplatePicker onSelect={actions.applyTemplate} onAfterSelect={onFocusEditor} />
      <FixturePicker onSelectSuite={onSelectFixtureSuite} onAfterSelect={onFocusEditor} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="More options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" className="flex items-center">
              <BookText className="mr-2 h-4 w-4" />
              Documentation
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/" className="flex items-center">
              <Home className="mr-2 h-4 w-4" />
              Homepage
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onSaveClick}
            disabled={!state.pattern}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Pattern
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onLibraryClick}>
            <FolderOpen className="mr-2 h-4 w-4" />
            Saved Patterns
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async () => {
              try {
                const url = buildShareUrl(state);
                await navigator.clipboard.writeText(url);
                toast.success("Link copied to clipboard");
              } catch (error) {
                console.error("Failed to copy share link:", error);
                toast.error("Failed to copy link");
              }
            }}
            disabled={!state.pattern && !state.text}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Copy Review Link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={actions.reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset All
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserMenu />
    </div>
  );
}
