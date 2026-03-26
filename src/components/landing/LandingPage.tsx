"use client";

import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Code2,
  Shield,
  Play,
  ChevronDown,
  Menu,
  ArrowRight,
  Copy,
  Sparkles,
  Download,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const SECTION_LABEL_CLASS =
  "flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4";

const HOW_IT_WORKS = [
  {
    title: "Paste your regex",
    description:
      "Paste any regex pattern into the editor. Or start from our built-in examples.",
    gradient: "from-pink-500/20 via-purple-500/20 to-transparent",
    icon: Copy,
  },
  {
    title: "Get instant explanation",
    description:
      "See plain-English steps, live match highlighting, and a visual structure tree.",
    gradient: "from-blue-500/20 via-cyan-500/20 to-transparent",
    icon: Sparkles,
  },
  {
    title: "Share and export",
    description:
      "Copy shareable links, export to multiple formats. No account required.",
    gradient: "from-amber-500/20 via-orange-500/20 to-transparent",
    icon: Download,
  },
];

const FEATURES = [
  {
    icon: FileText,
    title: "Plain-English Explanations",
    description: "Understand any regex as a readable sequence of steps.",
    gradient: "from-pink-500/10 to-purple-500/10",
  },
  {
    icon: MousePointerClick,
    title: "Live Match Highlighting",
    description: "See matches and capture groups update as you type.",
    gradient: "from-blue-500/10 to-cyan-500/10",
  },
  {
    icon: TreeDeciduous,
    title: "Structure View",
    description:
      "Explore the internal structure of your regex with a collapsible tree.",
    gradient: "from-emerald-500/10 to-teal-500/10",
  },
  {
    icon: AlertTriangle,
    title: "Built-in Safety Warnings",
    description: "Catch common regex mistakes before they hit production.",
    gradient: "from-amber-500/10 to-orange-500/10",
  },
  {
    icon: Share2,
    title: "Shareable Links",
    description: "Send a regex to a teammate and they see exactly what you see.",
    gradient: "from-violet-500/10 to-purple-500/10",
  },
];

const CORE_FEATURES = [
  {
    id: "explanations",
    title: "Plain-English Explanations",
    description:
      "Every regex breaks down into clear, human-readable steps. No more deciphering symbols — understand what each part does and why.",
  },
  {
    id: "matches",
    title: "Live Match Highlighting",
    description:
      "Type or paste test text and watch matches highlight in real time. See capture groups, alternations, and quantifiers in action.",
  },
  {
    id: "structure",
    title: "Structure View",
    description:
      "Explore the AST of your regex with a collapsible tree. Click any node to highlight its corresponding pattern in the editor.",
  },
  {
    id: "warnings",
    title: "Built-in Safety Warnings",
    description:
      "Get alerts for common pitfalls: catastrophic backtracking, redundant patterns, and correctness issues before they reach production.",
  },
];

const FAQ_ITEMS = [
  {
    q: "What is RegexLens?",
    a: "RegexLens is a developer tool that helps you understand, test, and document regular expressions. It provides plain-English explanations, live match highlighting, a visual structure tree, and built-in warnings.",
  },
  {
    q: "Do I need an account?",
    a: "No. You can use RegexLens for free without signing up. Accounts are optional for saving snippets and accessing pro features.",
  },
  {
    q: "How does it work?",
    a: "Paste your regex and test text into the editor. RegexLens parses the pattern, explains each part in plain English, highlights matches in real time, and shows the structure as a tree.",
  },
  {
    q: "Is my regex data stored?",
    a: "By default, no. RegexLens runs in your browser. We don't store your patterns unless you explicitly save them to your account.",
  },
  {
    q: "What regex flavor does it support?",
    a: "RegexLens supports JavaScript/ECMAScript regex syntax, which is widely used in Node.js, browsers, and many other environments.",
  },
];

const TRUST_ITEMS = [
  "Runs entirely in the browser",
  "No regex data stored by default",
  "No tracking scripts",
  "No AI rewriting your code",
];

const NAV_LINKS = [
  { href: "/app", label: "Try it" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs", external: true },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className={SECTION_LABEL_CLASS}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-sm bg-accent-label" />
      {children}
    </div>
  );
}

