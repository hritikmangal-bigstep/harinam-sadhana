# Harinam Sadhana — Design System

> A sacred space for ISKCON devotees to offer their chanting sessions. The design should feel like entering a temple — warm, reverent, calming, and beautiful. Not clinical, not corporate.

---

## 1. Design Philosophy

| Principle | Description |
|-----------|-------------|
| **Reverence** | Every screen should feel like an offering, not a form submission |
| **Warmth** | Saffron, gold, and cream tones evoke the colors of a temple at dawn |
| **Simplicity** | Devotees should focus on their sadhana, not navigate complexity |
| **Organic Flow** | Soft curves, lotus motifs, and fluid transitions — nothing sharp or abrupt |
| **Trust** | Clean spacing and honest feedback signals make devotees feel safe sharing |

---

## 2. Color Palette

### Primary Palette — Saffron & Gold

| Role | Name | Hex | CSS Variable | Usage |
|------|------|-----|--------------|-------|
| Primary | Saffron | `#E8680A` | `--color-primary` | CTAs, active states, key highlights |
| Primary Dark | Deep Saffron | `#C4530A` | `--color-primary-dark` | Hover states, pressed buttons |
| Primary Light | Pale Saffron | `#FDE8D0` | `--color-primary-light` | Backgrounds, input fills |
| Secondary | Temple Gold | `#D4A017` | `--color-secondary` | Decorative accents, borders, icons |
| Secondary Light | Soft Gold | `#FBF0C0` | `--color-secondary-light` | Card backgrounds, section dividers |
| Accent | Lotus Pink | `#C2587A` | `--color-accent` | Subtle highlights, badges |

### Neutral Palette — Cream & Earth

| Role | Name | Hex | CSS Variable | Usage |
|------|------|-----|--------------|-------|
| Background | Sacred Cream | `#FFFDF5` | `--color-background` | Page background |
| Surface | Warm White | `#FFF8EE` | `--color-surface` | Cards, panels |
| Surface Alt | Sandalwood | `#F5EDD8` | `--color-surface-alt` | Section backgrounds |
| Border | Turmeric Mist | `#E8D5A3` | `--color-border` | Card borders, dividers |
| Muted | Ashram Grey | `#8B7355` | `--color-muted` | Secondary text, placeholders |
| Foreground | Deep Teak | `#3D2B1F` | `--color-foreground` | Primary body text |
| Heading | Tilak Brown | `#5C3317` | `--color-heading` | All heading text |

### Semantic Palette

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Success | `#2E7D32` | `--color-success` | Upload complete, form saved |
| Error | `#C62828` | `--color-error` | Validation errors |
| Warning | `#F57F17` | `--color-warning` | File size caution |
| Info | `#1565C0` | `--color-info` | Tips, helper messages |

### CSS Token Declaration

```css
:root {
  /* Primary */
  --color-primary: #E8680A;
  --color-primary-dark: #C4530A;
  --color-primary-light: #FDE8D0;

  /* Secondary */
  --color-secondary: #D4A017;
  --color-secondary-light: #FBF0C0;

  /* Accent */
  --color-accent: #C2587A;

  /* Neutrals */
  --color-background: #FFFDF5;
  --color-surface: #FFF8EE;
  --color-surface-alt: #F5EDD8;
  --color-border: #E8D5A3;
  --color-muted: #8B7355;
  --color-foreground: #3D2B1F;
  --color-heading: #5C3317;

  /* Semantic */
  --color-success: #2E7D32;
  --color-error: #C62828;
  --color-warning: #F57F17;
  --color-info: #1565C0;
}
```

---

## 3. Typography

### Font Stack

| Role | Font | Weights | Import |
|------|------|---------|--------|
| **Heading** | Lora | 400, 500, 600, 700 | Google Fonts |
| **Body** | Raleway | 300, 400, 500, 600 | Google Fonts |
| **Mantra / Sanskrit** | Noto Serif Devanagari | 400, 500 | Google Fonts |

```css
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Raleway:wght@300;400;500;600&family=Noto+Serif+Devanagari:wght@400;500&display=swap');

:root {
  --font-heading: 'Lora', Georgia, serif;
  --font-body: 'Raleway', system-ui, sans-serif;
  --font-mantra: 'Noto Serif Devanagari', serif;
}
```

> **Why Lora + Raleway:** Lora's calligraphic serifs echo the beauty of Sanskrit manuscripts. Raleway's elegant geometry feels devotional without being heavy.

### Type Scale

| Name | Size | Line Height | Weight | Font | Usage |
|------|------|-------------|--------|------|-------|
| `display` | 48px / 3rem | 1.15 | 700 | Lora | Hero headline |
| `h1` | 36px / 2.25rem | 1.2 | 600 | Lora | Page titles |
| `h2` | 28px / 1.75rem | 1.25 | 600 | Lora | Section headings |
| `h3` | 22px / 1.375rem | 1.35 | 500 | Lora | Card titles |
| `h4` | 18px / 1.125rem | 1.4 | 500 | Lora | Sub-sections |
| `body-lg` | 18px / 1.125rem | 1.7 | 400 | Raleway | Intro text |
| `body` | 16px / 1rem | 1.6 | 400 | Raleway | Default body |
| `body-sm` | 14px / 0.875rem | 1.55 | 400 | Raleway | Helper text, labels |
| `caption` | 12px / 0.75rem | 1.5 | 400 | Raleway | Timestamps, fine print |
| `mantra` | 20px / 1.25rem | 1.8 | 400 | Noto Serif Devanagari | Sanskrit text display |

---

## 4. Spacing System

Uses an 8px base grid. All spacing values are multiples of 4.

```
4px   (space-1)  — tight gaps, icon padding
8px   (space-2)  — component internal padding
12px  (space-3)  — small gaps between elements
16px  (space-4)  — default section padding (mobile)
24px  (space-6)  — card padding, between form fields
32px  (space-8)  — between sections (mobile)
48px  (space-12) — between sections (desktop)
64px  (space-16) — major section breaks
96px  (space-24) — hero padding
```

---

## 5. Visual Style — Biomimetic Devotional

The overall aesthetic is **Biomimetic Devotional**: nature-inspired curves and organic shapes rooted in temple iconography.

### Shape Language

