"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useExplanation, useRegexMatches, useRegexParse } from "@/hooks";
import { encodeState } from "@/lib/regex/serialize";
import { getMatchColorClass } from "@/lib/regex/match";
import { cn } from "@/lib/utils";
import type { ExplanationStep, MatchResult } from "@/types";

const SEED_PATTERN = "(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2}):(\\d{2})";
const SEED_FLAGS = "g";
const SEED_TEXT =
  "Deployed at 2024-03-15T09:41:00 and rolled back at 2024-03-15T11:02:33.";

const LANDING_FLAGS = [
  { flag: "g", name: "global" },
  { flag: "i", name: "ignore case" },
  { flag: "m", name: "multiline" },
] as const;

const MAX_STEPS = 6;

const MATCH_BADGES = [
  "match1",
  "match2",
  "match3",
  "match4",
  "match5",
  "match6",
] as const;

export interface LandingBenchState {
  pattern: string;
  setPattern: (value: string) => void;
  flags: string;
  toggleFlag: (flag: string) => void;
  text: string;
  setText: (value: string) => void;
  appHref: string;
  isEmpty: boolean;
  parseError: string | null;
  parseOk: boolean;
  stepLabels: string[];
  matchResult: MatchResult;
  groupChips: { index: number; text: string }[];
}

export function useLandingBench(): LandingBenchState {
  const [pattern, setPattern] = useState(SEED_PATTERN);
  const [flags, setFlags] = useState(SEED_FLAGS);
  const [text, setText] = useState(SEED_TEXT);

  const isEmpty = pattern.trim().length === 0;
  const parseResult = useRegexParse(pattern, flags);
  const explanation = useExplanation(parseResult, "simple");
  const matchResult = useRegexMatches(
    pattern,
    flags,
    text,
    parseResult.ok && !isEmpty,
  );

  const parseError =
    !isEmpty && !parseResult.ok ? parseResult.errorMessage : null;

  const stepLabels = useMemo(() => {
    if (!parseResult.ok || isEmpty) return [];
    return flattenStepLabels(explanation.steps).slice(0, MAX_STEPS);
  }, [explanation.steps, isEmpty, parseResult.ok]);

  const groupChips = useMemo(() => {
    const first = matchResult.matches[0];
    if (!first) return [];
    return first.groups
      .filter((group) => group.text)
      .slice(0, 6)
      .map((group) => ({ index: group.groupIndex, text: group.text }));
  }, [matchResult.matches]);

  const appHref = useMemo(() => {
    const params = encodeState({
      pattern,
      flags,
      text,
      flavor: "javascript",
      comparisonPattern: "",
      comparisonFlags: "",
      explanationMode: "simple",
      selectedTemplate: null,
    });
    const qs = new URLSearchParams(params).toString();
    return qs ? `/app?${qs}` : "/app";
  }, [flags, pattern, text]);

  const toggleFlag = (flag: string) => {
    setFlags((current) =>
      current.includes(flag)
        ? current.replace(flag, "")
        : `${current}${flag}`,
    );
  };

  return {
    pattern,
    setPattern,
    flags,
    toggleFlag,
    text,
    setText,
    appHref,
    isEmpty,
    parseError,
    parseOk: parseResult.ok && !isEmpty,
    stepLabels,
    matchResult,
    groupChips,
  };
}

function flattenStepLabels(steps: ExplanationStep[]): string[] {
  const labels: string[] = [];
  for (const step of steps) {
    labels.push(step.label);
    if (step.children) {
      labels.push(...flattenStepLabels(step.children));
    }
  }
  return labels;
}

