---
name: RegexLens
description: Understand, review, and safely modify regular expressions.
colors:
  lens-blue: "#3b82f6"
  midnight-ink: "#080a0f"
  soft-cloud: "#f7f9fc"
  deep-slate: "#0f1218"
  quiet-slate: "#212530"
  worn-silver: "#95a1b3"
  cool-ash: "#272b34"
  signal-red: "#cd3131"
  accent-rose: "#e23670"
  clarity-green: "#22c55e"
  warm-amber: "#f97316"
  focus-purple: "#a855f7"
  stream-cyan: "#17b8d9"
  info-blue: "#4078d4"
  caution-amber: "#f59e0b"
  danger-red: "#dc2626"
typography:
  display:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.05em"
  mono:
    fontFamily: "JetBrains Mono, SF Mono, Fira Code, Cascadia Code, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "112px"
components:
  button-primary:
    backgroundColor: "{colors.lens-blue}"
    textColor: "{colors.soft-cloud}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.lens-blue}"
  button-outline:
    backgroundColor: "{colors.midnight-ink}"
    textColor: "{colors.soft-cloud}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.soft-cloud}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-destructive:
    backgroundColor: "{colors.signal-red}"
    textColor: "{colors.soft-cloud}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
---

# Design System: RegexLens

## 1. Overview

**Creative North Star: "The Friendly Desk Lamp"**

RegexLens's visual system behaves like a warm desk lamp pointed at a specific thing. It illuminates the work without flooding the room. Surfaces are dark and quiet; the blue primary and match highlight colors draw attention only where understanding happens. There is no ambient glow, no decorative light. Every bright pixel is functional.

The system is built for developers who arrive curious, sometimes under pressure, and need to understand a regex pattern quickly. The interface should feel like a sharp colleague at the desk beside you: helpful without being loud, precise without being cold. It respects the user's time and never decorates for its own sake.

This system explicitly rejects: gradient color treatments of any kind (no purple-to-blue, no aurora blobs, no gradient text); Inter and other generic SaaS typefaces; AI-aesthetic slop (glowing orbs, particle fields, glassmorphism cards); dark-corporate SaaS templates with hero metrics; and walls of identical feature cards. If someone could look at a screen and say "AI made that," the design has failed.

**Key Characteristics:**
- Dark, warm, and quiet backgrounds; bright functional color only where understanding happens
- Typography-driven hierarchy; no decorative effects carrying weight
- Compact UI density appropriate for a workbench tool
- A 6-color match palette that must remain distinguishable for color vision deficiencies
- Solid colors only; gradients are prohibited across all surfaces

## 2. Colors

A restrained palette: tinted dark neutrals and one primary accent used sparingly. The blue is functional, not decorative. It marks interactive elements, active states, and the primary match highlight. Every other color serves a specific communication role (warnings, match groups, errors). No color exists for atmosphere.