- **Border radius:** `8px` for inputs, `12px` for cards, `24px` for large panels, `9999px` for pills/badges
- **No hard right angles** on decorative elements — use soft curves everywhere
- **Lotus petal motifs** as SVG decorations in hero sections and section dividers
- **Mandala-inspired** circular patterns for loading states and empty states

### Shadows

```css
--shadow-sm:  0 1px 4px rgba(61, 43, 31, 0.08);
--shadow-md:  0 4px 16px rgba(61, 43, 31, 0.10);
--shadow-lg:  0 8px 32px rgba(61, 43, 31, 0.12);
--shadow-glow: 0 0 24px rgba(232, 104, 10, 0.18); /* saffron glow for active states */
```

### Decorative Motifs (SVG)

- **Lotus flower** — used as dividers and hero background watermark (opacity 0.06)
- **Om symbol** — page favicon, loading spinner center
- **Paisley curves** — card corner accents
- **Tulsi leaf pattern** — subtle background texture on `--color-surface-alt` sections
- **Conch shell** — section break icon

All motifs use `--color-secondary` (Temple Gold) at low opacity for background use, full opacity for foreground accents.

---

## 6. Layout & Responsive Breakpoints

```
xs:  375px  — small phones (primary design target)
sm:  430px  — large phones
md:  768px  — tablets
lg:  1024px — small desktops
xl:  1280px — desktops
2xl: 1440px — wide screens
```

### Page Max Width

```css
--container-max: 1200px;
--content-max: 720px;   /* form and reading content */
--hero-max: 960px;
```

### Layout Grid

- Mobile: 1 column, 16px gutters
- Tablet: 2 columns, 24px gutters
- Desktop: 12-column grid, 24px gutters

---

## 7. Component Specifications

### 7.1 Navigation Bar

- **Height:** 64px desktop / 56px mobile
- **Background:** `--color-surface` with `backdrop-filter: blur(12px)` + 90% opacity
- **Border bottom:** 1px solid `--color-border`
- **Logo:** Om symbol (SVG) + "Harinam Sadhana" in Lora 600
- **Sticky:** yes, with subtle shadow on scroll
- **Mobile:** hamburger menu, full-screen drawer with saffron gradient overlay

### 7.2 Hero Section

- **Background:** Radial gradient from `--color-primary-light` (center) to `--color-background`
- **Lotus watermark:** Full-width SVG lotus at 6% opacity, centered
- **Heading:** Display size, Lora, `--color-heading`
- **Subheading:** Body-lg, Raleway, `--color-muted`
- **CTA button:** See §7.7
- **Height:** min-h-[80vh] on desktop, auto on mobile
- **Sanskrit verse:** Small mantra text in Noto Serif Devanagari above the main headline (e.g. "हरे कृष्ण हरे कृष्ण")

### 7.3 Cards

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 200ms ease-out, transform 200ms ease-out;
}
.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

- **Feature cards:** Gold left border accent (4px, `--color-secondary`)
- **Session cards:** Show devotee name, date, rounds count, duration chip

### 7.4 Form Fields

```
Input height:     48px (meets 44pt touch target)
Border:           1.5px solid --color-border
Border (focus):   1.5px solid --color-primary + box-shadow: 0 0 0 3px --color-primary-light
Border (error):   1.5px solid --color-error
Border radius:    8px
Background:       --color-surface
Padding:          12px 16px
Label:            body-sm, Raleway 500, --color-heading, visible above input
Helper text:      caption, --color-muted, below input
Error text:       caption, --color-error, below input with error icon
```

- Labels are always visible — never placeholder-only
- Required fields marked with `*` in `--color-primary`
- Focus ring uses saffron glow shadow for brand consistency

### 7.5 Audio Recorder (WhatsApp-style)

This is the centerpiece component. Design it to feel like a sacred offering.

**Idle State:**
- Large circular button (72px diameter)
- Background: radial gradient `--color-primary` → `--color-primary-dark`
- Icon: microphone SVG in white, 24px
- Shadow: `--shadow-glow`
- Label below: "Hold to record" in body-sm, `--color-muted`

**Recording State:**
- Button pulses: scale 1.0 → 1.08 → 1.0, 1.2s ease-in-out loop (breathing animation)
- Background shifts to `--color-error` red
- Waveform visualizer: animated bars in saffron color beside the button
- Timer: counting up in `--font-body` monospace
- Slide-left zone: shows "< Slide to cancel" with arrow, fades in after 500ms

**Completed State:**
- Audio waveform preview (static visualization in `--color-secondary`)
- Playback button (play/pause)
- Duration chip
- Re-record button (ghost style)
- Delete button (destructive, icon only with label)

**Interaction rules:**
- Press and hold to record (no click — prevents accidental recording)
- Swipe left ≥80px while holding → cancel with haptic feedback
- Release → stop recording and show completed state
- Min recording: 3 seconds (show gentle shake + tooltip if released too early)
- Max recording: 30 minutes

### 7.6 Progress / Upload Indicator

- Circular progress ring around the recorder button during upload
- Ring color: `--color-primary`
- Center shows percentage
- On complete: ring fills gold (`--color-secondary`) + checkmark + "Offered" text

### 7.7 Buttons

**Primary Button (CTA)**
```css
.btn-primary {
  background: var(--color-primary);
  color: #FFFFFF;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 16px;
  height: 48px;
  padding: 0 28px;
  border-radius: 9999px;  /* pill shape */
  border: none;
  box-shadow: 0 2px 12px rgba(232, 104, 10, 0.30);
  transition: background 150ms, box-shadow 150ms, transform 100ms;
}
.btn-primary:hover {
  background: var(--color-primary-dark);
  box-shadow: 0 4px 20px rgba(232, 104, 10, 0.40);
}
.btn-primary:active {
  transform: scale(0.97);
}
```

**Secondary Button (Ghost)**
```css
.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 1.5px solid var(--color-primary);
  border-radius: 9999px;
  height: 48px;
  padding: 0 28px;
  font-weight: 500;
  transition: background 150ms;
}
.btn-secondary:hover {
  background: var(--color-primary-light);
}
```

**Icon Button**
- 44×44px minimum hit area
- Background: transparent or `--color-surface-alt`
- Border radius: 50% (circular) or 8px (square)

### 7.8 Form Submission Page

