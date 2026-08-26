import {
  FileText,
  MousePointerClick,
  TreeDeciduous,
  AlertTriangle,
  Share2,
  Zap,
  Code2,
  HeartHandshake,
  Scale,
  Github,
  Coffee,
} from "lucide-react";
import {
  DOCS_URL,
  GITHUB_REPO_URL,
  GITHUB_CONTRIBUTING_URL,
  GITHUB_LICENSE_URL,
  GITHUB_DISCUSSIONS_URL,
  SUPPORT_URL,
} from "@/lib/site";

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Paste a regex you inherited",
    description:
      "Paste any regex from a PR, config file, or codebase. No need to start from scratch.",
    image: "/images/first.png",
    imageAlt: "RegexLens editor with a pasted regex pattern",
  },
  {
    step: "02",
    title: "Understand it instantly",
    description:
      "Read a plain-English breakdown, inspect the visual syntax tree, and verify matches in real time.",
    image: "/images/second.png",
    imageAlt: "RegexLens showing explanation and match highlighting",
  },
  {
    step: "03",
    title: "Review and share with your team",
    description:
      "Generate a shareable link for code reviews, export the analysis, and catch safety issues before production.",
    image: "/images/third.png",
    imageAlt: "Sharing a RegexLens analysis link in a PR comment",
  },
] as const;

export const CAPABILITIES = [
  {
    icon: FileText,
    title: "Plain-English explanations",
    description:
      "Every regex breaks down into clear, human-readable steps. Understand inherited patterns in seconds.",
  },
  {
    icon: MousePointerClick,
    title: "Live match highlighting",
    description:
      "Matches and capture groups light up in real time as you type test strings.",
  },
  {
    icon: TreeDeciduous,
    title: "Visual structure tree",
    description:
      "Inspect the regex as a collapsible AST. Click any node to understand its role in the pattern.",
  },
  {
    icon: AlertTriangle,
    title: "Safety warnings",
    description:
      "Catch catastrophic backtracking, redundant quantifiers, and correctness issues before production.",
  },
  {
    icon: Share2,
    title: "Shareable review links",
    description:
      "One link. Reviewers see the pattern, explanation, and warnings in a single click.",
  },
  {
    icon: Zap,
    title: "Runs in your browser",
    description:
      "Core matching and explanations run locally. No server round trips for the fundamentals.",
  },
] as const;

export const FAQ_ITEMS = [
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
] as const;

export const TRUST_ITEMS = [
  "Runs entirely in your browser",
  "No server-side regex execution",
  "Open analysis, no black boxes",
  "No tracking scripts by default",
] as const;

export const NAV_LINKS = [
  { href: "/app", label: "Workbench" },
  { href: DOCS_URL, label: "Docs", external: true },
  { href: GITHUB_REPO_URL, label: "GitHub", external: true },
] as const;

export const RUNTIME_TARGETS =
  "Chrome, Firefox, Safari, Edge, and Node.js" as const;

export const TESTIMONIALS = [
  {
    quote:
      "I used to spend 20 minutes deciphering regex in code reviews. Now I paste it into RegexLens and understand it in seconds.",
    name: "Silas Bempong",
    role: "Machine Learning Engineer",
    avatar: "/images/avatars/silas.jpg",
  },
  {
    quote:
      "The visual AST explorer is perfect for explaining complex patterns to my students. It has been a game-changer for teaching.",
    name: "Derrick Dwamena",
    role: "Cognitive Neuroscientist",
    avatar: "/images/avatars/derrick.jpg",
  },
  {
    quote:
      "Finally, a regex tool built for real work. The shareable links make code reviews so much faster.",
    name: "Sylvester Bempong",
    role: "Software Engineer",
    avatar: "/images/avatars/sylvester.jpg",
  },
] as const;

export const OSS_LINKS = [
  {
    href: GITHUB_REPO_URL,
    icon: Code2,
    title: "Source and issues",
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
  },
] as const;
