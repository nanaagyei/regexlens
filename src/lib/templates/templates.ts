import { RegexTemplate, TemplateCategory, TemplateCategoryId } from "@/types";

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { id: "validation", label: "Validation" },
  { id: "extraction", label: "Extraction" },
  { id: "code", label: "Code & Markup" },
  { id: "advanced", label: "Advanced" },
  { id: "learning", label: "Learning" },
];

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
    category: "learning",
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
    category: "validation",
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
    category: "validation",
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
    category: "validation",
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
    category: "extraction",
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
    category: "validation",
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
    category: "code",
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
    category: "extraction",
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
    category: "extraction",
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
    category: "learning",
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
    category: "validation",
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
    category: "advanced",
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
    category: "extraction",
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
    category: "code",
    notes: ["Shows backreferences", "Use dotAll for newlines", "Not for real HTML parsing!"],
    tags: ["html", "backreference"],
  },
  {
    id: "danger-demo",
    name: "Danger: Catastrophic backtracking",
    description:
      "Explains catastrophic backtracking (classic (a+)+$) — this example uses a safe pattern",
    pattern: "^(a+)b$",
    flags: "",
    text: `aaab
aaaX`,
    category: "advanced",
    notes: [
      "Patterns like (a+)+$ cause exponential backtracking on non-matching input",
      "This template uses ^(a+)b$ instead — matching is linear, but illustrates nested + groups",
      "In production, prefer possessive/atomic groups (where supported) or rewrites that avoid nested greed",
    ],
    tags: ["danger", "performance", "stress-test"],
  },
  {
    id: "brutal-email",
    name: "Brutal email validator",
    description: "RFC-style email validation with length checks",
    pattern:
      "^(?=.{1,254}$)(?=.{1,64}@)[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.)+[A-Za-z]{2,}$",
    flags: "",
    text: `test@example.com
first.last@sub.domain.com
user+tag@domain.co
a_b-c.d+e@long-domain-name.org
user123@school.edu
plainaddress
@no-local-part.com
user@.com
user@domain
user..double@dot.com
user@domain..com
user@-domain.com
user@domain-.com
a@b.co
verylonglocalpartaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@example.com
user_name@sub.sub.sub.domain.com`,
    category: "validation",
    notes: [
      "Should match: valid emails (top block)",
      "Should NOT match: plainaddress, @no-local-part.com, etc.",
      "Edge: a@b.co, very long local part, multiple subdomains",
    ],
    tags: ["validation", "email", "stress-test"],
  },
  {
    id: "ipv6-validator",
    name: "IPv6 validator",
    description: "Comprehensive IPv6 address validation",
    pattern:
      "^((?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}|(?:[0-9A-Fa-f]{1,4}:){1,7}:|(?:[0-9A-Fa-f]{1,4}:){1,6}:[0-9A-Fa-f]{1,4}|(?:[0-9A-Fa-f]{1,4}:){1,5}(?::[0-9A-Fa-f]{1,4}){1,2}|(?:[0-9A-Fa-f]{1,4}:){1,4}(?::[0-9A-Fa-f]{1,4}){1,3}|(?:[0-9A-Fa-f]{1,3}:){1,3}(?::[0-9A-Fa-f]{1,4}){1,4}|(?:[0-9A-Fa-f]{1,2}:){1,2}(?::[0-9A-Fa-f]{1,4}){1,5}|[0-9A-Fa-f]{1,4}:(?:(?::[0-9A-Fa-f]{1,4}){1,6})|:(?:(?::[0-9A-Fa-f]{1,4}){1,7}|:))$",
    flags: "",
    text: `2001:0db8:85a3:0000:0000:8a2e:0370:7334
2001:db8:85a3::8a2e:370:7334
::1
::
fe80::1ff:fe23:4567:890a
2001:db8::
2001:::7334
2001:db8:85a3::8a2e::7334
12345::abcd
2001:db8:85a3:8a2e:370:7334
2001:dg8::1
0:0:0:0:0:0:0:1`,
    category: "validation",
    notes: [
      "Should match: full, compressed, ::1, ::, link-local",
      "Should NOT match: triple colon, double ::, invalid hex, too few groups",
      "Edge: 0:0:0:0:0:0:0:1 (long form of ::1)",
    ],
    tags: ["validation", "ipv6", "stress-test"],
  },
  {
    id: "pcre-recursion-unsupported",
    name: "PCRE recursion (unsupported)",
    description: "Recursive HTML tag matcher — JavaScript cannot run this",
    pattern:
      "<([A-Za-z][A-Za-z0-9:-]*)\\b[^>]*>(?:(?:(?!</\\1>).)*|(?R))*</\\1>",
    flags: "",
    text: `<div>Hello</div>
<div><span>Nested</span></div>`,
    category: "advanced",
    notes: [
      "Uses (?R) — PCRE recursion. JavaScript does not support this.",
      "Expected: parse error with helpful message about PCRE limitation",
      "Use a PCRE-compatible tool (PHP, Perl, PCRE2) for recursive patterns",
    ],
    tags: ["html", "stress-test", "unsupported"],
  },
];

export function getTemplateById(id: string): RegexTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByTag(tag: string): RegexTemplate[] {
  return TEMPLATES.filter((t) => t.tags?.includes(tag));
}

export function getTemplatesByCategory(
  category: TemplateCategoryId
): RegexTemplate[] {
  return TEMPLATES.filter((t) => t.category === category);
}

/**
 * Search templates by query string. Matches against name, description, and tags.
 * Case-insensitive, returns all templates if query is empty.
 */
export function searchTemplates(query: string): RegexTemplate[] {
  const q = query.trim().toLowerCase();
  if (!q) return TEMPLATES;

  return TEMPLATES.filter((t) => {
    const haystack = [
      t.name,
      t.description,
      ...(t.tags ?? []),
      t.category,
    ]
      .join(" ")
      .toLowerCase();
    return q.split(/\s+/).every((word) => haystack.includes(word));
  });
}