Sections in order:
1. **Personal Details** — Name, Location (city/country), Temple/Centre affiliation
2. **Session Details** — Date, Number of rounds, Session type (Japa / Kirtan / Both)
3. **Audio Recording** — WhatsApp-style recorder (centerpiece)
4. **Notes** — Optional textarea ("Any reflections on today's session...")
5. **Submit** — Primary CTA: "Offer My Session"

### 7.9 Success State

After successful submission:
- Full-screen overlay with warm cream background
- Animated lotus flower blooming (SVG/CSS animation, 1.2s)
- Heading: "Hare Krishna!" in Lora display, `--color-heading`
- Subtext: "Your session has been offered. Jai Sri Krishna." in body-lg
- Secondary CTA: "Submit Another Session"
- Auto-dismiss to home after 8 seconds

---

## 8. Page Structure

### Landing / Home Page

```
┌─────────────────────────────────────┐
│  NAV BAR (logo + nav links)         │
├─────────────────────────────────────┤
│  HERO                               │
│  Sanskrit verse (small, gold)       │
│  "Offer Your Chanting Session"      │
│  Subheadline                        │
│  [Begin Offering] CTA               │
│  Lotus watermark (background)       │
├─────────────────────────────────────┤
│  ABOUT STRIP                        │
│  3 icon cards: Record / Reflect /   │
│  Grow — what the platform does      │
├─────────────────────────────────────┤
│  HOW IT WORKS                       │
│  3-step horizontal flow             │
│  Step icons use lotus/conch motifs  │
├─────────────────────────────────────┤
│  MANTRA SECTION                     │
│  Full-width saffron gradient bg     │
│  Large Maha Mantra in Devanagari    │
│  Translation below in Raleway       │
├─────────────────────────────────────┤
│  SUBMISSION FORM (or link to it)    │
├─────────────────────────────────────┤
│  FOOTER                             │
│  Om symbol + copyright              │
│  "Hare Krishna" in gold             │
└─────────────────────────────────────┘
```

### Submission Form Page

```
┌─────────────────────────────────────┐
│  NAV BAR                            │
├─────────────────────────────────────┤
│  PAGE HEADER                        │
│  "Your Daily Offering"              │
│  Today's date (auto-filled)         │
├─────────────────────────────────────┤
│  SECTION 1: Personal Details        │
│  Name · Location · Temple           │
├─────────────────────────────────────┤
│  SECTION 2: Session Details         │
│  Date · Rounds · Session Type       │
├─────────────────────────────────────┤
│  SECTION 3: Audio Recording         │
│  ┌───────────────────────────┐      │
│  │  🎙 Hold to Record        │      │
│  │  [Recorder Component]     │      │
│  └───────────────────────────┘      │
├─────────────────────────────────────┤
│  SECTION 4: Notes (optional)        │
│  Textarea with lotus icon           │
├─────────────────────────────────────┤
│  [Offer My Session] — primary CTA   │
└─────────────────────────────────────┘
```

---

## 9. Animation & Motion

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Page entry | Fade + slide up 16px | 300ms | ease-out |
| Card hover | translateY(-2px) | 200ms | ease-out |
| Button press | scale(0.97) | 100ms | ease-in |
| Recorder pulse (active) | scale 1.0→1.08→1.0 | 1200ms | ease-in-out, infinite |
| Waveform bars | height oscillation | 600ms | ease-in-out, staggered |
| Success lotus | SVG path draw + fade-in | 1200ms | ease-out |
| Section reveal | Intersection Observer, fade + slide up 24px | 400ms | ease-out |
| Upload ring | stroke-dashoffset progress | tied to upload % | linear |
| Toast | slide in from bottom | 250ms | ease-out |

All animations respect `prefers-reduced-motion`: reduce to simple fade at 150ms.

---

## 10. Iconography

- **Icon library:** Lucide Icons (stroke-based, consistent 1.5px stroke weight)
- **Spiritual icons:** Custom SVG set — Lotus, Om, Conch (Shankha), Tulsi, Lotus bud, Japa mala beads
- **Size scale:** 16px (inline) / 20px (list) / 24px (nav/feature) / 32px (section) / 48px (hero feature)
- **Color:** Match context — `--color-primary` for actions, `--color-secondary` for decorative, `--color-muted` for secondary

---

## 11. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Contrast ratio | All text ≥ 4.5:1 against background |
| Focus rings | 2px solid `--color-primary` + 2px offset |
| Touch targets | Min 44×44px for all interactive elements |
| Alt text | All decorative SVGs use `aria-hidden="true"` |
| Form labels | Visible label on every input, never placeholder-only |
| Error messages | `role="alert"` on error text, describes fix |
| Keyboard nav | Full Tab support, recorder accessible via Space key |
| Screen reader | `aria-live="polite"` on upload status |
| Reduced motion | All animations fall back to simple fade |

---

## 12. Tone & Microcopy

| Context | Copy Style | Example |
|---------|------------|---------|
| CTA button | Devotional offering language | "Offer My Session" not "Submit" |
| Success message | Joyful, spiritual | "Hare Krishna! Your offering has been received." |
| Error message | Gentle, clear | "This field is required to complete your offering." |
| Placeholder | Soft guidance | "Your name as used in your temple" |
| Helper text | Encouraging | "Each round is 108 names. Even one round counts." |
| Loading | Present tense | "Offering your session..." |
| Empty state | Inviting | "No sessions yet. Begin your first offering today." |
| Audio prompt | Sacred invitation | "Hold and speak your chanting into this space." |

---

## 13. Do Not

- Do not use cold blues, grays, or clinical whites — this is a temple, not a hospital
- Do not use generic stock icons like checkmarks for spiritual content — use lotus/om motifs
- Do not use dark mode by default — the warm cream palette IS the brand; dark mode is secondary
- Do not use Comic Sans, Roboto, or any tech-brand fonts — Lora + Raleway only
- Do not place the Om symbol purely decoratively on interactive elements (screen readers should hide it)
- Do not auto-start recording — always require deliberate press-and-hold intent
- Do not show a generic spinner on submission — use the lotus bloom animation
- Do not use the word "upload" in user-facing copy — use "offer" or "share"

---

## 14. Designer Elements

