# AzadiPath Design System

## Design read

AzadiPath is a responsive **personal finance and life-planning product UI** for Pakistani youth. The visual direction is a focused **Pakistan @ 79 control room**: patriotic green carries purpose, chalk-white surfaces create calm, and thin lime signals make progress feel measurable rather than decorative.

## Design concept

> **The concept is: a personal future-control room for Pakistan’s next era — expressed through an asymmetric dashboard grid, editorial display type paired with tabular numerals, a restrained green/white palette, and short signal-like motion when plans update.**

## Palette

The palette is committed to green and white because the brief explicitly requires the Pakistan @ 79 theme. The ratio is approximately 60% chalk-white / pale mint page field, 30% raised green-tinted surfaces, and 10% signal green / lime actions.

| Token | Value | Use |
|---|---:|---|
| Ink | `#123328` | Headings, primary text |
| Forest | `#0B5D3B` | Sidebar, primary actions, chart marks |
| Deep forest | `#063D2A` | Hero blocks, high-contrast surfaces |
| Pakistan green | `#0F8A55` | Active states, progress |
| Signal lime | `#B7E45C` | Focus, highlights, positive deltas |
| Chalk | `#F8FBF4` | Page background |
| Mint wash | `#EAF4E8` | Raised surfaces and bands |
| Line | `#D5E5D6` | Input/control edges and dividers |
| Muted ink | `#557166` | Supporting copy; kept dark for contrast |
| Risk amber | `#B86B17` | Advisory status, never color-only |

## Typography

Headings use **Space Grotesk** for a modern, purposeful voice. Supporting UI uses the same family with weight contrast. Metrics use tabular numerals for scanning and financial clarity.

## Components

Cards use a single radius scale (`18px`) with soft green-tinted shadows rather than heavy borders. Elevated surfaces are reserved for the four P&L metrics, the simulator, and planner workspaces. Inputs use visible outlines, labels, helper text, and focus rings. Buttons have a compact press state and never rely on color alone to communicate status.

## Layout

Large screens use a fixed left rail and a wide, breathing workspace. Mobile collapses the rail into a top bar and turns content into a single-column flow. The dashboard uses one primary action per screen: **Build my roadmap**, **Log a financial leak**, or **Update my projection** depending on the active workspace.

## Motion

Motion is subtle and functional. Numbers and progress bars transition over 180–240ms. No essential information depends on animation. `prefers-reduced-motion` disables non-essential transitions.

## Voice and copy

Copy is direct, optimistic, and locally grounded. The product frames personal agency as national progress without promising investment outcomes. Financial projections are clearly marked as illustrative, the KSE-100 is named explicitly, and a short risk note remains visible near every projection.

## Accessibility floor

All controls are keyboard reachable, use visible focus rings, have labels, and preserve text contrast. Charts include a plain-language insight and a table-like data summary through accessible labels. Status is never conveyed with color alone.

## References pulled

The system adapts the restrained hierarchy and density of modern financial workspaces, the editorial rhythm of Swiss dashboards, and the clarity of product onboarding patterns from the UI/UX reference research. It intentionally avoids generic blue fintech styling by making green a structural brand field rather than a single accent.

## Implementation note

The MVP stores the onboarding profile and demo state in browser local storage so a live hackathon demo remains fast and resilient. The app is structured so the roadmap generator and user records can move to server-side persistence without changing the product vocabulary.

---

*This is a demonstration and planning tool, not investment, medical, or career-placement advice.*
