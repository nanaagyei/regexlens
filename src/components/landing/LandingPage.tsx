"use client";

import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  DOCS_URL,
  GITHUB_REPO_URL,
  GITHUB_CONTRIBUTING_URL,
  GITHUB_LICENSE_URL,
  GITHUB_DISCUSSIONS_URL,
  SUPPORT_URL,
} from "@/lib/site";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  MousePointerClick,
  TreeDeciduous,
  AlertTriangle,
  Share2,
  Shield,
  ChevronDown,
  Menu,
  ArrowRight,
  Copy,
  Sparkles,
  Download,
  Github,
  Globe,
  Code2,
  Scale,
  HeartHandshake,
  Coffee,
  Zap,
  Eye,
  CheckCircle2,
  Terminal,
  Braces,
} from "lucide-react";

/* ─── Data ─── */

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Paste your regex",
    description:
      "Drop any regex pattern into the editor. Start from scratch or pick from built-in templates — email validators, URL parsers, log matchers, and more.",
    icon: Copy,
    image:
      "images/first.png",
    imageAlt: "Code editor showing regex pattern",
  },
  {
    step: "02",
    title: "Get instant clarity",
    description:
      "See plain-English explanations, live match highlighting, and a visual AST tree — all updating in real time as you type.",
    icon: Sparkles,
    image:
      "images/second.png",
    imageAlt: "Data visualization dashboard",
  },
  {
    step: "03",
    title: "Ship with confidence",
    description:
      "Share regex links with your team, export analysis, and catch performance issues before they reach production.",
    icon: Download,
    image:
      "images/third.png",
    imageAlt: "Collaborating on a shared RegexLens workspace link",
  },
];

const FEATURES = [
  {
    icon: FileText,
    title: "Plain-English Explanations",
    description:
      "Every regex breaks down into clear, human-readable steps. No more deciphering cryptic symbols.",
    accent: "from-violet-500/20 to-fuchsia-500/20",
    iconColor: "text-violet-400",
  },
  {
    icon: MousePointerClick,
    title: "Live Match Highlighting",
    description:
      "Watch matches and capture groups light up in real time as you type test strings.",
    accent: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: TreeDeciduous,
    title: "Visual Structure Tree",
    description:
      "Explore your regex as a collapsible AST. Click any node to jump to its position in the pattern.",
    accent: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: AlertTriangle,
    title: "Safety Warnings",
    description:
      "Catch catastrophic backtracking, redundant quantifiers, and correctness issues before production.",
    accent: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-400",
  },
  {
    icon: Share2,
    title: "Instant Sharing",
    description:
      "Generate shareable links that preserve pattern, flags, and test text. Your teammate sees exactly what you see.",
    accent: "from-pink-500/20 to-rose-500/20",
    iconColor: "text-pink-400",
  },
  {
    icon: Zap,
    title: "Fast in the browser",
    description:
      "Core matching and explanations run locally. No server round trips for the fundamentals you use all day.",
    accent: "from-yellow-500/20 to-amber-500/20",
    iconColor: "text-yellow-400",
  },
];

const SOLUTION_POINTS = [
  {
    icon: Eye,
    label: "What it matches",
    detail: "Live highlighting with color-coded capture groups",
  },
  {
    icon: FileText,
    label: "Why it matches",
    detail: "Step-by-step plain-English breakdown",
  },
  {
    icon: TreeDeciduous,
    label: "How it\u2019s built",
    detail: "Interactive AST explorer and railroad diagrams",
  },
  {
    icon: AlertTriangle,
    label: "Where it fails",
    detail: "Performance and correctness warnings",
  },
];

const FAQ_ITEMS = [
  {
    q: "What is RegexLens?",
    a: "RegexLens is an open-source developer tool for understanding, testing, and documenting JavaScript regular expressions. It provides plain-English explanations, live match highlighting, a visual structure tree, and built-in safety warnings.",
  },
  {
    q: "Do I need an account?",
    a: "No. The core workbench runs without signing in. Optional sign-in unlocks saved snippets, exports, deeper analysis, and Copilot when your deployment is configured to support those features.",
  },
  {
    q: "Is my regex data stored on your servers?",
    a: "By default, no. RegexLens runs matching and explanations in your browser. We only store patterns if you explicitly save them to your account.",
  },
  {
    q: "What regex flavor does it support?",
    a: "RegexLens targets JavaScript/ECMAScript RegExp syntax, including named groups, lookbehinds, and Unicode properties — the same flavor used in browsers, Node.js, Deno, and Bun.",
  },
  {
    q: "Can I use it for code reviews?",
    a: "Yes. Generate a shareable link and paste it into a PR comment. Reviewers see the pattern, test text, explanations, and warnings in one click.",
  },
  {
    q: "Is RegexLens open source?",
    a: "Yes. The project is MIT-licensed. You can self-host, inspect the code, and contribute improvements on GitHub.",
  },
];