> **Philosophy:** Designer elements are layered in four tiers — (1) **Ambient** backgrounds and textures fill empty space so no area feels bare; (2) **Structural ornaments** frame and divide sections with sacred motifs; (3) **Interactive flourishes** reward attention and touch; (4) the **Sacred Centerpiece** (audio recorder) stands alone as the devotional focal point. Each tier should feel intentional, never noisy.

### Quick-Reference Map

| Category | Where on Site |
|----------|--------------|
| Ornamental dividers & motifs | Between every major section; card corners |
| Ambient texture & watermark | Full-page background layer |
| Gradient mesh & light pools | Hero, Mantra section, success overlay |
| Floating petals & particles | Hero, success state |
| Illuminated drop caps | Section intro paragraphs |
| Gold-foil headline treatment | Hero H1, Mantra section heading |
| Animated diya flame | Hero accent, footer |
| Maha Mantra marquee ribbon | Between hero and "About" strip |
| Recorder aura rings | Recorder component — recording state |
| Petal waveform visualizer | Recorder component — active recording |
| Lotus-bloom success animation | Full-screen success overlay |
| Mandala spinner | Loading / upload progress fallback |
| Palm-leaf scroll toast | Success / error notifications |
| Temple-arch footer | Footer top border |
| Seasonal / festival hooks | Janmashtami, Kartik, Gaura Purnima banners |

---

### 14.1 Ornamental Dividers & Motifs

#### Lotus Petal Section Divider

**Look:** A horizontal row of five lotus petals (SVG) centered on the section break line, flanked by thin hairlines extending to the container edges. Petals in `--color-secondary` at 60% opacity, hairlines in `--color-border`.

**Usage:** Between every `<section>` on the landing page and between form sections.

**Implementation:**
```svg
<!-- Lotus divider — place in a <div class="lotus-divider"> -->
<svg width="240" height="24" viewBox="0 0 240 24" aria-hidden="true">
  <!-- hairlines -->
  <line x1="0" y1="12" x2="90" y2="12" stroke="var(--color-border)" stroke-width="1"/>
  <line x1="150" y1="12" x2="240" y2="12" stroke="var(--color-border)" stroke-width="1"/>
  <!-- five petals -->
  <ellipse cx="100" cy="12" rx="5" ry="9" fill="var(--color-secondary)" opacity="0.5" transform="rotate(-20 100 12)"/>
  <ellipse cx="110" cy="12" rx="5" ry="9" fill="var(--color-secondary)" opacity="0.6" transform="rotate(-10 110 12)"/>
  <ellipse cx="120" cy="12" rx="5" ry="10" fill="var(--color-secondary)" opacity="0.7"/>
  <ellipse cx="130" cy="12" rx="5" ry="9" fill="var(--color-secondary)" opacity="0.6" transform="rotate(10 130 12)"/>
  <ellipse cx="140" cy="12" rx="5" ry="9" fill="var(--color-secondary)" opacity="0.5" transform="rotate(20 140 12)"/>
</svg>
```
```css
.lotus-divider { display: flex; align-items: center; justify-content: center; margin: 48px auto; }
```

**Motion:** On scroll-into-view, each petal fades in with a 60ms stagger (left→right), `opacity 0→1`, 300ms `ease-out`. Reduced-motion: instant appear, no stagger.

**A11y:** `aria-hidden="true"` — purely decorative.

---

#### Mandala Corner Ornament

**Look:** A quarter-circle mandala (concentric arcs + petal silhouettes) placed at the top-right and bottom-left corners of feature cards. Drawn in `--color-secondary` at 15% opacity.

**Usage:** Hero card, session detail cards, "How It Works" cards.

**Implementation:**
```css
.card-ornament {
  position: absolute;
  top: 0; right: 0;
  width: 80px; height: 80px;
  background: radial-gradient(circle at top right,
    rgba(212,160,23,0.12) 0%,
    transparent 70%);
  border-top-right-radius: 12px;
  pointer-events: none;
}
```
Overlay a small quarter-mandala SVG (`aria-hidden="true"`) with `position: absolute; top: 0; right: 0; opacity: 0.18`.

**Motion:** None — static decorative. No reduced-motion concern.

**A11y:** `aria-hidden="true"`, `pointer-events: none`.

---

#### Japa Mala Bead Divider

**Look:** A horizontal string of 10 small circles (beads) connected by a thin line, with one larger "meru" bead in the center. All in `--color-secondary`.

**Usage:** Inside the form between "Session Details" and "Audio Recording" sections.

**Implementation:**
```svg
<svg width="200" height="16" viewBox="0 0 200 16" aria-hidden="true">
  <line x1="10" y1="8" x2="190" y2="8" stroke="var(--color-border)" stroke-width="1.5"/>
  <!-- 10 beads, center one larger -->
  <!-- positions: 10,30,50,70,90,100(meru),110,130,150,170,190 -->
  <circle cx="10"  cy="8" r="4" fill="var(--color-secondary)" opacity="0.5"/>
  <circle cx="30"  cy="8" r="4" fill="var(--color-secondary)" opacity="0.5"/>
  <circle cx="50"  cy="8" r="4" fill="var(--color-secondary)" opacity="0.5"/>
  <circle cx="70"  cy="8" r="4" fill="var(--color-secondary)" opacity="0.5"/>
  <circle cx="90"  cy="8" r="4" fill="var(--color-secondary)" opacity="0.5"/>
  <circle cx="100" cy="8" r="6" fill="var(--color-secondary)" opacity="0.8"/> <!-- meru -->
  <circle cx="110" cy="8" r="4" fill="var(--color-secondary)" opacity="0.5"/>
  <circle cx="130" cy="8" r="4" fill="var(--color-secondary)" opacity="0.5"/>
  <circle cx="150" cy="8" r="4" fill="var(--color-secondary)" opacity="0.5"/>
  <circle cx="170" cy="8" r="4" fill="var(--color-secondary)" opacity="0.5"/>
  <circle cx="190" cy="8" r="4" fill="var(--color-secondary)" opacity="0.5"/>
</svg>
```

**Motion:** On scroll-reveal, beads animate from `scale(0)` to `scale(1)` with 40ms stagger from center outward. Reduced-motion: no animation.

**A11y:** `aria-hidden="true"`.

---

#### Temple Arch (Torana) Card Frame

