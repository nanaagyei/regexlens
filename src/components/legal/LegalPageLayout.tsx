import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOCS_URL } from "@/lib/site";

type LegalPageLayoutProps = {
  title: string;
  children: React.ReactNode;
};

export function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="sm" className="shrink-0 gap-1.5" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Link>
            </Button>
            <span className="h-6 w-px bg-border shrink-0 hidden sm:block" aria-hidden />
            <Link
              href="/"
              className="flex items-center gap-2 min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="font-semibold truncate hidden sm:inline">RegexLens</span>
            </Link>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0" asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
              Homepage
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <article className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">{title}</h1>
          <div
            className="max-w-none space-y-4 text-sm sm:text-base leading-relaxed text-foreground/90 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:scroll-mt-28 [&_h2]:text-foreground [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-foreground [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_strong]:text-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4"
          >
            {children}
          </div>
        </article>
      </main>

      <footer className="border-t border-border py-6 mt-auto">
        <div className="max-w-3xl mx-auto px-4 flex flex-wrap gap-x-6 gap-y-2 justify-center text-sm text-muted-foreground">
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Documentation
          </a>
          <Link href="/changelog" className="hover:text-foreground transition-colors">
            Changelog
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