### Primary
- **Lens Blue** (#3b82f6): The only saturated color in the neutral UI. Used for interactive elements, focus rings, primary actions, and the first match highlight group. Appears on less than 10% of any given surface.

### Neutral
- **Midnight Ink** (#080a0f): The ground. Main background for all surfaces. Tinted slightly toward blue (hue 220) rather than pure black.
- **Deep Slate** (#0f1218): Card and popover surfaces. One step above the ground, separated by border, not shadow.
- **Quiet Slate** (#212530): Secondary backgrounds, muted fills, inactive states.
- **Cool Ash** (#272b34): Borders, input outlines, dividers. The structural skeleton.
- **Worn Silver** (#95a1b3): Secondary text, labels, placeholders. Readable but recessive.
- **Soft Cloud** (#f7f9fc): Primary text. Warm off-white, never pure #fff.

### Functional
- **Signal Red** (#cd3131): Destructive actions and error states.
- **Accent Rose** (#e23670): Section labels and accent badges. The warmest neutral-adjacent color.
- **Info Blue** (#4078d4): Informational warnings. Slightly muted from Lens Blue.
- **Caution Amber** (#f59e0b): Performance and style warnings.
- **Danger Red** (#dc2626): Critical safety warnings (catastrophic backtracking, correctness failures).

### Match Palette
Six colors assigned to capture groups, chosen for maximum distinguishability including under deuteranopia and protanopia. Order is fixed.

1. **Lens Blue** (#3b82f6): Group 0 / full match
2. **Clarity Green** (#22c55e): Group 1
3. **Warm Amber** (#f97316): Group 2
4. **Focus Purple** (#a855f7): Group 3
5. **Stream Cyan** (#17b8d9): Group 4
6. **Accent Rose** (#e23670): Group 5

Match highlights use three opacity states: passive (30%), active (50%), and selected (40% with a 2px outline at 70%).

### Named Rules
**The Desk Lamp Rule.** Lens Blue is the only saturated color allowed in the base UI. It appears on interactive elements and active states. If you are reaching for a second accent color outside the match palette or warning system, stop. The restraint is the identity.

## 3. Typography

**Display Font:** Sora (with system-ui fallback)
**Body Font:** Plus Jakarta Sans (with system-ui fallback)
**Code Font:** JetBrains Mono (with SF Mono, Fira Code, Cascadia Code fallbacks)

**Character:** The pairing is warm-geometric. Sora's round letterforms and even stroke width give headings a friendly confidence without being playful. Plus Jakarta Sans carries the same warmth into body text with better readability at small sizes. JetBrains Mono is chosen for its clear glyph disambiguation in regex patterns (distinct 0/O, 1/l/I, brackets, escaped characters). All three share a geometric DNA that unifies the system.

Font features: `rlig 1, calt 1` (contextual alternates and ligatures). Antialiased rendering on all platforms.

### Hierarchy
- **Display** (700, clamp(2.25rem, 5vw, 4.5rem), line-height 1.1): Landing page hero headings only. Sora. Tight tracking (-0.02em).
- **Headline** (700, clamp(1.5rem, 3vw, 2.25rem), line-height 1.2): Section headings on the landing page, modal titles, onboarding headers. Sora.
- **Title** (600, 1.125rem, line-height 1.4): Panel headers, card titles, feature names. Plus Jakarta Sans.
- **Body** (400, 0.875rem, line-height 1.6): All running text, descriptions, explanations. Plus Jakarta Sans. Maximum line length: 65ch.
- **Label** (500, 0.75rem, line-height 1.4, tracking 0.05em): Section labels, badges, metadata, uppercase markers. Plus Jakarta Sans.
- **Mono** (400, 0.875rem, line-height 1.6): Regex patterns, code snippets, AST node labels, the editor. JetBrains Mono.

### Named Rules
**The 14px Floor Rule.** Body text is 14px (0.875rem). Nothing in the workbench goes smaller except labels and badges (12px). Regex patterns must be readable at a glance; squinting defeats the product's purpose.

## 4. Elevation

The system is currently flat by default. Depth is conveyed through border tinting and background-step layering (Midnight Ink → Deep Slate → Quiet Slate), not through shadows. This is intentional for the workbench, where dense panels sit side by side and drop shadows would create visual noise.

Shadows exist only on two elements: primary buttons (`shadow` / Tailwind default) and secondary buttons (`shadow-sm`). These are structural, marking clickable affordances against flat surfaces.

The elevation system is evolving. Future additions should follow the Flat-By-Default Rule and add shadow vocabulary gradually: ambient hover shadows on cards, then elevation for popovers and dropdowns, then focused-element lift. Each addition should be justified by interaction need, not decoration.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Borders, not shadows, separate panels. If a shadow appears, it marks an interactive state change (hover, focus, popover opening), never a static decorative layer. If it looks like a 2015 Material card with a permanent drop shadow, rethink.

## 5. Components

### Buttons
Warm and compact. Buttons are the primary interactive affordance and the most visible use of Lens Blue.

- **Shape:** Gently rounded (6px radius, `rounded-md`). Not pill-shaped, not sharp-cornered.
- **Primary:** Lens Blue background, Soft Cloud text. Height 36px, padding 8px 16px. Subtle shadow. Hover: 90% opacity.
- **Outline:** Midnight Ink background with Cool Ash border. Same dimensions. Hover: accent background tint.
- **Ghost:** Transparent background. Hover: accent background tint.
- **Destructive:** Signal Red background. Same shape and dimensions.
- **Link:** No background, underline on hover. Lens Blue text.
- **Sizes:** Default 36px, Small 32px (12px text, 12px padding), Large 40px (32px padding), Icon 36x36px, Icon-small 28x28px.
- **Focus:** 1px ring in Lens Blue with 2px offset. Always visible on keyboard navigation.

### Badges
Two variant families: match badges and warning badges.

- **Match badges:** Background at 20% opacity of the match color, text at full match color. Used to label capture groups.
- **Warning badges:** Background at 20% opacity of the severity color, text at full severity color. Three levels: info (blue), warn (amber), danger (red).

### Cards / Containers
- **Corner Style:** 8px radius (`rounded-lg`).
- **Background:** Deep Slate (#0f1218). One step above the page background.
- **Border:** 1px Cool Ash at reduced opacity (border-border/40 is common). Never heavier than 1px.
- **Internal Padding:** 16-24px depending on content density.
- **No permanent shadows.** Cards are flat. The border alone provides separation.

### Inputs / Fields
- **Style:** Cool Ash border, Midnight Ink background, 6px radius.
- **Focus:** Border shifts to Lens Blue. 1px ring.
- **Code inputs (Monaco editor):** JetBrains Mono, 14px minimum. No border radius on the editor surface itself.

### Navigation (App Header)
- **Height:** 48-56px.
- **Style:** Midnight Ink background with Cool Ash bottom border.
- **Items:** Body weight (400), Worn Silver default, Soft Cloud on hover. No underlines, no active indicators beyond color shift.
- **Mobile:** Dropdown menu via Radix, same typography and color rules.

### Match Highlights (Signature Component)
The most distinctive visual element in the product. Colored inline highlights in the test text editor, synchronized with the explanation panel and AST tree.

- **Rendering:** Inline background color on matched text spans. Color from the 6-color match palette, assigned by capture group index.
- **Three states:** Passive (30% opacity background), Active (50% opacity on hover/cross-panel sync), Selected (40% background + 2px outline at 70% opacity).
- **Cross-panel synchronization:** Hovering a match in the test text highlights the corresponding explanation step and AST node. Same color, same opacity shift.

## 6. Do's and Don'ts

### Do:
- **Do** use Lens Blue as the single accent color in the base UI. Its rarity is the identity.
- **Do** maintain the 6-color match palette order. Group 0 is always Lens Blue, Group 1 is always Clarity Green.
- **Do** use borders (1px, Cool Ash) to separate surfaces. Borders are the structural language, not shadows.
- **Do** keep body text at 14px minimum. Regex patterns and explanations must be readable without effort.
- **Do** respect `prefers-reduced-motion`. Disable auto-playing animations. The typing animation in the hero must stop.
- **Do** provide 44px minimum touch targets on mobile for all interactive elements.
- **Do** use Sora for display/headline text and Plus Jakarta Sans for body/title/label text. The warmth of this pairing is intentional.
- **Do** keep line lengths under 65ch for explanation text. Regex explanations are dense; narrow columns aid scanning.

### Don't:
- **Don't** use gradient color treatments. No gradient backgrounds, no gradient text (`background-clip: text` with gradients is prohibited), no aurora blobs, no gradient borders. Solid colors only, everywhere.
- **Don't** use Inter or other generic SaaS typefaces. Plus Jakarta Sans and Sora are deliberate departures from the monoculture.
- **Don't** use glassmorphism (backdrop-blur + translucent backgrounds) as a default surface treatment. If blur appears, it must serve a specific functional purpose (e.g., a sticky header ensuring readability), not decoration.
- **Don't** use glowing orbs, particle fields, sparkle decorations, or any AI-aesthetic visual effects. If it looks like a 2024 AI product marketing page, it has failed.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored accent stripe on any element. Rewrite with full borders, background tints, or nothing.
- **Don't** create identical card grids (same-sized cards with icon + heading + text repeated). Vary the layout: different sizes, definition lists, inline items.
- **Don't** use dark-corporate SaaS templates with hero metrics (big number, small label, gradient accent). RegexLens is a tool, not a dashboard pitch.
- **Don't** use `#000000` or `#ffffff`. Every neutral is tinted toward hue 220 (the Midnight Ink family). Pure black and white look alien in this system.
- **Don't** add shadows to static surfaces. Shadows mark state changes only (hover, focus, elevation). A card at rest is flat.
- **Don't** use em dashes in UI copy. Use commas, colons, semicolons, or periods.