**Look:** A decorative pointed arch SVG overlaying the top edge of hero cards or the page hero section — echoing the torana (gateway arch) of a Vaishnava temple. Rendered in `--color-secondary` at 20% opacity as a background decoration.

**Usage:** Top of hero section, top of submission form card.

**Implementation:**
```css
.torana-frame {
  position: relative;
  overflow: visible;
}
.torana-frame::before {
  content: '';
  position: absolute;
  top: -2px; left: 50%;
  transform: translateX(-50%);
  width: min(480px, 90%);
  height: 48px;
  background: url("data:image/svg+xml,...torana-arch-path...") center/contain no-repeat;
  opacity: 0.22;
  pointer-events: none;
}
```
Inline the arch as a full SVG with a `clip-path` pointed arch silhouette with small bell and leaf motifs on the tips.

**Motion:** Subtle fade-in on page load, 400ms `ease-out`. Reduced-motion: static.

**A11y:** `aria-hidden="true"`, `pointer-events: none`.

---

#### Rangoli Border Strip

**Look:** A 12px-tall repeating geometric rangoli pattern used as a decorative border beneath the navbar and above the footer. Diamond/chevron interlocking shapes in `--color-primary` and `--color-secondary` at 40% opacity.

**Usage:** Sub-navbar border, pre-footer border.

**Implementation:**
```css
.rangoli-strip {
  height: 12px;
  background-image: repeating-linear-gradient(
    90deg,
    var(--color-primary) 0px, var(--color-primary) 6px,
    var(--color-secondary) 6px, var(--color-secondary) 12px,
    transparent 12px, transparent 18px
  );
  opacity: 0.35;
  width: 100%;
}
```
For a richer version use an SVG `<pattern>` with diamond shapes tiled horizontally.

**Motion:** None — static.

**A11y:** `aria-hidden="true"`.

---

### 14.2 Ambient Backgrounds & Textures

#### Full-Bleed Mandala Watermark

**Look:** A large (800×800px) mandala SVG centered on the page, at 4% opacity, acting as a watermark behind all content. Drawn in `--color-foreground`.

**Usage:** Entire page background layer (`z-index: 0`, all content above).

**Implementation:**
```css
.page-mandala-bg {
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: min(800px, 100vw);
  height: min(800px, 100vh);
  opacity: 0.04;
  pointer-events: none;
  z-index: 0;
}
```
SVG mandala with 8 layers of concentric geometric rings and petal cutouts. Rotate at 0.3rpm:
```css
@media (prefers-reduced-motion: no-preference) {
  .page-mandala-bg { animation: mandala-rotate 200s linear infinite; }
}
@keyframes mandala-rotate { to { transform: translate(-50%, -50%) rotate(360deg); } }
```
Reduced-motion: static, no rotation.

**A11y:** `aria-hidden="true"`, `pointer-events: none`.

---

#### Handmade Paper Grain Texture

**Look:** A subtle noise/grain overlay that makes the `--color-background` feel like handmade Vrindavan parchment rather than flat digital white.

**Usage:** Applied as a pseudo-element on `<body>` at 3% opacity.

**Implementation:**
```css
body::after {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url('/textures/paper-grain.png'); /* 200×200px tileable grain */
  opacity: 0.03;
  pointer-events: none;
  z-index: 1;
  mix-blend-mode: multiply;
}
```
Generate the grain PNG with a Perlin noise filter or use an SVG `feTurbulence` filter inline.

**Motion:** None — static.

**A11y:** `aria-hidden="true"` via `pointer-events: none` and no semantic role.

---

#### Hero Radial Light Pool

**Look:** A soft warm radial glow emanating from behind the hero headline — like sunlight through a temple window. `--color-primary-light` at center fading to `--color-background`.

**Usage:** Hero section background.

**Implementation:**
```css
.hero-light-pool {
  background:
    radial-gradient(ellipse 70% 60% at 50% 40%,
      rgba(253,232,208,0.85) 0%,
      rgba(255,248,238,0.5) 45%,
      var(--color-background) 100%);
}
```

**Motion:** Breathes subtly — `opacity: 1 → 0.85 → 1`, 6s ease-in-out infinite. Reduced-motion: static.

**A11y:** Background only, no semantic meaning.

---

#### Floating Tulsi Leaf Field

**Look:** 12–16 small tulsi-leaf SVG shapes scattered at random positions behind the hero, drifting upward and fading out — like leaves released during kirtan.

**Usage:** Hero section, success overlay.

**Implementation (framer-motion):**
```tsx
const TulsiLeaf = ({ delay, x }: { delay: number; x: number }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ left: `${x}%`, bottom: '-20px' }}
    initial={{ y: 0, opacity: 0, rotate: 0 }}
    animate={{ y: -400, opacity: [0, 0.6, 0], rotate: 45 }}
    transition={{ duration: 8, delay, repeat: Infinity, ease: 'easeOut' }}
    aria-hidden="true"
  >
    {/* inline tulsi leaf SVG, 16×20px, fill: var(--color-secondary), opacity 0.5 */}
    <svg width="16" height="20" viewBox="0 0 16 20" aria-hidden="true">
      <ellipse cx="8" cy="10" rx="5" ry="9" fill="var(--color-secondary)" opacity="0.5"
               transform="rotate(-10 8 10)"/>
      <line x1="8" y1="1" x2="8" y2="19" stroke="var(--color-secondary)" strokeWidth="0.8" opacity="0.4"/>
    </svg>
  </motion.div>
)
```
Reduced-motion: render leaves static at 8% opacity as a scattered background pattern, no animation.

**A11y:** `aria-hidden="true"`, `pointer-events: none`.

---

### 14.3 Hero Showpiece Elements

#### Animated Diya (Oil Lamp) Flame

**Look:** A small diya SVG (flame + lamp bowl) placed at the hero's left or right accent position. The flame animates with a gentle flicker.

**Usage:** Hero section accent (top-right of headline block), footer centerpiece.

