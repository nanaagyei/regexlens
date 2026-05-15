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
  Terminal,
  Braces,
  CheckCircle2,
} from "lucide-react";

/* ─── Data ─── */

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Paste a regex you inherited",
    description:
      "Paste any regex from a PR, config file, or codebase. No need to start from scratch.",
    icon: Copy,
    image: "/images/first.png",
    imageAlt: "RegexLens editor with a pasted regex pattern",
  },
  {
    step: "02",
    title: "Understand it instantly",
    description:
      "Read a plain-English breakdown, inspect the visual syntax tree, and verify matches in real time.",
    icon: Sparkles,
    image: "/images/second.png",
    imageAlt: "RegexLens showing explanation and match highlighting",
  },
  {
    step: "03",
    title: "Review and share with your team",
    description:
      "Generate a shareable link for code reviews, export the analysis, and catch safety issues before production.",
    icon: Download,
    image: "/images/third.png",
    imageAlt: "Sharing a RegexLens analysis link in a PR comment",
  },
];

const CAPABILITIES = [
  {
    icon: FileText,
    title: "Plain-English Explanations",
    description:
      "Every regex breaks down into clear, human-readable steps. Understand inherited patterns in seconds.",
  },
  {
    icon: MousePointerClick,
    title: "Live Match Highlighting",
    description:
      "Matches and capture groups light up in real time as you type test strings.",
  },
  {
    icon: TreeDeciduous,
    title: "Visual Structure Tree",
    description:
      "Inspect the regex as a collapsible AST. Click any node to understand its role in the pattern.",
  },
  {
    icon: AlertTriangle,
    title: "Safety Warnings",
    description:
      "Catch catastrophic backtracking, redundant quantifiers, and correctness issues before production.",
  },
  {
    icon: Share2,
    title: "Shareable Review Links",
    description:
      "One link. Reviewers see the pattern, explanation, and warnings in a single click.",
  },
  {
    icon: Zap,
    title: "Runs in Your Browser",
    description:
      "Core matching and explanations run locally. No server round trips for the fundamentals.",
  },
];

const FAQ_ITEMS = [
  {
    q: "What is RegexLens?",
    a: "RegexLens is an open-source developer tool for understanding, reviewing, and debugging JavaScript regular expressions. It provides plain-English explanations, safety analysis, a visual structure tree, and shareable review links.",
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
    a: "RegexLens targets JavaScript/ECMAScript RegExp syntax, including named groups, lookbehinds, and Unicode properties.",
  },
  {
    q: "Can I use it for code reviews?",
    a: "That is what it is built for. Generate a shareable link and paste it into a PR comment. Reviewers see the pattern, explanation, safety warnings, and match behavior in one click.",
  },
  {
    q: "Is RegexLens open source?",
    a: "Yes. The project is MIT-licensed. You can self-host, inspect the code, and contribute improvements on GitHub.",
  },
];

