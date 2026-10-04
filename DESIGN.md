# DESIGN SYSTEM SPECIFICATION: MCPA ARCHITECTURAL DOSSIER

## 1. Brand Philosophy & Identity

MCPA Construction & Supply is a premier Architectural Design & Civil Engineering firm based in Bulacan, Philippines.

### The Core Metaphor: "The Digital Architectural Dossier"
The interface behaves like an executive physical project binder and precision drafting workstation. It rejects modern generic web tropes in favor of structural clarity, authentic materiality, and deliberate human craftsmanship.

### Anti-Vibe-Coded / Anti-AI Design Directives
- **Zero Generic Tropes**: Strictly NO glassmorphism, NO colorful blurred neon drop-shadows, NO floating animated blobs, NO 9999px bubbly pill buttons, and NO cartoon construction clichés (e.g., hard hats or cartoon cranes).
- **Structure Over Decoration**: Every line, divider, label, and container must serve a functional architectural or telemetry purpose.
- **Editorial Precision**: Measured whitespace, razor-thin 1px borders, technical title blocks, and deliberate typographic rhythm.

---

## 2. Color Tokens

A disciplined, low-fatigue palette rooted in structural materials (cured concrete, matte slate, architectural ink, safety amber, and surveyor cyan).

```css
:root {
  /* Canvas & Backgrounds */
  --bg-canvas: #0a0c10;          /* Deep Engineering Obsidian (primary background) */
  --bg-surface: #121620;         /* Technical Slate Paper (card & panel surface) */
  --bg-surface-elevated: #181d2a;/* Elevated dialog & dropdown surface */
  --bg-surface-subtle: #1a202e;  /* Input fields & inactive tracks */

  /* Hairlines & Drafting Borders */
  --border-hairline: #222838;    /* 1px crisp drafting boundary */
  --border-hover: #374158;       /* Subtle interactive hover boundary */
  --border-focus: #f59e0b;       /* Active focus / selected amber border */

  /* Primary Brand Accents */
  --accent-amber: #f59e0b;       /* Construction Safety Amber (primary actions & highlights) */
  --accent-amber-hover: #d97706; /* Deepened amber on press */
  --accent-cyan: #0284c7;        /* Surveyor Reticle / Geodetic telemetry */
  --status-emerald: #10b981;     /* Verified / Confirmed milestones */
  --status-rose: #ef4444;        /* Critical alerts & lockouts */

  /* Text & Contrast */
  --text-primary: #f8fafc;       /* Bone White (98% contrast headings & primary text) */
  --text-secondary: #94a3b8;     /* Technical Slate (body copy & field labels) */
  --text-tertiary: #64748b;      /* Monospace indices, metadata, and timestamps */
  --text-inverse: #0a0c10;       /* Dark text on amber buttons */
}
```

---

## 3. Typography System

Strict two-family typography system balancing clean editorial readability with exact technical measurements.

### Typefaces
- **Primary Interface**: `Inter` / `Plus Jakarta Sans` (weights: 400 Regular, 500 Medium, 600 SemiBold).
- **Technical Telemetry**: `JetBrains Mono` / `Space Mono` (used exclusively for coordinates, timestamps, currency amounts, lot dimensions, and drawing sheet numbers).

### Hierarchy Scale
| Role | Font Family | Size | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Header** | Primary Sans | 28px–32px | 700 Bold | -0.02em | Modal / Sheet Titles |
| **Section Title** | Primary Sans | 18px–20px | 600 SemiBold | -0.01em | Card Groupings & Steps |
| **Sheet Tag** | Monospace | 10px–11px | 700 Bold | +0.15em | Uppercase Sheet IDs (`SHEET A-01`) |
| **Body Primary** | Primary Sans | 13px–14px | 400 Regular | 0 | Descriptions & Form Labels |
| **Technical Data** | Monospace | 12px | 500 Medium | +0.02em | GPS Coordinates, Lot Area, IDs |
| **Micro Caption** | Primary Sans | 11px | 500 Medium | 0 | Disclaimers & Helper Notes |