export function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const coreFeaturesRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const problemRef = useRef<HTMLDivElement>(null);
  const solutionRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const [activeFeature, setActiveFeature] = useState(CORE_FEATURES[0].id);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Redirect share links (/?p=...) to /app?p=...
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

  useGSAP(
    () => {
      if (!heroRef.current) return;

      const badge = heroRef.current.querySelector(".hero-badge");
      const headline = heroRef.current.querySelector(".hero-headline");
      const sub = heroRef.current.querySelector(".hero-sub");
      const cta = heroRef.current.querySelector(".hero-cta");
      const tagline = heroRef.current.querySelector(".hero-tagline");

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(
        badge,
        { opacity: 0, y: 60, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 1, ease: "back.out(1.2)" }
      )
        .fromTo(
          headline,
          { opacity: 0, y: 80, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: "power3.out" },
          "-=0.7"
        )
        .fromTo(
          sub,
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" },
          "-=0.6"
        )
        .fromTo(
          cta,
          { opacity: 0, y: 40, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "back.out(1.1)" },
          "-=0.5"
        )
        .fromTo(
          tagline,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.4"
        );
    },
    { scope: heroRef, dependencies: [] }
  );

  useGSAP(
    () => {
      if (!howItWorksRef.current) return;
      const header = howItWorksRef.current.querySelector(".how-it-works-header");
      const cards = howItWorksRef.current.querySelectorAll(".how-it-works-card");
      if (header) {
        gsap.fromTo(
          header,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: howItWorksRef.current,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          }
        );
      }
      gsap.fromTo(
        cards,
        { opacity: 0, scale: 0.8, y: 100 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1,
          stagger: 0.2,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: howItWorksRef.current,
            start: "top 90%",
            end: "top 30%",
            toggleActions: "play none none none",
          },
        }
      );
    },
    { scope: howItWorksRef, dependencies: [] }
  );

  useGSAP(
    () => {
      if (!coreFeaturesRef.current) return;
      const section = coreFeaturesRef.current;
      const pinWrapper = section.querySelector(".core-features-pin-wrapper");
      const left = section.querySelector(".core-features-left");
      const right = section.querySelector(".core-features-right");

      // Initial entrance animation
      gsap.fromTo(
        [left, right],
        { opacity: 0, y: 60, x: -20 },
        {
          opacity: 1,
          y: 0,
          x: 0,
          duration: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 95%",
            toggleActions: "play none none none",
          },
        }
      );

      // Sticky pin + parallax scroll through features (scroll-driven, no clicks)
      const featureCount = CORE_FEATURES.length;
      ScrollTrigger.create({
        trigger: pinWrapper,
        start: "top top",
        end: `+=${featureCount * 100}%`,
        pin: true,
        pinSpacing: true,
        onUpdate: (self) => {
          const progress = self.progress;
          const idx = Math.min(
            featureCount - 1,
            Math.floor(progress * featureCount)
          );
          setActiveFeature(CORE_FEATURES[idx].id);
        },
      });
    },
    { scope: coreFeaturesRef, dependencies: [] }
  );

  useGSAP(
    () => {
      if (!featuresRef.current) return;
      const cards = featuresRef.current.querySelectorAll(".feature-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 70, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.9,
          stagger: 0.12,
          ease: "back.out(1.1)",
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 88%",
            end: "top 20%",
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
      const items = faqRef.current.querySelectorAll(".faq-item");
      gsap.fromTo(
        items,
        { opacity: 0, x: -40, y: 30 },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: faqRef.current,
            start: "top 92%",
            end: "top 30%",
            toggleActions: "play none none none",
          },
        }
      );
    },
    { scope: faqRef, dependencies: [] }
  );

  useGSAP(
    () => {
      if (!problemRef.current) return;
      const el = problemRef.current;
      gsap.fromTo(
        el,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            toggleActions: "play none none none",
          },
        }
      );
    },
    { scope: problemRef, dependencies: [] }
  );

  useGSAP(
    () => {
      if (!solutionRef.current) return;
      const cards = solutionRef.current.querySelectorAll(".solution-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 50, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "back.out(1.05)",
          scrollTrigger: {
            trigger: solutionRef.current,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        }
      );
    },
    { scope: solutionRef, dependencies: [] }
  );

  useGSAP(
    () => {
      if (!demoRef.current) return;
      const box = demoRef.current.querySelector(".demo-placeholder");
      gsap.fromTo(
        box,
        { opacity: 0, scale: 0.92, y: 40 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: demoRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    },
    { scope: demoRef, dependencies: [] }
  );

  return (
    <div className="min-h-screen bg-background relative">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
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

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/app">Try RegexLens free</Link>
            </Button>
          </div>

          {/* Mobile menu */}
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
                      <a href={link.href} target="_blank" rel="noopener noreferrer">
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
                  <Link href="/app">Try RegexLens free</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero */}
        <section
          ref={heroRef}
          className="relative py-24 sm:py-32 overflow-hidden"
        >
          <div
            className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent"
            style={{ backgroundAttachment: "fixed" }}
          />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <Badge
              variant="secondary"
              className="hero-badge mb-6 bg-accent-label/20 text-accent-label border-accent-label/30"
            >
              Regex Visualizer
            </Badge>
            <h1 className="hero-headline font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Understand Regular Expressions Instantly
            </h1>
            <p className="hero-sub text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              RegexLens turns complex regex patterns into clear explanations,
              visual structure, and real-world insights — so you never have to
              guess what a regex does again.
            </p>
            <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-base">
                <Link href="/app">Try it free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <Link href="/app">
                  View examples
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <p className="hero-tagline mt-6 text-sm text-muted-foreground">
              Built for developers who write regex at work — not for demos.
            </p>
          </div>
        </section>

        {/* Trust logos placeholder */}
        <section className="section-fade py-12 relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="text-center text-sm text-muted-foreground mb-6">
              Works with browsers you use
            </p>
            <div className="flex flex-wrap justify-center gap-8 opacity-60">
              {["Chrome", "Firefox", "Safari", "Edge", "Node.js"].map((name) => (
                <span
                  key={name}
                  className="text-sm font-medium text-muted-foreground"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section ref={howItWorksRef} className="section-fade py-24 sm:py-32 relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="how-it-works-header">
              <SectionLabel>How it works</SectionLabel>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4 max-w-2xl">
              Go from regex confusion to clarity in minutes
            </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {HOW_IT_WORKS.map((step) => (
                <div
                  key={step.title}
                  className={`how-it-works-card rounded-2xl p-6 border border-border bg-gradient-to-b ${step.gradient} hover:border-primary/30 transition-colors`}
                >
                  <step.icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Demo placeholder */}
        <section ref={demoRef} className="section-fade py-16 sm:py-24 bg-muted/5 relative">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="font-serif text-2xl font-semibold text-center mb-8">
              See it in action
            </h2>
            <div
              className="demo-placeholder aspect-video rounded-xl border border-border bg-muted/30 flex items-center justify-center"
              aria-label="Product demo video placeholder"
            >
              <div className="text-center text-muted-foreground">
                <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm font-medium">Product demo</p>
                <p className="text-xs mt-1">Video placeholder</p>
              </div>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section ref={problemRef} className="section-fade py-20 sm:py-28 relative">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-6">
              Regex is powerful — and painful
            </h2>
            <p className="text-muted-foreground mb-6">
              Regular expressions are hard to read, harder to explain, easy to get
              wrong, and dangerous when inefficient.
            </p>
            <p className="text-muted-foreground">
              Most tools tell you <em>if</em> a regex matches. Very few tell you{" "}
              <strong>why</strong>.
            </p>
          </div>
        </section>

        {/* Core Features (sticky parallax - scroll to cycle through features, no clicking) */}
        <section
          ref={coreFeaturesRef}
          className="core-features-section section-fade bg-muted/5 relative"
        >
          <div className="core-features-pin-wrapper min-h-screen flex items-center py-24">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
              <SectionLabel>Core features</SectionLabel>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-12 max-w-2xl">
                Regex features that make you a pro, instantly.
              </h2>
              <p className="text-sm text-muted-foreground mb-8">
                Scroll to explore each feature — no clicking required.
              </p>
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
                <div className="core-features-left space-y-2">
                  {CORE_FEATURES.map((f) => (
                    <div
                      key={f.id}
                      className={`w-full text-left p-4 rounded-lg transition-all duration-300 ${
                        activeFeature === f.id
                          ? "bg-primary/10 border border-primary/30 text-foreground"
                          : "border border-transparent text-muted-foreground"
                      }`}
                    >
                      <span className="font-medium">{f.title}</span>
                    </div>
                  ))}
                </div>
                <div className="core-features-right">
                  {CORE_FEATURES.filter((f) => f.id === activeFeature).map((f) => (
                    <div key={f.id} className="space-y-4">
                      <h3 className="font-semibold text-lg">{f.title}</h3>
                      <p className="text-muted-foreground">{f.description}</p>
                      <div className="mt-6 rounded-lg border border-border bg-card p-4 font-mono text-sm">
                        <div className="text-muted-foreground">
                          <span className="text-primary">/</span>
                          <span className="text-foreground">\d{`{3}`}</span>
                          <span className="text-primary">-</span>
                          <span className="text-foreground">\d{`{3}`}</span>
                          <span className="text-primary">-</span>
                          <span className="text-foreground">\d{`{4}`}</span>
                          <span className="text-primary">/</span>
                          <span className="text-muted-foreground ml-2">
                            {"// Phone pattern"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Solution / RegexLens shows you */}
        <section ref={solutionRef} className="section-fade py-20 sm:py-28 relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="font-serif text-2xl font-semibold mb-8">
              RegexLens shows you:
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 text-left mb-10">
              <div className="solution-card flex items-start gap-3 p-4 rounded-lg border border-border">
                <Code2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong>What it matches</strong> — live, with highlights
                </div>
              </div>
              <div className="solution-card flex items-start gap-3 p-4 rounded-lg border border-border">
                <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong>Why it matches</strong> — step-by-step explanation
                </div>
              </div>
              <div className="solution-card flex items-start gap-3 p-4 rounded-lg border border-border">
                <TreeDeciduous className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong>How it&apos;s built</strong> — visual structure tree
                </div>
              </div>
              <div className="solution-card flex items-start gap-3 p-4 rounded-lg border border-border">
                <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong>Where it can fail</strong> — performance & correctness
                  warnings
                </div>
              </div>
            </div>
            <p className="text-muted-foreground">
              All in one screen. No setup. No accounts required.
            </p>
          </div>
        </section>

        {/* Feature highlights */}
        <section
          ref={featuresRef}
          className="section-fade py-24 sm:py-32 bg-muted/5 relative"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <SectionLabel>Feature highlights</SectionLabel>
            <h2 className="font-serif text-3xl font-bold text-center mb-12">
              Built for clarity
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className={`feature-card p-6 rounded-xl border border-border bg-gradient-to-b ${f.gradient} hover:border-primary/30 transition-colors`}
                >
                  <f.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-medium mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section ref={faqRef} className="section-fade py-24 sm:py-32 relative">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16">
              <div>
                <SectionLabel>Ask us out</SectionLabel>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold">
                  Frequently Asked Questions
                </h2>
              </div>
              <div className="space-y-2">
                {FAQ_ITEMS.map((item) => (
                  <Collapsible
                    key={item.q}
                    open={openFaq === item.q}
                    onOpenChange={(open) =>
                      setOpenFaq(open ? item.q : null)
                    }
                  >
                    <CollapsibleTrigger asChild>
                      <div className="faq-item flex items-center justify-between w-full p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer text-left">
                        <span className="font-medium text-sm">{item.q}</span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 transition-transform ${
                            openFaq === item.q ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-2 text-sm text-muted-foreground border-x border-b border-border rounded-b-lg -mt-2 mx-2">
                        {item.a}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trust */}
        <section className="section-fade py-20 sm:py-28 bg-muted/5 relative">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="font-serif text-2xl font-semibold text-center mb-8">
              Trust & privacy
            </h2>
            <div className="flex flex-wrap justify-center gap-6">
              {TRUST_ITEMS.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <Shield className="h-4 w-4 text-primary shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing teaser */}
        <section className="section-fade py-20 sm:py-28 relative">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="font-serif text-2xl font-semibold mb-6">
              Simple pricing for developers
            </h2>
            <p className="text-muted-foreground mb-8">
              RegexLens is free to use. Upgrade only if it saves you time in real
              projects.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/app">Try for free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="section-fade py-24 sm:py-32 relative">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
              Stop guessing what your regex does.
            </h2>
            <p className="text-muted-foreground mb-8">
              Start using RegexLens — free.
            </p>
            <Button size="lg" asChild className="text-base">
              <Link href="/app">Try RegexLens free</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="section-fade py-16 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/regexlens-logo.png"
                  alt="RegexLens"
                  width={120}
                  height={120}
                  className="rounded"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Turns complex regex into clear explanations. All in one screen.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">About RegexLens</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/app" className="hover:text-foreground transition-colors">
                    Try it
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <a href="/docs" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                    Docs
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    GitHub
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Changelog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Stay connected</h4>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} RegexLens. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
