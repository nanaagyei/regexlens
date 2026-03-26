"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
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
  Twitter,
  Linkedin,
  Zap,
  Eye,
  CheckCircle2,
  Terminal,
  Braces,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

/* ─── Data ─── */

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Paste your regex",
    description:
      "Drop any regex pattern into the editor. Start from scratch or pick from built-in templates — email validators, URL parsers, log matchers, and more.",
    icon: Copy,
    image:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop&q=80",
    imageAlt: "Code editor showing regex pattern",
  },
  {
    step: "02",
    title: "Get instant clarity",
    description:
      "See plain-English explanations, live match highlighting, and a visual AST tree — all updating in real time as you type.",
    icon: Sparkles,
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&q=80",
    imageAlt: "Data visualization dashboard",
  },
  {
    step: "03",
    title: "Ship with confidence",
    description:
      "Share regex links with your team, export analysis, and catch performance issues before they reach production.",
    icon: Download,
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop&q=80",
    imageAlt: "Team collaborating on code",
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
    title: "Blazing Fast",
    description:
      "Everything runs in your browser. No server round-trips, no waiting. Just instant regex analysis.",
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
    a: "RegexLens is a developer tool that helps you understand, test, and document regular expressions. It provides plain-English explanations, live match highlighting, a visual structure tree, and built-in safety warnings.",
  },
  {
    q: "Do I need an account?",
    a: "No. You can use the full regex analysis toolkit for free without signing up. Accounts are optional for saving snippets to your personal library and accessing Pro features like export.",
  },
  {
    q: "Is my regex data stored on your servers?",
    a: "By default, no. RegexLens runs entirely in your browser. We only store patterns if you explicitly save them to your account.",
  },
  {
    q: "What regex flavor does it support?",
    a: "RegexLens supports JavaScript/ECMAScript regex syntax, including named groups, lookbehinds, and Unicode properties. This covers Node.js, browsers, Deno, Bun, and many other environments.",
  },
  {
    q: "Can I use it for code reviews?",
    a: "Absolutely. Generate a shareable link and paste it into your PR comment. Your reviewer will see the pattern, test text, explanations, and warnings in one click.",
  },
  {
    q: "What\u2019s included in Pro?",
    a: "Pro adds a saved pattern library, export to Markdown/JSON/PDF, version history with diffs, and priority support. The core analysis tools remain free forever.",
  },
];

const TRUST_ITEMS = [
  { icon: Shield, text: "Runs entirely in your browser" },
  { icon: Terminal, text: "No server-side regex execution" },
  { icon: Braces, text: "Open analysis — no black boxes" },
  { icon: CheckCircle2, text: "No tracking scripts by default" },
];