const TRUST_ITEMS = [
  { icon: Shield, text: "Runs entirely in your browser" },
  { icon: Terminal, text: "No server-side regex execution" },
  { icon: Braces, text: "Open analysis, no black boxes" },
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

const TESTIMONIALS = [
  {
    quote:
      "I used to spend 20 minutes deciphering regex in code reviews. Now I paste it into RegexLens and understand it in seconds.",
    name: "Silas Bempong",
    role: "Machine Learning Engineer",
    avatar: "https://avatars1.githubusercontent.com/u/19541446?v=4",
  },
  {
    quote:
      "The visual AST explorer is perfect for explaining complex patterns to my students. It has been a game-changer for teaching.",
    name: "Derrick Dwamena",
    role: "Cognitive Neuroscientist",
    avatar:
      "https://i0.wp.com/sites.duke.edu/huettellab/files/2021/02/WhatsApp-Image-2021-02-07-at-1.44.19-PM.jpeg",
  },
  {
    quote:
      "Finally, a regex tool built for real work. The shareable links make code reviews so much faster.",
    name: "Sylvester Bempong",
    role: "Software Engineer",
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbF8Bzflr0P8YpDkpYZHKegScbpLpin2zxqg&s",
  },
];

const OSS_LINKS = [
  {
    href: GITHUB_REPO_URL,
    icon: Code2,
    title: "Source & issues",
    description: "Clone the repo, report bugs, and follow releases.",
  },
  {
    href: GITHUB_CONTRIBUTING_URL,
    icon: HeartHandshake,
    title: "Contributing guide",
    description: "Local development, tests, and how to open a pull request.",
  },
  {
    href: GITHUB_LICENSE_URL,
    icon: Scale,
    title: "MIT License",
    description: "Use RegexLens in your own projects with minimal friction.",
  },
  {
    href: GITHUB_DISCUSSIONS_URL,
    icon: Github,
    title: "Discussions",
    description: "Ask questions, compare approaches, and propose features.",
  },
  {
    href: SUPPORT_URL,
    icon: Coffee,
    title: "Support the project",
    description:
      "RegexLens stays free and open source. If it helps you, you can thank the maintainers.",
    span: true,
  },
];

/* ─── Hooks ─── */

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

/** Scroll-reveal wrapper component */
function Reveal({
  children,
  className = "",
  direction = "up",
  stagger,
  heroStagger,
  reducedMotion,
}: {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "left" | "scale";
  stagger?: number;
  heroStagger?: number;
  reducedMotion: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion) {
      el?.classList.add("revealed");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const dirClass =
    direction === "left"
      ? "reveal-left"
      : direction === "scale"
        ? "reveal-scale"
        : "reveal-up";

  const staggerClass = heroStagger
    ? `hero-stagger-${heroStagger}`
    : stagger
      ? `stagger-${stagger}`
      : "";

  return (
    <div ref={ref} className={`reveal ${dirClass} ${staggerClass} ${className}`}>
      {children}
    </div>
  );
}

/** Perspective tilt toward cursor on a card */
function useMouseTilt(reducedMotion: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `rotateY(${x * 4}deg) rotateX(${y * -4}deg)`;
    };

    const handleLeave = () => {
      el.style.transform = "rotateY(0deg) rotateX(0deg)";
    };

    const parent = el.parentElement;
    parent?.addEventListener("mousemove", handleMove);
    parent?.addEventListener("mouseleave", handleLeave);
    return () => {
      parent?.removeEventListener("mousemove", handleMove);
      parent?.removeEventListener("mouseleave", handleLeave);
    };
  }, [reducedMotion]);

  return ref;
}

/* ─── Animated Regex Preview ─── */