---

## 4. Layout, Geometry & Spacing

### 8px Baseline Grid Rhythm
- `space-1`: 4px (micro gaps, button padding adjustments)
- `space-2`: 8px (standard element spacing)
- `space-3`: 12px (form row gaps)
- `space-4`: 16px (card inner padding, input heights)
- `space-6`: 24px (section margins)
- `space-8`: 32px (container gutters)
- `space-12`: 48px (major component separation)

### Radii & Corners
- **Strict Maximum**: `4px` to `6px` radius for cards, inputs, and buttons.
- **Never Use**: `rounded-full` or `9999px` pills for structural containers, buttons, or cards. (Pills make construction software look like playful consumer chat apps).
- **Architectural Corner Marks**: Cards and modals feature subtle L-shaped drafting marks (`┌ ┐ └ ┘`) in `#333d52` at the four corners.

---

## 5. Signature Components & Interactive Patterns

### 1. The Blueprint Sheet Title Block
Placed at the top-left or header of every major view:
```text
┌───────────────────────────────────────────────────────────────┐
│ FIRM: MCPA PHILIPPINES  │  STAGE: CLIENT INQUIRY & LOT SURVEY │
│ REF: MCPA-CPB-2026      │  STATUS: RESTRICTED ACCESS          │
└───────────────────────────────────────────────────────────────┘
```

### 2. Form Inputs & Field Controls
- Clean rectangular box with 1px border (`#222838`), 4px border-radius, and solid slate background (`#121620`).
- Labels are positioned above the field with crisp monospace index tags: `PRIN-01: CLIENT FULL NAME`.
- Focus State: 1px sharp amber border (`#f59e0b`) with no fuzzy outer glow.

### 3. Theodolite Satellite Lot Survey Canvas
- High-contrast satellite view with subtle 1px grid overlay.
- Surveyor Reticle: Thin crosshairs with azimuth degree markers and a centered pin: `📍 Pinpoint Lot Boundary`.
- Monospace Telemetry HUD fixed at the bottom of the map:
  `GPS: 14.88714° N, 120.85721° E | ELEV: 14m ASL | REGION: Bulacan R-1`

### 4. Meeting Itinerary Stamps (Face-to-Face vs Online)
Styled as architectural dispatch stamps rather than generic radios:
- `[ STAMP: MCPA MAIN OFFICE ]` (Plaridel, Bulacan — Sample Finishes & Blueprints)
- `[ STAMP: COFFEE SHOP DIALOGUE ]` (With input for preferred cafe/mall)
- `[ STAMP: ON-SITE PROPERTY VISIT ]` (Direct lot ocular inspection)
- `[ STAMP: CUSTOM LOCATION ]` (Client residence or workplace)
- Clear availability indicator: `*Subject to Lead Architect availability confirmation within 24h`.

### 5. Precision Mechanical "Slide to Verify" Slider
- Replaces traditional distorted-letter and picture-grid captchas.
- Styled like a parallel drafting ruler or industrial sliding lock bar:
  `[ ≡ SLIDE RULER TO VALIDATE & CONFIRM CONSULTATION DOSSIER ────────► ]`
- Snaps into an emerald green verification seal: `[ ✓ VERIFIED HUMAN DOSSIER ]`.

### 6. Client Portal Progression Stepper
Linear 5-phase architectural progression with clean hairline connectors:
`[1. Brief Lodged ✓] ── [2. Architect Feasibility ✓] ── [3. Consultation Scheduled] ── [4. Costing & 3D] ── [5. Site Mobilization]`

---

## 6. Motion & Interaction Rules
- **Duration**: Fast, precise transitions (150ms to 200ms `cubic-bezier(0.16, 1, 0.3, 1)`).
- **Zero Bouncing**: No playful springs, rubber-band animations, or floating loops.
- **Hover Feedback**: Crisp surface lightening (`#121620` -> `#181d2a`) and border color shift.