const NAV_LINKS = [
  { href: "/app", label: "Try it" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs", external: true },
];

const BROWSER_LOGOS = [
  { name: "Chrome", icon: "🌐" },
  { name: "Firefox", icon: "🦊" },
  { name: "Safari", icon: "🧭" },
  { name: "Edge", icon: "🔷" },
  { name: "Node.js", icon: "⬢" },
];

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

function AnimatedRegex() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const example = REGEX_EXAMPLES[currentIdx];
    let charIndex = 0;
    setIsTyping(true);
    setDisplayText("");

    const typeInterval = setInterval(() => {
      if (charIndex < example.pattern.length) {
        setDisplayText(example.pattern.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        setTimeout(() => {
          setCurrentIdx((prev) => (prev + 1) % REGEX_EXAMPLES.length);
        }, 2500);
      }
    }, 35);

    return () => clearInterval(typeInterval);
  }, [currentIdx]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-5 shadow-2xl shadow-primary/5">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <span className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <span className="text-xs text-muted-foreground ml-2 font-mono">
            regexlens
          </span>
        </div>
        <div className="font-mono text-sm sm:text-base leading-relaxed text-foreground/90 min-h-[28px] break-all">
          <span className="text-primary/60">{"/  "}</span>
          <span>{displayText}</span>
          <span
            className={`inline-block w-[2px] h-[1.1em] bg-primary ml-0.5 align-middle ${
              isTyping ? "animate-pulse" : "opacity-0"
            }`}
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs text-primary font-medium">
            <Sparkles className="w-3 h-3" />
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
  const heroRef = useRef<HTMLDivElement>(null);
  const howRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const searchParams = useSearchParams();

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

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
  }, []);

  /* ─── GSAP Animations ─── */

  useGSAP(
    () => {
      if (!heroRef.current) return;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(
        ".hero-badge",
        { opacity: 0, y: 40, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "back.out(1.4)" }
      )
        .fromTo(
          ".hero-headline",
          { opacity: 0, y: 60 },
          { opacity: 1, y: 0, duration: 1 },
          "-=0.5"
        )
        .fromTo(
          ".hero-sub",
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.8 },
          "-=0.5"
        )
        .fromTo(
          ".hero-cta",
          { opacity: 0, y: 30, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "back.out(1.2)" },
          "-=0.4"
        )
        .fromTo(
          ".hero-terminal",
          { opacity: 0, y: 50, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 1, ease: "back.out(1.1)" },
          "-=0.5"
        );
    },
    { scope: heroRef, dependencies: [] }
  );

  useGSAP(
    () => {
      if (!howRef.current) return;
      gsap.fromTo(
        ".how-header",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: howRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
      gsap.fromTo(
        ".how-card",
        { opacity: 0, y: 80, scale: 0.92 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.9,
          stagger: 0.2,
          ease: "back.out(1.1)",
          scrollTrigger: {
            trigger: howRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );
    },
    { scope: howRef, dependencies: [] }
  );

  useGSAP(
    () => {
      if (!featuresRef.current) return;
      gsap.fromTo(
        ".feat-card",
        { opacity: 0, y: 60, scale: 0.93 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "back.out(1.05)",
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 82%",
            toggleActions: "play none none none",
          },
        }
      );
    },
    { scope: featuresRef, dependencies: [] }
  );

  useGSAP(
    () => {
      if (!faqRef.current) return;
      gsap.fromTo(
        ".faq-item",
        { opacity: 0, x: -30, y: 20 },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: faqRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    },
    { scope: faqRef, dependencies: [] }
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-background relative overflow-hidden landing-grain"
      onMouseMove={handleMouseMove}
    >
      {/* Mouse-follow glow */}
      <div className="landing-glow fixed inset-0 pointer-events-none z-0" />

      {/* ─── Header ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/regexlens-logo.png"
              alt="RegexLens"
              width={120}
              height={120}
              className="rounded"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-border/60 hover:border-primary/40 transition-colors"
            >
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/app">
                Try RegexLens
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
                  <Link href="/app">Try RegexLens</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-16">
        {/* ─── Hero ─── */}
        <section ref={heroRef} className="relative py-28 sm:py-40 overflow-hidden">
          {/* Background mesh */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/8 blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/6 blur-[120px]" />
            <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-cyan-500/5 blur-[100px]" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <div className="hero-badge inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm text-primary font-medium mb-8">
              <Zap className="w-3.5 h-3.5" />
              Free regex analysis for developers
            </div>

            <h1 className="hero-headline font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Stop guessing.{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Start understanding.
              </span>
            </h1>

            <p className="hero-sub text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              RegexLens turns cryptic patterns into clear explanations, visual
              structure trees, and real-time match analysis — so you never have
              to decode a regex alone again.
            </p>

            <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center mb-4">
              <Button size="lg" asChild className="text-base h-12 px-8 shadow-lg shadow-primary/20">
                <Link href="/app">
                  Try it free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="text-base h-12 px-8 border-border/60 hover:border-primary/40"
              >
                <Link href="/app">View live examples</Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground/70 mb-16">
              No sign-up required. Works in your browser.
            </p>

            <div className="hero-terminal">
              <AnimatedRegex />
            </div>
          </div>
        </section>

        {/* ─── Browser Support ─── */}
        <section className="py-12 relative border-y border-border/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground/60 mb-6">
              Works everywhere you write code
            </p>
            <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
              {BROWSER_LOGOS.map((b) => (
                <div
                  key={b.name}
                  className="flex items-center gap-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-200"
                >
                  <span className="text-lg">{b.icon}</span>
                  <span className="text-sm font-medium">{b.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section ref={howRef} className="py-28 sm:py-36 relative">
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
                  className={`how-card grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
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
                        Try it now
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
                  src="https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1200&h=675&fit=crop&q=80"
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
                      Open RegexLens
                      <ArrowRight className="ml-2 h-4 w-4" />
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
                      className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/50 hover:border-primary/30 transition-colors duration-200 cursor-pointer group"
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
        <section ref={featuresRef} className="py-28 sm:py-36 relative">
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
                  className={`feat-card group relative rounded-2xl border border-border/40 bg-gradient-to-b ${f.accent} p-6 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-pointer`}
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
                  name: "Sarah Chen",
                  role: "Senior Frontend Engineer",
                  avatar:
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80",
                },
                {
                  quote:
                    "The safety warnings alone have saved us from two production incidents. The catastrophic backtracking detection is a game changer.",
                  name: "Marcus Johnson",
                  role: "DevOps Lead",
                  avatar:
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80",
                },
                {
                  quote:
                    "Finally, a regex tool built for real work, not demos. The shareable links make code reviews so much faster.",
                  name: "Priya Sharma",
                  role: "Full-Stack Developer",
                  avatar:
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80",
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
        <section ref={faqRef} className="py-24 sm:py-32 relative">
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
                      <div className="faq-item flex items-center justify-between w-full p-4 rounded-xl border border-border/40 bg-card/30 hover:bg-card/60 transition-colors cursor-pointer text-left group">
                        <span className="font-medium text-sm pr-4">
                          {item.q}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                            openFaq === item.q ? "rotate-180" : ""
                          }`}
                        />
                      </div>
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

        {/* ─── Pricing Teaser ─── */}
        <section className="py-20 sm:py-28 relative">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-4">
              Simple, developer-friendly pricing
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              The core tools are free forever. Upgrade only when you need a
              personal pattern library and export features.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="h-12 px-8">
                <Link href="/app">Start free</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 px-8 border-border/60"
              >
                <Link href="/pricing">Compare plans</Link>
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
              Join thousands of developers who ship regex with confidence.
              Free. No sign-up required.
            </p>
            <Button
              size="lg"
              asChild
              className="text-base h-14 px-10 shadow-lg shadow-primary/20 text-lg"
            >
              <Link href="/app">
                Try RegexLens free
                <ArrowRight className="ml-2 h-5 w-5" />
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
                  width={120}
                  height={120}
                  className="rounded"
                />
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Understand any regex instantly. Free developer tool with visual
                analysis.
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
                    Try it
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-foreground transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <a
                    href="/docs"
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
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Changelog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Terms
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Connect</h4>
              <div className="flex gap-2">
                <a
                  href="#"
                  className="p-2 rounded-lg bg-card/50 border border-border/30 hover:border-primary/30 hover:bg-primary/10 transition-colors duration-200"
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="p-2 rounded-lg bg-card/50 border border-border/30 hover:border-primary/30 hover:bg-primary/10 transition-colors duration-200"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="p-2 rounded-lg bg-card/50 border border-border/30 hover:border-primary/30 hover:bg-primary/10 transition-colors duration-200"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
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
