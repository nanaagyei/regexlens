import { RegexTemplate } from "@/types";

export const TEMPLATES: RegexTemplate[] = [
  {
    id: "ab-two-digits",
    name: "A/B then two digits",
    description: "Match sequences of A or B followed by exactly two digits",
    pattern: "^([AB]+)\\d{2}$",
    flags: "",
    text: `AB12
A99
BBB00
AC12
AB123`,
    notes: ["Only A or B allowed", "Exactly two digits at end"],
    tags: ["anchors", "groups", "quantifiers"],
  },
  {
    id: "email-basic",
    name: "Basic email",
    description: "Simple email validation (not RFC compliant)",
    pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
    flags: "",
    text: `test@example.com
a@b.co
bad@@example.com
no-domain@
space @example.com`,
    notes: ["Simple validation", "Not full RFC 5322"],
    tags: ["validation", "email"],
  },
  {
    id: "us-phone",
    name: "US phone number",
    description: "Match various US phone number formats",
    pattern: "^(?:\\+1[-. ]?)?(?:\\(?\\d{3}\\)?[-. ]?)?\\d{3}[-. ]?\\d{4}$",
    flags: "",
    text: `(512) 555-1212
512-555-1212
+1 512 555 1212
5125551212
12-555-1212`,
    notes: ["Flexible separators", "Optional country code"],
    tags: ["validation", "phone"],
  },
  {
    id: "iso-date",
    name: "ISO date (YYYY-MM-DD)",
    description: "Match ISO 8601 date format",
    pattern: "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$",
    flags: "",
    text: `2026-01-05
2026-13-01
2026-00-10
2026-02-30
1999-12-31`,
    notes: ["Validates month range", "Validates day range (not month-aware)"],
    tags: ["validation", "date"],
  },
  {
    id: "quoted-strings",
    name: "Quoted strings",
    description: "Extract double-quoted strings with escape handling",
    pattern: '"([^"\\\\]*(\\\\.[^"\\\\]*)*)"',
    flags: "g",
    text: `He said "hello" then "world".
"escaped quote: \\" ok"
not quoted here`,
    notes: ["Handles escaped quotes", "Shows capture groups"],
    tags: ["extraction", "groups"],
  },
  {
    id: "url-http",
    name: "URL (http/https)",
    description: "Match HTTP and HTTPS URLs",
    pattern: "^https?:\\/\\/[^\\s/$.?#].[^\\s]*$",
    flags: "",
    text: `https://example.com
http://example.com/path?q=1
ftp://example.com
https://`,
    notes: ["HTTP or HTTPS only", "Basic URL structure"],
    tags: ["validation", "url"],
  },
  {
    id: "todo-comments",
    name: "TODO comments",
    description: "Find TODO comments in code",
    pattern: "^\\s*\\/\\/\\s*TODO:.*$",
    flags: "gm",
    text: `// TODO: refactor this
//TODO: fix bug
  // TODO: add tests
/* TODO: not this style */`,
    notes: ["Matches // style comments", "Multiline mode"],
    tags: ["code", "extraction"],
  },
  {
    id: "extra-spaces",
    name: "Multiple spaces",
    description: "Find multiple consecutive spaces or tabs",
    pattern: "[ \\t]{2,}",
    flags: "g",
    text: `This  line    has   extra spaces.
Tabs\t\talso\tcount.`,
    notes: ["For text cleanup", "Matches 2+ spaces/tabs"],
    tags: ["cleanup", "whitespace"],
  },
  {
    id: "markdown-headings",
    name: "Markdown headings",
    description: "Match Markdown heading syntax",
    pattern: "^(#{1,6})\\s+(.+)$",
    flags: "gm",
    text: `# Title
## Subtitle
#### Deep
Not a heading
###### Smallest
####### Too many`,
    notes: ["Captures level and text", "1-6 hashes only"],
    tags: ["markdown", "extraction"],
  },
  {
    id: "word-boundaries",
    name: "Words with boundaries",
    description: "Capture whole words using word boundaries",
    pattern: "\\b([A-Za-z]+)\\b",
    flags: "g",
    text: `Hello, world! 123 test_case.`,
    notes: ["Shows \\b word boundary", "Captures alphabetic words only"],
    tags: ["boundaries", "groups"],
  },
  {
    id: "password-policy",
    name: "Password policy",
    description: "Password with uppercase, lowercase, digit",
    pattern: "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)[A-Za-z\\d]{8,}$",
    flags: "",
    text: `Password1
password1
PASSWORD1
Pass1
Pass_word1`,
    notes: ["Shows lookaheads", "Min 8 chars, mixed case + digit"],
    tags: ["validation", "lookahead"],
  },
  {
    id: "named-groups",
    name: "Named capture groups",
    description: "Phone number with named groups",
    pattern: "^(?<area>\\d{3})-(?<prefix>\\d{3})-(?<line>\\d{4})$",
    flags: "",
    text: `512-555-1212
512-55-1212`,
    notes: ["Named groups: area, prefix, line", "ES2018+ feature"],
    tags: ["groups", "phone"],
  },
  {
    id: "key-value",
    name: "Key=value pairs",
    description: "Extract key=value pairs from text",
    pattern: "\\b([A-Za-z_]\\w*)=(\"[^\"]*\"|\\S+)",
    flags: "g",
    text: `user=prince role=admin active=true note="hello world"
bad-key==oops`,
    notes: ["Handles quoted values", "Key must start with letter/_"],
    tags: ["extraction", "config"],
  },
  {
    id: "html-tag",
    name: "HTML tags (simple)",
    description: "Match simple HTML tags with content",
    pattern: "<([A-Za-z][A-Za-z0-9]*)\\b[^>]*>(.*?)<\\/\\1>",
    flags: "gs",
    text: `<div class="a">Hello <span>world</span></div>
<p>One</p><p>Two</p>`,
    notes: ["Shows backreferences", "Use dotAll for newlines", "Not for real HTML parsing!"],
    tags: ["html", "backreference"],
  },
  {
    id: "danger-demo",
    name: "Danger: Nested quantifiers",
    description: "Demonstrates catastrophic backtracking risk",
    pattern: "^(a+)+$",
    flags: "",
    text: `aaaaaaaaaaaaaaaaaaaa
aaaaaaaaaaaaaaaaaaab`,
    notes: [
      "WARNING: This pattern can hang on non-matching input!",
      "The second line may take very long to process",
      "Demonstrates nested quantifier danger",
    ],
    tags: ["danger", "performance"],
  },
];

export function getTemplateById(id: string): RegexTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByTag(tag: string): RegexTemplate[] {
  return TEMPLATES.filter((t) => t.tags?.includes(tag));
}
