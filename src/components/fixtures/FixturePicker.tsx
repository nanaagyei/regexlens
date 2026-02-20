"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
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
import { FlaskConical, ChevronDown, AlertTriangle, Loader2 } from "lucide-react";
import type { FixtureRoot, FixtureSuite } from "@/lib/fixtures/types";

interface FixturePickerProps {
  onSelectSuite: (suite: FixtureSuite) => void;
  onAfterSelect?: () => void;
}

export function FixturePicker({ onSelectSuite, onAfterSelect }: FixturePickerProps) {
  const [open, setOpen] = useState(false);
  const [fixture, setFixture] = useState<FixtureRoot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch("/api/fixtures/regexlens")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load fixture");
        return res.json();
      })
      .then((data: FixtureRoot) => {
        setFixture(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => setLoading(false));
  }, [open]);

  const handleSelectSuite = (suite: FixtureSuite) => {
    onSelectSuite(suite);
    setOpen(false);
    toast.success(`Loaded suite: ${suite.title}`, {
      description: suite.description,
      duration: 3000,
    });
    onAfterSelect?.();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 sm:h-9">
          <FlaskConical className="h-4 w-4" />
          <span className="hidden sm:inline">Test packs</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[300px] sm:w-[360px] max-h-[60vh] overflow-auto"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Built-in test packs
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && (
          <div className="px-2 py-4 text-sm text-amber-600">{error}</div>
        )}
        {fixture && !loading && (
          <>
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {fixture.fixture_name}
            </div>
            {fixture.suites.map((suite) => (
              <DropdownMenuItem
                key={suite.id}
                onClick={() => handleSelectSuite(suite)}
                className="flex flex-col items-start gap-1 py-2.5 cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-medium text-sm">{suite.title}</span>
                  {suite.category === "performance_safety" && (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  )}
                </div>
                {suite.description && (
                  <span className="text-xs text-muted-foreground line-clamp-2">
                    {suite.description}
                  </span>
                )}
                <div className="flex items-center gap-1 mt-0.5">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {suite.category}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {suite.tests.length} tests
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