**Implementation:**
```css
@media (prefers-reduced-motion: no-preference) {
  .diya-flame {
    transform-origin: bottom center;
    animation: flame-flicker 1.8s ease-in-out infinite alternate;
  }
  @keyframes flame-flicker {
    0%   { transform: scaleX(1)   scaleY(1)   rotate(-2deg); opacity: 1; }
    40%  { transform: scaleX(0.9) scaleY(1.1) rotate(1deg);  opacity: 0.92; }
    100% { transform: scaleX(1.05) scaleY(0.95) rotate(-1deg); opacity: 0.96; }
  }
}
```
SVG: lamp bowl in `--color-secondary`, flame shape (teardrop path) filled with gradient `#E8680A → #FBF0C0`.

Reduced-motion: static diya, no animation.

**A11y:** `aria-hidden="true"` — decorative. If used as a section landmark icon, add `role="img" aria-label="Diya lamp"`.

---

#### Maha Mantra Marquee Ribbon

**Look:** A full-width horizontal ribbon between the hero and "About" strip. Saffron-gradient background (`--color-primary-light → --color-secondary-light`). The Maha Mantra scrolls continuously left in Noto Serif Devanagari — "हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे | हरे राम हरे राम राम राम हरे हरे" — repeated 3× with `·` separators. Text in `--color-heading`.

**Usage:** Between hero section and "About" strip on landing page.

**Implementation:**
```css
.mantra-ribbon {
  overflow: hidden;
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-secondary-light));
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  padding: 10px 0;
}
.mantra-track {
  display: flex;
  width: max-content;
  font-family: var(--font-mantra);
  font-size: 17px;
  color: var(--color-heading);
  white-space: nowrap;
  letter-spacing: 0.04em;
}
@media (prefers-reduced-motion: no-preference) {
  .mantra-track { animation: marquee 40s linear infinite; }
  @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
}
```
Reduced-motion: static centered mantra text, no scroll.

**A11y:** `aria-label="Maha Mantra"` on the ribbon wrapper. `role="marquee"` or suppress with `aria-hidden="true"` since the text is decorative repetition — the mantra is printed in full elsewhere on the page.

---

#### "Rounds Offered Today" Live Counter

**Look:** A pill-shaped badge in the hero — saffron background, white text — showing "✦ 1,247 rounds offered today". Number counts up from 0 to final value on page load.

**Usage:** Hero section, below the CTA button.

**Implementation (framer-motion):**
```tsx
import { useMotionValue, useTransform, animate } from 'framer-motion'

const count = useMotionValue(0)
const rounded = useTransform(count, Math.round)
useEffect(() => {
  const controls = animate(count, 1247, { duration: 2, ease: 'easeOut' })
  return controls.stop
}, [])
```
```css
.rounds-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--color-primary); color: #fff;
  font-family: var(--font-body); font-weight: 600; font-size: 14px;
  padding: 6px 16px; border-radius: 9999px;
  box-shadow: var(--shadow-glow);
}
```
Reduced-motion: show final number immediately, no count animation.

**A11y:** `aria-live="polite"` on the counter span so screen readers announce the final value once.

---

### 14.4 Illuminated Typography

#### Gold-Foil Headline Treatment

**Look:** Hero H1 and the Mantra section heading use a metallic gold gradient text fill — like gilded temple inscriptions.

**Usage:** `<h1>` on hero, Mantra section `<h2>`.

**Implementation:**
```css
.text-gold-foil {
  background: linear-gradient(
    135deg,
    #b8860b 0%,
    var(--color-secondary) 30%,
    #fde68a 55%,
    var(--color-secondary) 75%,
    #b8860b 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: var(--font-heading);
  font-weight: 700;
}
```

**Motion:** On hover/focus, a shimmer sweep — `background-position` slides from `0%` to `200%`:
```css
@media (prefers-reduced-motion: no-preference) {
  .text-gold-foil:hover {
    background-size: 200%;
    animation: gold-shimmer 1.2s ease forwards;
  }
  @keyframes gold-shimmer { from { background-position: 0% } to { background-position: 200% } }
}
```
Reduced-motion: static gold gradient, no shimmer.

**A11y:** Ensure the underlying text color still meets contrast when `background-clip: text` is unsupported (set `color: var(--color-secondary)` as fallback).

---

#### Illuminated Drop Cap

**Look:** The first letter of each section intro paragraph is enlarged (4× line height), floated left, in Lora Italic, `--color-primary`. A faint lotus watermark sits behind it at 10% opacity.

**Usage:** First paragraph of "About", "How It Works", and "Why Offer Your Chanting" sections.

**Implementation:**
```css
.drop-cap::first-letter {
  float: left;
  font-family: var(--font-heading);
  font-style: italic;
  font-size: 4.5rem;
  line-height: 0.85;
  margin: 4px 10px 0 0;
  color: var(--color-primary);
  text-shadow: 0 2px 8px rgba(232, 104, 10, 0.2);
}
```

**Motion:** Fade in slightly delayed (200ms) after paragraph appears. Reduced-motion: instant appear.

**A11y:** No special treatment needed — CSS `::first-letter` preserves the letter in the DOM for screen readers.

---

#### Sanskrit Verse + Transliteration Block

**Look:** A styled pull-quote block with the Sanskrit verse in Noto Serif Devanagari (large, `--color-heading`), transliteration below in Raleway Italic (`--color-muted`), and English translation below that in Raleway Regular. A gold vertical bar (`--color-secondary`, 3px wide) on the left edge. Cream background card.

**Usage:** "Mantra" section on landing page; above the submission form.

**Implementation:**
```css
.verse-block {
  border-left: 3px solid var(--color-secondary);
  padding: 20px 24px;
  background: var(--color-surface);
  border-radius: 0 12px 12px 0;
  margin: 32px 0;
}
.verse-devanagari {
  font-family: var(--font-mantra);
  font-size: 22px;
  line-height: 1.8;
  color: var(--color-heading);
  margin-bottom: 8px;
}
.verse-transliteration {
  font-family: var(--font-body);
  font-style: italic;
  font-size: 15px;
  color: var(--color-muted);
  margin-bottom: 6px;
}
.verse-translation {
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--color-foreground);
}
```

**Motion:** Fade + slide-left 12px on scroll-reveal, 350ms `ease-out`. Reduced-motion: fade only.

**A11y:** `lang="sa"` on the Devanagari element for correct screen reader pronunciation. `lang="en"` on translation.

---

### 14.5 Audio Recorder — Sacred Centerpiece

#### Concentric Aura Rings (Recording State)

