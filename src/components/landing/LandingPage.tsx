"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowRight, ChevronDown, Github, Menu } from "lucide-react";
import {
  DOCS_URL,
  GITHUB_REPO_URL,
  GITHUB_CONTRIBUTING_URL,
  GITHUB_DISCUSSIONS_URL,
  SUPPORT_URL,
} from "@/lib/site";
import { cn } from "@/lib/utils";
import {
  LandingMiniBench,
  useLandingBench,
} from "@/components/landing/LandingMiniBench";
import { HeroCaptureMark } from "@/components/landing/HeroCaptureMark";
import {
  CAPABILITIES,
  FAQ_ITEMS,
  HOW_IT_WORKS,
  NAV_LINKS,
  OSS_LINKS,
  RUNTIME_TARGETS,
  TESTIMONIALS,
  TRUST_ITEMS,
} from "@/components/landing/content";

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

function Reveal({
  children,
  className = "",
  reducedMotion,
}: {
  children: React.ReactNode;
  className?: string;
  reducedMotion: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -32px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <div
      ref={ref}
      className={cn(!reducedMotion && "reveal reveal-up", className)}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="landing-label mb-4">{children}</p>;
}

function navClassName() {
  return "text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm";
}

gsap.registerPlugin(useGSAP);

function LandingHero() {
  const bench = useLandingBench();
  const heroRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const strokes = heroRef.current?.querySelectorAll(".hero-mark-stroke");
        strokes?.forEach((node) => {
          const path = node as SVGGeometryElement;
          if (typeof path.getTotalLength !== "function") return;
          const length = path.getTotalLength();
          gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
          gsap.to(path, {
            strokeDashoffset: 0,
            duration: 1.15,
            ease: "power3.out",
          });
        });

        gsap.from(".hero-mark-bar", {
          scaleX: 0,
          transformOrigin: "left center",
          duration: 0.55,
          stagger: 0.08,
          delay: 0.45,
          ease: "power3.out",
        });

        const tl = gsap.timeline({
          defaults: { ease: "power4.out", duration: 0.65 },
        });
        tl.from(".hero-kicker", { y: 10, autoAlpha: 0, duration: 0.4 })
          .from(
            ".hero-line",
            { y: 22, autoAlpha: 0, stagger: 0.09 },
            "-=0.18",
          )
          .from(
            ".hero-lede, .hero-actions, .hero-note",
            { y: 14, autoAlpha: 0, stagger: 0.07 },
            "-=0.38",
          )
          .from(".hero-bench", { x: 36, autoAlpha: 0 }, "-=0.48");
      });
      return () => mm.revert();
    },
    { scope: heroRef },
  );

  return (
    <section
      ref={heroRef}
      aria-labelledby="hero-heading"
      className="border-b border-border/30 py-20 sm:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-stretch lg:grid-cols-[minmax(0,0.88fr)_clamp(5.5rem,14vw,12rem)_minmax(0,1.12fr)]">
          <div className="hero-copy relative self-start">
            <HeroCaptureMark className="pointer-events-none absolute -left-12 top-8 h-[22rem] w-[19rem] text-foreground/10 sm:-left-16 sm:h-[26rem] sm:w-[22rem]" />
            <div className="relative max-w-[20.5rem] sm:max-w-[22.5rem] xl:max-w-[26rem]">
              <Badge
                variant="outline"
                className="hero-kicker mb-6 font-normal"
              >
                Open source, MIT licensed
              </Badge>
              <h1
                id="hero-heading"
                className="mb-6 font-serif text-[clamp(2.25rem,5vw,4.5rem)] font-bold leading-[1.08] tracking-[-0.02em] text-foreground"
              >
                <span className="hero-line block">Stop guessing.</span>
                <span className="hero-line block">Start understanding.</span>
              </h1>
              <p className="hero-lede mb-8 max-w-[42ch] text-lg leading-relaxed text-muted-foreground">
                Paste any regex and get instant clarity. Plain-English
                breakdowns, safety warnings, and shareable analysis for code
                reviews.
              </p>
              <div
                className="hero-actions flex flex-col gap-3 sm:flex-row"
                aria-label="Primary calls to action"
              >
                <Button size="lg" asChild className="h-12 px-8 btn-lift">
                  <Link href={bench.appHref}>
                    Open RegexLens
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="h-12 px-8 border-border/60 btn-lift-outline"
                >
                  <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
                    Read the docs
                  </a>
                </Button>
              </div>
              <p className="hero-note mt-5 text-sm text-muted-foreground/70">
                No account required. Runs in your browser.
              </p>
            </div>
          </div>

          <div
            className="relative hidden lg:block"
            aria-hidden="true"
          >
            <Separator
              orientation="vertical"
              className="absolute inset-y-[8%] left-1/2 h-auto w-px -translate-x-1/2 bg-border/50"
            />
          </div>

          <div className="hero-bench mt-16 self-start lg:mt-1">
            <LandingMiniBench bench={bench} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingPage() {
  const searchParams = useSearchParams();
  const reducedMotion = usePrefersReducedMotion();
  const [openFaq, setOpenFaq] = useState<string | null>(FAQ_ITEMS[0]?.q ?? null);

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

  const featuredQuote = TESTIMONIALS[0];
  const supportingQuotes = TESTIMONIALS.slice(1);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 h-14 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/regexlens-logo.png"
              alt="RegexLens home"
              width={160}
              height={40}
              priority
              loading="eager"
              fetchPriority="high"
              sizes="144px"
              className="h-8 w-auto rounded"
              style={{ width: "auto" }}
            />
          </Link>

          <nav
            aria-label="Primary"
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex"
          >
            {NAV_LINKS.map((link) =>
              "external" in link && link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={navClassName()}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className={navClassName()}
                >
                  {link.label}
                </Link>
              ),
            )}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Button
              size="sm"
              variant="outline"
              asChild
              className="btn-lift-outline"
            >
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
            <Button
              size="sm"
              variant="outline"
              asChild
              className="btn-lift-outline"
            >
              <Link href="/signin?callbackUrl=%2Fapp">Sign in</Link>
            </Button>
            <Button size="sm" asChild className="btn-lift">
              <Link href="/app" className="gap-1.5">
                Open RegexLens
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {NAV_LINKS.map((link) =>
                  "external" in link && link.external ? (
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
                  <a
                    href={GITHUB_REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Star on GitHub
                  </a>
                </DropdownMenuItem>
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
        <LandingHero />

        <section className="border-b border-border/30 py-10">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <p className="text-center text-sm text-muted-foreground">
              Works where you write JavaScript: {RUNTIME_TARGETS}.
            </p>
          </div>
        </section>

        <section className="py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal reducedMotion={reducedMotion} className="mb-20 max-w-3xl">
              <SectionLabel>How it works</SectionLabel>
              <h2 className="font-serif text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-[1.2]">
                From inherited regex to confident review in three steps
              </h2>
            </Reveal>

            <div className="space-y-24 lg:space-y-28">
              {HOW_IT_WORKS.map((step, index) => (
                <Reveal key={step.title} reducedMotion={reducedMotion}>
                  <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                    <div
                      className={cn(
                        "space-y-4",
                        index % 2 === 1 && "lg:order-2",
                      )}
                    >
                      <span
                        className="block font-mono text-5xl font-bold text-foreground/12"
                        aria-hidden="true"
                      >
                        {step.step}
                      </span>
                      <h3 className="font-serif text-2xl font-bold sm:text-3xl">
                        {step.title}
                      </h3>
                      <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                    <div className={index % 2 === 1 ? "lg:order-1" : undefined}>
                      <div className="overflow-hidden rounded-lg border border-border bg-card">
                        <Image
                          src={step.image}
                          alt={step.imageAlt}
                          width={600}
                          height={400}
                          sizes="(min-width: 1024px) 50vw, 100vw"
                          className="h-auto w-full object-contain object-top"
                        />
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal reducedMotion={reducedMotion} className="mb-10">
              <SectionLabel>See it in action</SectionLabel>
              <h2 className="font-serif text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-[1.2]">
                One screen. Everything you need.
              </h2>
            </Reveal>
            <Reveal reducedMotion={reducedMotion}>
              <figure>
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  <Image
                    src="/images/main.png"
                    alt="RegexLens application interface showing pattern analysis"
                    width={1200}
                    height={675}
                    className="h-auto w-full"
                  />
                </div>
                <figcaption className="mt-4 text-sm text-muted-foreground">
                  Pattern, matches, explanation, and warnings in a single
                  workbench.
                </figcaption>
              </figure>
            </Reveal>
            <Reveal reducedMotion={reducedMotion} className="mt-8">
              <Button size="lg" asChild className="h-12 px-8 btn-lift">
                <Link href="/app">
                  Open RegexLens
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </Reveal>
          </div>
        </section>

        <section className="py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <Reveal reducedMotion={reducedMotion} className="mb-16 max-w-2xl">
              <SectionLabel>What you get</SectionLabel>
              <h2 className="font-serif text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-[1.2]">
                Built for understanding, not just matching
              </h2>
              <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                Most tools tell you if a regex matches. RegexLens tells you{" "}
                <strong className="font-semibold text-foreground">why</strong>,
                where it fails, and whether it is safe to ship.
              </p>
            </Reveal>

            <dl className="grid gap-x-16 gap-y-10 md:grid-cols-2">
              {CAPABILITIES.map((cap, index) => {
                const Icon = cap.icon;
                return (
                  <Reveal key={cap.title} reducedMotion={reducedMotion}>
                    <div className={index === 0 ? "md:col-span-2" : undefined}>
                      {index === 0 ? (
                        <div className="mb-3 inline-flex rounded-md bg-muted p-2 text-muted-foreground">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                      ) : null}
                      <dt className="text-base font-semibold">{cap.title}</dt>
                      <dd className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
                        {cap.description}
                      </dd>
                    </div>
                  </Reveal>
                );
              })}
            </dl>
          </div>
        </section>

        <section className="border-y border-border/30 py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <Reveal reducedMotion={reducedMotion} className="mb-12">
              <SectionLabel>What developers say</SectionLabel>
            </Reveal>
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16">
              <Reveal reducedMotion={reducedMotion}>
                <blockquote>
                  <p className="font-serif text-2xl font-medium leading-snug sm:text-3xl">
                    &ldquo;{featuredQuote.quote}&rdquo;
                  </p>
                  <footer className="mt-6 flex items-center gap-3">
                    <Image
                      src={featuredQuote.avatar}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold">
                        {featuredQuote.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {featuredQuote.role}
                      </p>
                    </div>
                  </footer>
                </blockquote>
              </Reveal>
              <div className="space-y-8 border-t border-border/40 pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
                {supportingQuotes.map((quote) => (
                  <Reveal key={quote.name} reducedMotion={reducedMotion}>
                    <blockquote>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        &ldquo;{quote.quote}&rdquo;
                      </p>
                      <footer className="mt-3 flex items-center gap-2">
                        <Image
                          src={quote.avatar}
                          alt=""
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-semibold">{quote.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {quote.role}
                          </p>
                        </div>
                      </footer>
                    </blockquote>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-28" aria-labelledby="oss-heading">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <Reveal
              reducedMotion={reducedMotion}
              className="mb-10 max-w-2xl"
            >
              <SectionLabel>Open source</SectionLabel>
              <h2
                id="oss-heading"
                className="mb-4 font-serif text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-[1.2]"
              >
                Built in the open. Privacy by default.
              </h2>
              <p className="text-lg text-muted-foreground">
                MIT-licensed. Inspect the code, self-host, and help shape the
                roadmap on GitHub.
              </p>
            </Reveal>

            <p className="mb-10 text-sm text-muted-foreground">
              {TRUST_ITEMS.join(" · ")}
            </p>

            <p className="mb-10 text-sm text-muted-foreground">
              <Link
                href="/privacy"
                className="text-primary underline-offset-4 hover:underline"
              >
                Privacy Policy
              </Link>
              <span className="mx-2 text-border">·</span>
              <Link
                href="/terms"
                className="text-primary underline-offset-4 hover:underline"
              >
                Terms of Service
              </Link>
            </p>

            <ul className="divide-y divide-border/40 border-y border-border/40">
              {OSS_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.title}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <Icon
                        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary"
                        aria-hidden="true"
                      />
                      <span>
                        <span className="block text-sm font-semibold group-hover:text-primary">
                          {link.title}
                        </span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">
                          {link.description}
                        </span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>

            <div className="mt-10 flex flex-wrap gap-3">
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
            </div>
          </div>
        </section>

        <section className="border-t border-border/30 py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid gap-12 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-16">
              <Reveal reducedMotion={reducedMotion}>
                <SectionLabel>FAQ</SectionLabel>
                <h2 className="font-serif text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-[1.2]">
                  Account, privacy, and flavor
                </h2>
              </Reveal>
              <div>
                {FAQ_ITEMS.map((item) => {
                  const open = openFaq === item.q;
                  return (
                    <div
                      key={item.q}
                      className="border-b border-border/40 first:border-t"
                    >
                      <h3>
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() =>
                            setOpenFaq(open ? null : item.q)
                          }
                          className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          {item.q}
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
                              open && "rotate-180",
                            )}
                            style={{
                              transitionTimingFunction:
                                "var(--ease-out-quart)",
                            }}
                            aria-hidden="true"
                          />
                        </button>
                      </h3>
                      <div
                        className="faq-content"
                        data-state={open ? "open" : "closed"}
                      >
                        <div className="faq-content-inner">
                          <p className="pb-4 text-sm leading-relaxed text-muted-foreground">
                            {item.a}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border/30 py-28 sm:py-32">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <Reveal reducedMotion={reducedMotion}>
              <h2 className="mb-6 font-serif text-[clamp(2.25rem,5vw,4.5rem)] font-bold leading-[1.1] tracking-[-0.02em]">
                Ready to review your next regex?
              </h2>
            </Reveal>
            <Reveal reducedMotion={reducedMotion}>
              <p className="mb-10 max-w-xl text-lg text-muted-foreground">
                Understand any pattern in seconds. Share a review link with your
                team.
              </p>
            </Reveal>
            <Reveal reducedMotion={reducedMotion}>
              <Button size="lg" asChild className="h-12 px-8 text-base btn-lift">
                <Link href="/app">
                  Open RegexLens
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/30 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-5">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="mb-4 inline-block">
                <Image
                  src="/regexlens-logo.png"
                  alt="RegexLens"
                  width={160}
                  height={40}
                  sizes="144px"
                  className="h-8 w-auto rounded"
                  style={{ width: "auto" }}
                />
              </Link>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Understand, review, and safely modify regular expressions.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">Product</h4>
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
              <h4 className="mb-4 text-sm font-semibold">Resources</h4>
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
              <h4 className="mb-4 text-sm font-semibold">Legal</h4>
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
              <h4 className="mb-4 text-sm font-semibold">Connect</h4>
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border/40 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="RegexLens on GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="border-t border-border/20 pt-8">
            <p className="text-center text-xs text-muted-foreground/60">
              &copy; {new Date().getFullYear()} RegexLens. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