const TRUST_ITEMS = [
  { icon: Shield, text: "Runs entirely in your browser" },
  { icon: Terminal, text: "No server-side regex execution for core matching" },
  { icon: Braces, text: "Open analysis — no black boxes" },
  { icon: CheckCircle2, text: "No tracking scripts by default" },
];

const NAV_LINKS = [
  { href: "/app", label: "Workbench" },
  { href: DOCS_URL, label: "Docs", external: true },
  { href: GITHUB_REPO_URL, label: "GitHub", external: true },
];

const BROWSER_TARGETS = [
  "Chrome",
  "Firefox",
  "Safari",
  "Edge",
  "Node.js",
] as const;

/* ─── Animated regex preview for the hero ─── */

const REGEX_EXAMPLES = [
  {
    pattern: "/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/",
    label: "Email validation",
  },
  {
    pattern: "/https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+[\\/\\w\\-.,@?^=%&:~+#]*/",
    label: "URL extraction",
  },
  {
    pattern: "/\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b/",
    label: "IPv4 address",
  },
  {
    pattern: "/(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2}):(\\d{2})/",
    label: "ISO datetime",
  },
];


function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return mounted ? reduced : false;
}

function AnimatedRegex({ reducedMotion }: { reducedMotion: boolean }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const example = REGEX_EXAMPLES[currentIdx];

    if (reducedMotion) {
      setDisplayText(example.pattern);
      setIsTyping(false);
      const id = window.setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % REGEX_EXAMPLES.length);
      }, 3200);
      return () => window.clearTimeout(id);
    }

    let charIndex = 0;
    setIsTyping(true);
    setDisplayText("");

    const typeInterval = window.setInterval(() => {
      if (charIndex < example.pattern.length) {
        setDisplayText(example.pattern.slice(0, charIndex + 1));
        charIndex += 1;
      } else {
        window.clearInterval(typeInterval);
        setIsTyping(false);
        window.setTimeout(() => {
          setCurrentIdx((prev) => (prev + 1) % REGEX_EXAMPLES.length);
        }, 2200);
      }
    }, 32);

    return () => window.clearInterval(typeInterval);
  }, [currentIdx, reducedMotion]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-5 shadow-2xl shadow-primary/5">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <span className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <span className="text-xs text-muted-foreground ml-2 font-mono">
            regexlens
          </span>
        </div>
        <p className="font-mono text-sm sm:text-base leading-relaxed text-foreground/90 min-h-[28px] break-all">
          <span className="text-primary/60" aria-hidden="true">{"/  "}</span>
          <span>{displayText}</span>
          <span
            className={`inline-block w-[2px] h-[1.1em] bg-primary ml-0.5 align-middle motion-reduce:opacity-0 ${
              isTyping ? "animate-pulse" : "opacity-0"
            }`}
            aria-hidden="true"
          />
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs text-primary font-medium">
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            {REGEX_EXAMPLES[currentIdx].label}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */

export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const p = searchParams.get("p");
    const f = searchParams.get("f");
    const t = searchParams.get("t");
    if (p || f || t) {
      const params = new URLSearchParams();
      if (p) params.set("p", p);
      if (f) params.set("f", f);
      if (t) params.set("t", t);
      window.location.replace(`/app?${params.toString()}`);
    }
  }, [searchParams]);





  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-background relative overflow-x-hidden"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>

      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40 supports-[backdrop-filter]:bg-background/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/regexlens-logo.png"
              alt="RegexLens home"
              width={160}
              height={40}
              priority
              className="h-9 w-auto rounded"
            />
          </Link>

          <nav aria-label="Primary" className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                <Github className="h-3.5 w-3.5" aria-hidden="true" />
                Star
              </a>
            </Button>
            <Button size="sm" asChild>
              <Link href="/app" className="gap-1.5">
                Open the app
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {NAV_LINKS.map((link) =>
                  link.external ? (
                    <DropdownMenuItem asChild key={link.label}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.label}
                      </a>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild key={link.label}>
                      <Link href={link.href}>{link.label}</Link>
                    </DropdownMenuItem>
                  )
                )}
                <DropdownMenuItem asChild>
                  <Link href="/app">Open the app</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main id="main-content" className="relative z-10">
        {/* ─── Hero ─── */}
        <section aria-labelledby="hero-heading" className="relative py-24 sm:py-32 lg:py-36 overflow-hidden border-b border-border/30 motion-safe:animate-fade-up motion-reduce:animate-none">
          {/* Background mesh */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/8 blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/6 blur-[120px]" />
            <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-cyan-500/5 blur-[100px]" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm text-primary font-medium mb-8">
              <Github className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              Open source under the MIT License
            </div>

            <h1 id="hero-heading" className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Stop guessing.{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Start understanding.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              RegexLens explains JavaScript regular expressions with interactive structure,
              live matches, and safety insights — built in public for developers who review,
              teach, and ship regex every week.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4" aria-label="Primary calls to action">
              <Button size="lg" asChild className="text-base h-12 px-8 shadow-lg shadow-primary/20">
                <Link href="/app">
                  Open the app
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="text-base h-12 px-8 border-border/60 hover:border-primary/40"
              >
                <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
                  Read the docs
                </a>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground/80 mb-16">
              No account required for the core workbench. Self-host or contribute on GitHub.
            </p>

            <AnimatedRegex reducedMotion={reducedMotion} />
          </div>
        </section>

        {/* ─── Browser Support ─── */}
        <section className="py-12 relative border-y border-border/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground/60 mb-6">
              Works everywhere you write code
            </p>
            <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3 sm:gap-x-12 text-sm text-muted-foreground list-none m-0 p-0">
              {BROWSER_TARGETS.map((name) => (
                <li key={name} className="inline-flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary/70 shrink-0" aria-hidden="true" />
                  <span className="font-medium text-foreground/80">{name}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section className="py-28 sm:py-36 relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="how-header text-center mb-16">
              <p className="text-xs font-medium uppercase tracking-wider text-primary mb-4">
                How it works
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold max-w-3xl mx-auto leading-tight">
                From regex confusion to{" "}
                <span className="text-primary">clarity</span> in three steps
              </h2>
            </div>

            <div className="space-y-20 lg:space-y-32">
              {HOW_IT_WORKS.map((step, i) => (
                <div
                  key={step.title}
                  className={`grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
                    i % 2 === 1 ? "lg:direction-rtl" : ""
                  }`}
                >
                  <div
                    className={`space-y-4 ${i % 2 === 1 ? "lg:order-2 lg:text-left" : ""}`}
                  >
                    <span className="inline-block font-mono text-5xl font-bold text-primary/20">
                      {step.step}
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">
                      {step.description}
                    </p>
                    <Button variant="outline" size="sm" asChild className="mt-2 group">
                      <Link href="/app">
                        Open in the app
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                  </div>
                  <div
                    className={`relative ${i % 2 === 1 ? "lg:order-1" : ""}`}
                  >
                    <div className="relative rounded-2xl overflow-hidden border border-border/40 shadow-2xl shadow-black/20">
                      <Image
                        src={step.image}
                        alt={step.imageAlt}
                        width={600}
                        height={400}
                        className="w-full h-auto object-cover aspect-[3/2]"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                    </div>
                    <div className="absolute -z-10 inset-0 rounded-2xl bg-primary/10 blur-2xl translate-y-4 scale-95" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── App Demo Screenshot ─── */}
        <section className="py-20 sm:py-28 relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <p className="text-xs font-medium uppercase tracking-wider text-primary mb-4">
                See it in action
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold">
                One screen. Everything you need.
              </h2>
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/30 via-violet-500/30 to-cyan-500/30 blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative rounded-2xl border border-border/40 overflow-hidden bg-card shadow-2xl">
                <Image
                  src="images/main.png"
                  alt="RegexLens application interface showing pattern analysis"
                  width={1200}
                  height={675}
                  className="w-full h-auto"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <Button size="lg" asChild className="shadow-lg">
                    <Link href="/app">
                      Open the app
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Problem → Solution ─── */}
        <section className="py-24 sm:py-32 relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-destructive/80 mb-4">
                  The problem
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-6">
                  Regex is powerful.
                  <br />
                  <span className="text-muted-foreground">And painful.</span>
                </h2>
                <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                  <p>
                    Regular expressions are hard to read, harder to explain, easy
                    to break, and dangerous when inefficient.
                  </p>
                  <p>
                    Most tools tell you <em>if</em> a regex matches. Very few
                    explain <strong className="text-foreground">why</strong>.
                  </p>
                </div>

                <div className="mt-8 p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                  <p className="font-mono text-sm text-destructive/80 break-all">
                    {"/^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$/"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Can you tell what this does in 5 seconds? Your teammates
                    {" can\u2019t"} either.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-primary mb-4">
                  The solution
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-8">
                  RegexLens shows you everything.
                </h2>
                <div className="grid gap-4">
                  {SOLUTION_POINTS.map((point) => (
                    <div
                      key={point.label}
                      className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/50 hover:border-primary/30 transition-colors duration-200 group"
                    >
                      <div className="rounded-lg bg-primary/10 p-2.5 shrink-0 group-hover:bg-primary/20 transition-colors">
                        <point.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm mb-0.5">
                          {point.label}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {point.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Features Bento Grid ─── */}
        <section className="py-28 sm:py-36 relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <p className="text-xs font-medium uppercase tracking-wider text-primary mb-4">
                Feature highlights
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold">
                Built for clarity
              </h2>
              <p className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto">
                Every feature is designed to make regex less mysterious and more
                productive.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className={`group relative rounded-2xl border border-border/40 bg-gradient-to-b ${f.accent} p-6 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5`}
                >
                  <div
                    className={`rounded-xl bg-card/80 border border-border/30 p-3 w-fit mb-4`}
                  >
                    <f.icon className={`h-6 w-6 ${f.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Social Proof / Trust ─── */}
        <section className="py-20 sm:py-28 relative border-y border-border/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-3">
                Trust & privacy
              </h2>
              <p className="text-muted-foreground">
                Your regex stays yours. Always.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                <Link href="/privacy" className="text-primary hover:underline underline-offset-4">
                  Privacy Policy
                </Link>
                <span className="mx-2 text-border">·</span>
                <Link href="/terms" className="text-primary hover:underline underline-offset-4">
                  Terms of Service
                </Link>
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TRUST_ITEMS.map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border/30 bg-card/30"
                >
                  <item.icon className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Developer Testimonials ─── */}
        <section className="py-24 sm:py-32 relative">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <p className="text-xs font-medium uppercase tracking-wider text-primary mb-4">
                What developers say
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold">
                Loved by regex wranglers
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  quote:
                    "I used to spend 20 minutes deciphering regex in code reviews. Now I paste it into RegexLens and understand it in seconds.",
                  name: "Silas Bempong",
                  role: "Machine Learning Engineer",
                  avatar:
                    "https://avatars1.githubusercontent.com/u/19541446?v=4",
                },
                {
                  quote:
                    "RegexLens has been a game-changer for my research. The visual AST explorer is perfect for explaining complex patterns to my students.",
                  name: "Derrick Dwamena",
                  role: "Cognitive Neuroscientist",
                  avatar:
                    "https://i0.wp.com/sites.duke.edu/huettellab/files/2021/02/WhatsApp-Image-2021-02-07-at-1.44.19-PM.jpeg",
                },
                {
                  quote:
                    "Finally, a regex tool built for real work, not demos. The shareable links make code reviews so much faster. I can now review regex patterns in seconds instead of minutes.",
                  name: "Sylvester Bempong",
                  role: "Software Engineer",
                  avatar:
                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbF8Bzflr0P8YpDkpYZHKegScbpLpin2zxqg&s",
                },
              ].map((t) => (
                <div
                  key={t.name}
                  className="p-6 rounded-2xl border border-border/40 bg-card/50 hover:border-primary/20 transition-colors duration-300"
                >
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <Image
                      src={t.avatar}
                      alt={t.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                      unoptimized
                    />
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="py-24 sm:py-32 relative">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-[1fr_1.5fr] gap-12 md:gap-16">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-primary mb-4">
                  FAQ
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold">
                  Got questions?
                </h2>
                <p className="text-muted-foreground mt-3">
                  Everything you need to know about RegexLens.
                </p>
              </div>
              <div className="space-y-2">
                {FAQ_ITEMS.map((item) => (
                  <Collapsible
                    key={item.q}
                    open={openFaq === item.q}
                    onOpenChange={(open) => setOpenFaq(open ? item.q : null)}
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center justify-between w-full p-4 rounded-xl border border-border/40 bg-card/30 hover:bg-card/60 transition-colors cursor-pointer text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <span className="font-medium text-sm pr-4">
                          {item.q}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                            openFaq === item.q ? "rotate-180" : ""
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-3 text-sm text-muted-foreground leading-relaxed border-x border-b border-border/40 rounded-b-xl -mt-1 mx-1">
                        {item.a}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Open Source & Community ─── */}
        <section className="py-20 sm:py-28 relative" aria-labelledby="oss-heading">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
              <p className="text-xs font-medium uppercase tracking-wider text-primary mb-3">
                Open source
              </p>
              <h2 id="oss-heading" className="font-serif text-2xl sm:text-3xl font-bold mb-4">
                Built with the community
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg">
                RegexLens is MIT-licensed. Inspect the code, self-host, and help shape the roadmap on GitHub.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 lg:gap-5">
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-border/40 bg-card/40 p-5 sm:p-6 text-left transition-colors duration-200 hover:border-primary/30 hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                    <Code2 className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold">Source &amp; issues</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Clone the repo, report bugs, and follow releases.
                    </p>
                  </div>
                </div>
              </a>
              <a
                href={GITHUB_CONTRIBUTING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-border/40 bg-card/40 p-5 sm:p-6 text-left transition-colors duration-200 hover:border-primary/30 hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                    <HeartHandshake className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold">Contributing guide</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Local development, tests, and how to open a pull request.
                    </p>
                  </div>
                </div>
              </a>
              <a
                href={GITHUB_LICENSE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-border/40 bg-card/40 p-5 sm:p-6 text-left transition-colors duration-200 hover:border-primary/30 hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                    <Scale className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold">MIT License</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Use RegexLens in your own projects with minimal friction.
                    </p>
                  </div>
                </div>
              </a>
              <a
                href={GITHUB_DISCUSSIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-border/40 bg-card/40 p-5 sm:p-6 text-left transition-colors duration-200 hover:border-primary/30 hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                    <Github className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold">Discussions</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Ask questions, compare approaches, and propose features.
                    </p>
                  </div>
                </div>
              </a>
              <a
                href={SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-border/40 bg-card/40 p-5 sm:p-6 text-left transition-colors duration-200 hover:border-primary/30 hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer sm:col-span-2"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                    <Coffee className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold">Support the project</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      RegexLens stays free and open source. If it helps you, you can optionally thank the maintainers via Buy Me a Coffee.
                    </p>
                  </div>
                </div>
              </a>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
              <Button size="lg" asChild className="h-12 px-8">
                <Link href="/app">Open the app</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 px-8 border-border/60">
                <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className="gap-2">
                  <Github className="h-4 w-4" aria-hidden="true" />
                  View on GitHub
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 px-8 border-border/60">
                <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="gap-2">
                  <Coffee className="h-4 w-4" aria-hidden="true" />
                  Buy me a coffee
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* ─── Final CTA ─── */}
        <section className="py-28 sm:py-36 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-primary/4 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Ready to{" "}
              <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                decode
              </span>{" "}
              your next regex?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Ship regex reviews with a shared, inspectable tool — no account required to get started.
            </p>
            <Button
              size="lg"
              asChild
              className="h-14 px-10 shadow-lg shadow-primary/20 text-lg"
            >
              <Link href="/app">
                Open the app
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="py-16 border-t border-border/30 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="inline-block mb-4">
                <Image
                  src="/regexlens-logo.png"
                  alt="RegexLens"
                  width={160}
                  height={40}
                  className="h-9 w-auto rounded"
                />
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Understand any regex instantly. Open-source visual analysis for JavaScript RegExp.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/app"
                    className="hover:text-foreground transition-colors"
                  >
                    Open the app
                  </Link>
                </li>
                <li>
                  <a
                    href={GITHUB_REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href={GITHUB_CONTRIBUTING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    Contributing
                  </a>
                </li>
                <li>
                  <a
                    href={SUPPORT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    Support the project
                  </a>
                </li>
                <li>
                  <a
                    href={DOCS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    Docs
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Resources</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <a
                    href={GITHUB_DISCUSSIONS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    Discussions
                  </a>
                </li>
                <li>
                  <Link
                    href="/changelog"
                    className="hover:text-foreground transition-colors"
                  >
                    Changelog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-foreground transition-colors"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Connect</h4>
              <div className="flex gap-2">
                <a
                  href={GITHUB_REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-card/50 border border-border/30 hover:border-primary/30 hover:bg-primary/10 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="RegexLens on GitHub"
                >
                  <Github className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-border/20">
            <p className="text-center text-xs text-muted-foreground/60">
              &copy; {new Date().getFullYear()} RegexLens. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