**Look:** 3 concentric rings radiate outward from the recorder button during recording — like ripples in the Yamuna. Each ring is `--color-primary` at decreasing opacity (0.4 → 0.2 → 0.08).

**Usage:** Recorder component, active recording state only.

**Implementation (framer-motion):**
```tsx
const AuraRing = ({ delay }: { delay: number }) => (
  <motion.div
    className="absolute rounded-full border-2 pointer-events-none"
    style={{ borderColor: 'var(--color-primary)' }}
    initial={{ scale: 1, opacity: 0.4 }}
    animate={{ scale: 2.8, opacity: 0 }}
    transition={{ duration: 2, delay, repeat: Infinity, ease: 'easeOut' }}
    aria-hidden="true"
  />
)
// Render three rings with delays 0, 0.66, 1.33
```

Reduced-motion: single static ring at `--color-primary` 20% opacity, no pulse.

**A11y:** `aria-hidden="true"`, purely visual feedback. Recording state is communicated via `aria-label` change on the button and an `aria-live` timer.

---

#### Petal Waveform Visualizer

**Look:** Instead of plain rectangular bars, the audio waveform is rendered as a row of 12 teardrop/petal shapes that scale vertically in response to audio amplitude. Petals in `--color-primary` and `--color-secondary` alternating.

**Usage:** Beside the recorder button during active recording.

**Implementation:**
```tsx
// Web Audio API: AnalyserNode → getByteFrequencyData → map to petal heights
const PetalBar = ({ height, color }: { height: number; color: string }) => (
  <motion.div
    className="rounded-full"
    style={{ width: 8, background: color, minHeight: 8 }}
    animate={{ height: Math.max(8, height * 0.6) }}
    transition={{ duration: 0.08, ease: 'easeOut' }}
    aria-hidden="true"
  />
)
```
Alternate colors between `var(--color-primary)` and `var(--color-secondary)`.

Reduced-motion: static row of 12 equal-height circles at 50% opacity.

**A11y:** Waveform is `aria-hidden="true"`. Recording duration is announced via `aria-live="polite"` timer.

---

#### Gold Upload Progress Ring

**Look:** A circular SVG `stroke-dashoffset` progress ring around the recorder button during S3 upload. Ring strokes in `--color-secondary`. Center shows `%` number. On 100%: ring fills solid gold, morphs into a checkmark, text changes to "Offered".

**Usage:** Recorder component, upload/offering state.

**Implementation:**
```tsx
const circumference = 2 * Math.PI * 36 // radius 36
const offset = circumference - (progress / 100) * circumference
<svg className="absolute inset-0 -rotate-90" aria-hidden="true">
  <circle cx="44" cy="44" r="36" fill="none"
    stroke="var(--color-border)" strokeWidth="3"/>
  <circle cx="44" cy="44" r="36" fill="none"
    stroke="var(--color-secondary)" strokeWidth="3"
    strokeDasharray={circumference}
    strokeDashoffset={offset}
    strokeLinecap="round"
    style={{ transition: 'stroke-dashoffset 0.3s ease' }}/>
</svg>
```

Reduced-motion: progress ring jumps in 25% increments rather than animating smoothly.

**A11y:** `role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}` on a visually-hidden `<span>` alongside.

---

### 14.6 Premium Components

#### Glassmorphic Feature Card

**Look:** Cards with a frosted-glass effect over the warm cream background — `backdrop-filter: blur(12px)`, thin `1px` gold border, inner soft glow. Used for the three "How It Works" cards.

**Usage:** "About" strip, "How It Works" section.

**Implementation:**
```css
.glass-card {
  background: rgba(255, 248, 238, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(212, 160, 23, 0.3);
  border-radius: 16px;
  padding: 28px 24px;
  box-shadow:
    0 4px 24px rgba(61, 43, 31, 0.08),
    inset 0 1px 0 rgba(212, 160, 23, 0.15);
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}
.glass-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 8px 32px rgba(61, 43, 31, 0.12),
    inset 0 1px 0 rgba(212, 160, 23, 0.2);
}
```

**Motion:** `translateY(-4px)` + shadow deepen on hover, 200ms `ease-out`. Reduced-motion: no transform, only shadow change.

**A11y:** Cards that are links need `role="article"` and a descriptive `aria-label`. Focus state: 2px solid `--color-primary` outline.

---

#### Rounds Badge Ribbon

**Look:** A diagonal ribbon banner in the top-right corner of session cards reading "16 Rounds" — saffron background, white Raleway 600 text. Classic folded-corner ribbon style.

**Usage:** Devotee session cards.

**Implementation:**
```css
.ribbon-badge {
  position: absolute;
  top: 14px; right: -8px;
  background: var(--color-primary);
  color: #fff;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 16px 4px 12px;
  border-radius: 2px 0 0 2px;
  box-shadow: 2px 2px 6px rgba(61, 43, 31, 0.15);
}
.ribbon-badge::after { /* folded tail */
  content: '';
  position: absolute;
  right: -8px; top: 0;
  width: 0; height: 0;
  border-style: solid;
  border-width: 12px 8px 12px 0;
  border-color: transparent var(--color-primary-dark) transparent transparent;
}
```

**Motion:** None — static.

**A11y:** Ribbon text is read by screen readers as part of the card. Ensure it is included in the card's accessible name or description.

---

#### Spiritual Journey Timeline

**Look:** A vertical timeline of a devotee's chanting journey. Each node is a small lotus-bud icon (SVG) in `--color-secondary`, connected by a dashed vertical line in `--color-border`. Left side shows date, right side shows rounds count and session notes.

**Usage:** Future "My Journey" page; also as a simplified version in the success state ("Your journey so far").

**Implementation:**
```css
.timeline { position: relative; padding-left: 40px; }
.timeline::before {
  content: '';
  position: absolute; left: 16px; top: 0; bottom: 0;
  width: 1.5px;
  background: repeating-linear-gradient(
    to bottom,
    var(--color-border) 0px, var(--color-border) 6px,
    transparent 6px, transparent 12px
  );
}
.timeline-node {
  position: absolute; left: 8px;
  width: 16px; height: 16px;
  /* lotus-bud SVG, fill: var(--color-secondary) */
}
```