export function LandingMiniBench({ bench }: { bench: LandingBenchState }) {
  const {
    pattern,
    setPattern,
    flags,
    toggleFlag,
    text,
    setText,
    appHref,
    isEmpty,
    parseError,
    parseOk,
    stepLabels,
    matchResult,
    groupChips,
  } = bench;

  const noMatches =
    parseOk && text.trim().length > 0 && matchResult.matches.length === 0;

  return (
    <TooltipProvider delayDuration={250}>
      <figure className="relative m-0 min-w-0">
        <div className="relative">
        <div className="specimen-crop specimen-crop-tl" />
        <div className="specimen-crop specimen-crop-tr" />
        <div className="specimen-crop specimen-crop-bl" />
        <div className="specimen-crop specimen-crop-br" />
        <svg
          className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible text-foreground/25"
          aria-hidden="true"
        >
          <rect
            x="0.5"
            y="0.5"
            width="99%"
            height="99%"
            rx="7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            pathLength="100"
            className="landing-border-beam"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="min-w-0 rounded-lg border border-border bg-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="font-mono text-[0.65rem] tracking-[0.2em] text-muted-foreground">
              SPECIMEN
            </p>
            <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
              <span
                className="landing-live-dot size-1.5 rounded-full bg-[hsl(var(--match-2))]"
                aria-hidden="true"
              />
              Live
            </span>
          </div>
          <Separator className="mb-4 bg-border/60" />
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <label
              htmlFor="landing-pattern"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Pattern
            </label>
            <div
              className="flex items-center gap-1"
              role="group"
              aria-label="Flags"
            >
              {LANDING_FLAGS.map(({ flag, name }) => {
                const active = flags.includes(flag);
                return (
                  <Tooltip key={flag}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-pressed={active}
                        aria-label={`${name} flag`}
                        onClick={() => toggleFlag(flag)}
                        className={cn(
                          "size-11 rounded-md font-mono text-xs sm:size-8",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "border border-border text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {flag}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{name}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>

      <textarea
        id="landing-pattern"
        value={pattern}
        onChange={(event) => setPattern(event.target.value)}
        spellCheck={false}
        rows={2}
        className={cn(
          "w-full min-w-0 resize-none rounded-md border bg-background px-3 py-2",
          "font-mono text-sm leading-relaxed text-foreground break-all",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          parseError ? "border-destructive" : "border-border",
        )}
        placeholder="Paste a regex"
        aria-invalid={Boolean(parseError)}
        aria-describedby={
          parseError
            ? "landing-pattern-error"
            : isEmpty
              ? "landing-pattern-hint"
              : undefined
        }
      />

      {isEmpty ? (
        <p id="landing-pattern-hint" className="mt-2 text-sm text-muted-foreground">
          Paste a regex to see what it does.
        </p>
      ) : null}

      {parseError ? (
        <p
          id="landing-pattern-error"
          role="alert"
          className="mt-2 break-words text-sm text-destructive"
        >
          {parseError}
        </p>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
        <div>
          <label
            htmlFor="landing-sample"
            className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Sample
          </label>
          <SampleField
            value={text}
            onChange={setText}
            matchResult={matchResult}
          />
          {noMatches ? (
            <p className="mt-2 text-xs text-muted-foreground">
              No matches in this sample
            </p>
          ) : null}
          {groupChips.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {groupChips.map((chip) => (
                <li key={chip.index}>
                  <Badge
                    variant={MATCH_BADGES[chip.index % MATCH_BADGES.length]}
                    className="max-w-full font-mono font-normal"
                  >
                    <span className="opacity-70">${chip.index}</span>
                    <span className="ml-1 truncate">{chip.text}</span>
                  </Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            In plain English
          </p>
          {stepLabels.length > 0 ? (
            <ol className="flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
              {stepLabels.map((label, index) => (
                <li key={`${index}-${label}`} className="pl-0">
                  <span className="font-mono text-[0.65rem] text-muted-foreground/70 mr-2">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {label}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isEmpty
                ? "Explanation appears once a pattern is pasted."
                : parseError
                  ? "Fix the pattern to see an explanation."
                  : "Reading the pattern."}
            </p>
          )}
        </div>
      </div>

          <div className="mt-5 lg:hidden">
            <Button size="lg" asChild className="h-12 px-6 btn-lift">
              <Link href={appHref}>
                Open RegexLens
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
        </div>
        <figcaption className="mt-3 font-mono text-[0.65rem] tracking-[0.16em] text-muted-foreground">
          FIG. 01  Live specimen
        </figcaption>
      </figure>
    </TooltipProvider>
  );
}

function SampleField({
  value,
  onChange,
  matchResult,
}: {
  value: string;
  onChange: (value: string) => void;
  matchResult: MatchResult;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const hasHighlights = matchResult.spans.length > 0;

  const segments = useMemo(() => {
    if (!value || matchResult.spans.length === 0) {
      return [{ text: value, isMatch: false, matchIndex: -1 }];
    }

    const next: Array<{ text: string; isMatch: boolean; matchIndex: number }> =
      [];
    let lastEnd = 0;
    const sorted = [...matchResult.spans].sort((a, b) => a.start - b.start);

    for (const span of sorted) {
      if (span.start > lastEnd) {
        next.push({
          text: value.slice(lastEnd, span.start),
          isMatch: false,
          matchIndex: -1,
        });
      }
      next.push({
        text: value.slice(span.start, span.end),
        isMatch: true,
        matchIndex: span.matchIndex,
      });
      lastEnd = span.end;
    }

    if (lastEnd < value.length) {
      next.push({
        text: value.slice(lastEnd),
        isMatch: false,
        matchIndex: -1,
      });
    }

    return next;
  }, [matchResult.spans, value]);

  const syncScroll = () => {
    const textarea = textareaRef.current;
    const overlay = overlayRef.current;
    if (!textarea || !overlay) return;
    overlay.scrollTop = textarea.scrollTop;
    overlay.scrollLeft = textarea.scrollLeft;
  };

  return (
    <div className="relative h-36 rounded-md border border-border bg-background">
      {hasHighlights ? (
        <div
          ref={overlayRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden px-3 py-2 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground"
        >
          {segments.map((segment, index) =>
            segment.isMatch ? (
              <span
                key={index}
                className={cn(
                  "rounded-sm",
                  getMatchColorClass(segment.matchIndex),
                )}
              >
                {segment.text}
              </span>
            ) : (
              <span key={index}>{segment.text}</span>
            ),
          )}
        </div>
      ) : null}
      <textarea
        ref={textareaRef}
        id="landing-sample"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={syncScroll}
        spellCheck={false}
        className={cn(
          "relative z-10 h-full w-full resize-none overflow-auto bg-transparent px-3 py-2",
          "font-mono text-sm leading-relaxed",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          "placeholder:text-muted-foreground",
          hasHighlights ? "text-transparent caret-foreground" : "text-foreground",
        )}
        placeholder="Paste sample text"
      />
    </div>
  );
}