function AnimatedRegex({ reducedMotion }: { reducedMotion: boolean }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const tiltRef = useMouseTilt(reducedMotion);

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
    <div className="w-full perspective-tilt">
      <div
        ref={tiltRef}
        className="rounded-xl border border-border/60 bg-card p-5 perspective-tilt-inner"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-muted-foreground font-mono tracking-wide uppercase">
            regexlens
          </span>
        </div>
        <p className="font-mono text-sm sm:text-base leading-relaxed text-foreground/90 min-h-[28px] break-all">
          <span>{displayText}</span>
          <span
            className={`inline-block w-[2px] h-[1.1em] bg-primary ml-0.5 align-middle motion-reduce:opacity-0 ${
              isTyping ? "animate-pulse" : "opacity-0"
            }`}
            aria-hidden="true"
          />
        </p>
        <div className="mt-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs text-primary font-medium">
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
      <header className="sticky top-0 z-50 bg-background/95 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/regexlens-logo.png"
              alt="RegexLens home"
              width={160}
              height={40}
              priority
              loading="eager"
              fetchPriority="high"
              sizes="160px"
              className="h-9 w-auto rounded"
              style={{ width: "auto" }}
            />
          </Link>

          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2"
          >
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
              ),
            )}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Button size="sm" variant="outline" asChild className="btn-lift-outline">
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-1.5"
              >
                <Github className="h-3.5 w-3.5" aria-hidden="true" />
                Star
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild className="btn-lift-outline">
              <Link href="/signin?callbackUrl=%2Fapp">Sign in</Link>
            </Button>
            <Button size="sm" asChild className="btn-lift">
              <Link href="/app" className="gap-1.5">
                Open RegexLens
                <ArrowRight
                  className="ml-1.5 h-3.5 w-3.5"
                  aria-hidden="true"
                />
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
                  ),
                )}
                <DropdownMenuItem asChild>
                  <Link href="/signin?callbackUrl=%2Fapp">Sign in</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app">Open RegexLens</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main id="main-content" className="relative z-10">
        {/* ─── Hero ─── */}
        <section
          aria-labelledby="hero-heading"
          className="relative py-24 sm:py-32 lg:py-40 border-b border-border/30"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <Reveal reducedMotion={reducedMotion} heroStagger={1}>
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm text-primary font-medium mb-8">
                    <Github
                      className="w-3.5 h-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    Open source, MIT licensed
                  </div>
                </Reveal>

                <Reveal reducedMotion={reducedMotion} heroStagger={2}>
                  <h1
                    id="hero-heading"
                    className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]"
                  >
                    Stop guessing.{" "}
                    <span className="text-primary">Start understanding.</span>
                  </h1>
                </Reveal>

                <Reveal reducedMotion={reducedMotion} heroStagger={3}>
                  <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
                    Paste any regex and get instant clarity. Plain-English
                    breakdowns, safety warnings, and shareable analysis for code
                    reviews.
                  </p>
                </Reveal>

                <Reveal reducedMotion={reducedMotion} heroStagger={4}>
                  <div
                    className="flex flex-col sm:flex-row gap-3"
                    aria-label="Primary calls to action"
                  >
                    <Button size="lg" asChild className="text-base h-12 px-8 btn-lift">
                      <Link href="/app">
                        Start reviewing
                        <ArrowRight
                          className="ml-2 h-4 w-4"
                          aria-hidden="true"
                        />
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      asChild
                      className="text-base h-12 px-8 border-border/60 btn-lift-outline"
                    >
                      <a
                        href={DOCS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Read the docs
                      </a>
                    </Button>
                  </div>
                </Reveal>

                <Reveal reducedMotion={reducedMotion} heroStagger={5}>
                  <p className="text-sm text-muted-foreground/70 mt-5">
                    No account required. Runs in your browser.
                  </p>
                </Reveal>
              </div>

              <Reveal reducedMotion={reducedMotion} direction="scale" heroStagger={3} className="lg:pl-4">
                <AnimatedRegex reducedMotion={reducedMotion} />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ─── Browser Support ─── */}
        <section className="py-10 border-b border-border/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground/60 mb-5">
              Works everywhere you write code
            </p>
            <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3 sm:gap-x-12 text-sm text-muted-foreground list-none m-0 p-0">
              {BROWSER_TARGETS.map((name) => (
                <li key={name} className="inline-flex items-center gap-2">
                  <Globe
                    className="h-4 w-4 text-primary/70 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="font-medium text-foreground/80">
                    {name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section className="py-28 sm:py-36">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <Reveal reducedMotion={reducedMotion} className="text-center mb-20">
              <p className="text-xs font-medium uppercase tracking-wider text-primary mb-4">
                How it works
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold max-w-3xl mx-auto leading-tight">
                From inherited regex to{" "}
                <span className="text-primary">confident review</span> in three
                steps
              </h2>
            </Reveal>

            <div className="space-y-24 lg:space-y-36">
              {HOW_IT_WORKS.map((step, i) => (
                <Reveal
                  key={step.title}
                  reducedMotion={reducedMotion}
                  stagger={i + 1}
                >
                  <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                    <div
                      className={`space-y-4 ${i % 2 === 1 ? "lg:order-2" : ""}`}
                    >
                      <span className="inline-block font-mono text-5xl font-bold text-primary/15">
                        {step.step}
                      </span>
                      <h3 className="font-serif text-2xl sm:text-3xl font-bold">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">
                        {step.description}
                      </p>
                    </div>
                    <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                      <div className="rounded-xl overflow-hidden border border-border/40">
                        <Image
                          src={step.image}
                          alt={step.imageAlt}
                          width={600}
                          height={400}
                          className="w-full h-auto object-cover aspect-[3/2]"
                          unoptimized
                        />
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── App Demo ─── */}
        <section className="py-20 sm:py-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <Reveal reducedMotion={reducedMotion} className="text-center mb-12">
              <p className="text-xs font-medium uppercase tracking-wider text-primary mb-4">
                See it in action
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold">
                One screen. Everything you need.
              </h2>
            </Reveal>
            <Reveal reducedMotion={reducedMotion} direction="scale">
              <div className="rounded-xl border border-border/40 overflow-hidden bg-card">
                <Image
                  src="/images/main.png"
                  alt="RegexLens application interface showing pattern analysis"
                  width={1200}
                  height={675}
                  className="w-full h-auto"
                  unoptimized
                />
              </div>
            </Reveal>
            <Reveal reducedMotion={reducedMotion} className="mt-8 text-center">
              <Button size="lg" asChild className="h-12 px-8 btn-lift">
                <Link href="/app">
                  Open RegexLens
                  <ArrowRight
                    className="ml-2 h-4 w-4"
                    aria-hidden="true"
                  />
                </Link>
              </Button>
            </Reveal>
          </div>
        </section>

        {/* ─── Capabilities ─── */}
        <section className="py-28 sm:py-36">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <Reveal reducedMotion={reducedMotion} direction="left" className="mb-16">
              <p className="text-xs font-medium uppercase tracking-wider text-primary mb-4">
                What you get
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold max-w-2xl">
                Built for understanding, not just matching
              </h2>
              <p className="text-muted-foreground text-lg mt-4 max-w-xl">
                Most tools tell you <em>if</em> a regex matches. RegexLens
                tells you <strong className="text-foreground">why</strong>,
                where it fails, and whether it is safe to ship.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
              {CAPABILITIES.map((cap, i) => (
                <Reveal
                  key={cap.title}
                  reducedMotion={reducedMotion}
                  stagger={i + 1}
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-2.5 shrink-0 mt-0.5">
                      <cap.icon
                        className="h-5 w-5 text-primary"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base mb-1">
                        {cap.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {cap.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Testimonials ─── */}
        <section className="py-24 sm:py-32 border-y border-border/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <Reveal reducedMotion={reducedMotion} className="text-center mb-12">
              <p className="text-xs font-medium uppercase tracking-wider text-primary mb-4">
                What developers say
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold">
                Loved by regex wranglers
              </h2>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <Reveal
                  key={t.name}
                  reducedMotion={reducedMotion}
                  stagger={i + 1}
                >
                  <div className="p-6 rounded-xl border border-border/40 card-lift h-full">
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                        <Image
                          src={t.avatar}
                          alt={t.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                          unoptimized
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Open Source + Trust ─── */}
        <section className="py-24 sm:py-32" aria-labelledby="oss-heading">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <Reveal reducedMotion={reducedMotion} className="text-center max-w-2xl mx-auto mb-10">
              <p className="text-xs font-medium uppercase tracking-wider text-primary mb-3">
                Open source
              </p>
              <h2
                id="oss-heading"
                className="font-serif text-2xl sm:text-3xl font-bold mb-4"
              >
                Built in the open. Privacy by default.
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg">
                MIT-licensed. Inspect the code, self-host, and help shape the
                roadmap on GitHub.
              </p>
            </Reveal>

            <Reveal reducedMotion={reducedMotion}>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mb-14 text-sm">
                {TRUST_ITEMS.map((item) => (
                  <span
                    key={item.text}
                    className="inline-flex items-center gap-2 text-muted-foreground"
                  >
                    <item.icon
                      className="h-4 w-4 text-primary/70 shrink-0"
                      aria-hidden="true"
                    />
                    {item.text}
                  </span>
                ))}
              </div>
            </Reveal>

            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground">
                <Link
                  href="/privacy"
                  className="text-primary hover:underline underline-offset-4"
                >
                  Privacy Policy
                </Link>
                <span className="mx-2 text-border">·</span>
                <Link
                  href="/terms"
                  className="text-primary hover:underline underline-offset-4"
                >
                  Terms of Service
                </Link>
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {OSS_LINKS.map((link, i) => (
                <Reveal
                  key={link.title}
                  reducedMotion={reducedMotion}
                  stagger={i + 1}
                  className={link.span ? "sm:col-span-2" : ""}
                >
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-xl border border-border/40 p-5 text-left hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer card-lift"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2.5 text-primary shrink-0">
                        <link.icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{link.title}</p>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {link.description}
                        </p>
                      </div>
                    </div>
                  </a>
                </Reveal>
              ))}
            </div>

            <Reveal reducedMotion={reducedMotion} className="mt-10">
              <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
                <Button size="lg" asChild className="h-12 px-8 btn-lift">
                  <Link href="/app">Open RegexLens</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="h-12 px-8 border-border/60 btn-lift-outline"
                >
                  <a
                    href={GITHUB_REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-2"
                  >
                    <Github className="h-4 w-4" aria-hidden="true" />
                    View on GitHub
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="h-12 px-8 border-border/60 btn-lift-outline"
                >
                  <a
                    href={SUPPORT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-2"
                  >
                    <Coffee className="h-4 w-4" aria-hidden="true" />
                    Buy me a coffee
                  </a>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="py-24 sm:py-32 border-t border-border/30">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-[1fr_1.5fr] gap-12 md:gap-16">
              <Reveal reducedMotion={reducedMotion} direction="left">
                <p className="text-xs font-medium uppercase tracking-wider text-primary mb-4">
                  FAQ
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold">
                  Got questions?
                </h2>
              </Reveal>
              <div className="space-y-2">
                {FAQ_ITEMS.map((item, i) => (
                  <Reveal
                    key={item.q}
                    reducedMotion={reducedMotion}
                    stagger={Math.min(i + 1, 6)}
                  >
                    <Collapsible
                      open={openFaq === item.q}
                      onOpenChange={(open) =>
                        setOpenFaq(open ? item.q : null)
                      }
                    >
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center justify-between w-full p-4 rounded-xl border border-border/40 hover:border-border/60 transition-colors cursor-pointer text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          <span className="font-medium text-sm pr-4">
                            {item.q}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${
                              openFaq === item.q ? "rotate-180" : ""
                            }`}
                            style={{ transitionTimingFunction: "var(--ease-out-quart)" }}
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
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Final CTA ─── */}
        <section className="py-28 sm:py-36 relative border-t border-border/30">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <Reveal reducedMotion={reducedMotion}>
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Ready to <span className="text-primary">review</span> your next
                regex?
              </h2>
            </Reveal>
            <Reveal reducedMotion={reducedMotion} stagger={2}>
              <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                Understand any pattern in seconds. Share a review link with your
                team.
              </p>
            </Reveal>
            <Reveal reducedMotion={reducedMotion} stagger={3}>
              <Button
                size="lg"
                asChild
                className="h-14 px-10 text-lg btn-lift"
              >
                <Link href="/app">
                  Start reviewing
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="py-16 border-t border-border/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="inline-block mb-4">
                <Image
                  src="/regexlens-logo.png"
                  alt="RegexLens"
                  width={160}
                  height={40}
                  sizes="160px"
                  className="h-9 w-auto rounded"
                  style={{ width: "auto" }}
                />
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Understand, review, and safely modify regular expressions.
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
                    Open RegexLens
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
                    Support
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
                  className="p-2 rounded-lg border border-border/30 hover:border-primary/30 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