**Motion:** Each timeline entry fades in + slides right 12px with 80ms stagger on scroll-reveal. Reduced-motion: fade only.

**A11y:** Use `<ol>` with `<li>` for the timeline items. Each item has a visually-hidden date prefix for screen readers.

---

### 14.7 State Design

#### Lotus Bloom Success Animation

**Look:** On successful offering, a centered lotus SVG blooms — petals animate outward from the center using SVG path morphing and scale, gold fill, over 1.2s. "Hare Krishna!" headline fades up beneath it.

**Usage:** Full-screen success overlay after form submission.

**Implementation (framer-motion):**
```tsx
const petalVariants = {
  closed: { scaleY: 0.1, opacity: 0, originY: 1 },
  open:   { scaleY: 1,   opacity: 1, originY: 1,
            transition: { duration: 0.8, ease: [0.34, 1.56, 0.64, 1] } }
}
// Render 8 SVG petals in a radial layout, each staggered by 0.1s
<motion.g initial="closed" animate="open" variants={petalVariants} aria-hidden="true" />
```

Reduced-motion: lotus appears instantly at full opacity, no bloom animation. Headline fades in at 200ms.

**A11y:** `role="status" aria-live="polite"` on the overlay container. Announce: "Your chanting session has been offered successfully."

---

#### Mandala Spinner (Loading)

**Look:** A rotating mandala SVG used as a loading spinner during S3 upload and page transitions. 48px diameter, `--color-secondary` stroke on `--color-background`.

**Usage:** Upload state (fallback behind the progress ring), route transitions.

**Implementation:**
```css
@media (prefers-reduced-motion: no-preference) {
  .mandala-spinner {
    animation: spin 2s linear infinite;
    transform-origin: center;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
}
```
SVG: 4 concentric rings with petal cutouts. `stroke: var(--color-secondary)`, `fill: none`, `stroke-width: 1.5`.

Reduced-motion: static mandala at 60% opacity with a pulsing `opacity: 1 → 0.5 → 1` 1.5s loop as the only indicator.

**A11y:** `role="status" aria-label="Loading..."`. Spinner is `aria-hidden="true"`; the status role is on the wrapper.

---

#### Palm-Leaf Scroll Toast

**Look:** Toast notifications styled as a small palm-leaf scroll (patravalli) — warm cream background, thin gold border, slightly rounded corners with a subtle curl shadow at the right edge. Icon on left (success: lotus SVG / error: small flame). Text in Raleway. Auto-dismisses in 4s.

**Usage:** All toast notifications site-wide.

**Implementation:**
```css
.toast {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow:
    var(--shadow-md),
    4px 0 12px rgba(212, 160, 23, 0.12); /* scroll-curl effect */
  display: flex; align-items: center; gap: 10px;
  font-family: var(--font-body); font-size: 14px; color: var(--color-foreground);
  min-width: 280px; max-width: 360px;
}
```

**Motion:** Slides in from bottom-right, 250ms `ease-out`. Slides out right, 180ms `ease-in`. Reduced-motion: fade in/out only.

**A11y:** `role="status"` for informational toasts, `role="alert"` for errors. `aria-live="polite"` / `aria-live="assertive"` accordingly. Never steals focus.

---

#### Warm Skeleton Shimmer

**Look:** Skeleton loading placeholders use `--color-surface-alt` as the base with a shimmer sweep in `--color-secondary-light` (not cold gray). Matches the warm cream brand palette.

**Usage:** Card loading states, form page initial load.

**Implementation:**
```css
.skeleton {
  background: var(--color-surface-alt);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}
@media (prefers-reduced-motion: no-preference) {
  .skeleton::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(251,240,192,0.6) 50%,
      transparent 100%
    );
    animation: shimmer 1.6s ease-in-out infinite;
    transform: translateX(-100%);
  }
  @keyframes shimmer { to { transform: translateX(200%); } }
}
```

Reduced-motion: static `--color-surface-alt` block, no shimmer.

**A11y:** `aria-busy="true"` on the loading container. Each skeleton has `aria-label="Loading..."`.

---

### 14.8 Seasonal & Festival Hooks

These CSS classes / component slots are wired into the layout now but activated only during festival periods (Janmashtami, Kartik, Gaura Purnima, Rama Navami).

#### Janmashtami Mode
- Navbar gains a thin animated blue-gold gradient top border (`--color-secondary` + `#1e3a8a` at 30%)
- Floating "Happy Janmashtami" banner replaces the Mantra ribbon for the festival week
- Hero gets confetti of tiny peacock-feather SVGs drifting down
- Activate via `<body data-festival="janmashtami">` — all CSS scoped to `[data-festival="janmashtami"]`

#### Kartik Deepavali Mode
- Diya count increases to 5 across the hero
- Background light pool intensifies (amber tones)
- Activate via `<body data-festival="kartik">`

#### Implementation hook:
```tsx
// _app.tsx — reads from CMS/env variable
const festival = process.env.NEXT_PUBLIC_FESTIVAL // e.g. 'janmashtami' | 'kartik' | null
<body data-festival={festival ?? ''}>
```

---

## 15. Designer Elements — Implementation Order

Build in this sequence so each layer supports the next:

- [ ] **Ambient layer first:** Paper grain texture, full-bleed mandala watermark, hero radial light pool
- [ ] **Color & gradient tokens:** Gold-foil CSS recipe, hero gradient mesh, warm skeleton shimmer tones
- [ ] **Structural ornaments:** Lotus dividers, rangoli strip (navbar/footer), torana card frame
- [ ] **Typography treatments:** Gold-foil headline class, drop-cap style, Sanskrit verse block, mantra font import
- [ ] **Core components:** Glass cards, input field styling, ribbon badges, timeline
- [ ] **Hero showpieces:** Diya flame animation, Maha Mantra marquee ribbon, floating tulsi leaves, rounds counter
- [ ] **Recorder centerpiece:** Aura rings, petal waveform visualizer, gold upload progress ring
- [ ] **Micro-interactions:** Card hover tilt, button shimmer, scroll-reveal stagger, mala-bead divider reveal
- [ ] **State designs:** Mandala spinner, warm skeleton shimmer, palm-leaf toast, lotus bloom success
- [ ] **Seasonal hooks:** Festival `data-*` attribute wiring, Janmashtami / Kartik CSS scopes
