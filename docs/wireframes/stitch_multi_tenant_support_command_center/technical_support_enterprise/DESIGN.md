---
name: Technical Support Enterprise
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#5c5f61'
  on-secondary: '#ffffff'
  secondary-container: '#e0e3e5'
  on-secondary-container: '#626567'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#e0e3e5'
  secondary-fixed-dim: '#c4c7c9'
  on-secondary-fixed: '#191c1e'
  on-secondary-fixed-variant: '#444749'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-sm:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  technical-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  shell-nav-width: 64px
  shell-header-height: 48px
  sidebar-width: 260px
  gutter: 16px
  stack-sm: 4px
  stack-md: 8px
  container-padding: 24px
---

## Brand & Style
The design system is engineered for high-velocity multi-tenant support environments. It prioritizes information density, utility, and structural clarity over decorative elements. The brand persona is authoritative, precise, and systematic, mirroring the workflow of expert support engineers.

The visual style is **Corporate / Modern** with a focus on **Structural High-Density**. It utilizes a hybrid geometry approach: rigid structural containers communicate stability and grid-alignment, while subtly softened interactive elements indicate touchpoints. The aesthetic is "Jira-style" functionalism—maximizing screen real estate to ensure complex ticket data is visible without excessive scrolling.

## Colors
The palette is anchored in a professional Slate scale. 
- **Core Surfaces:** `bg-white` is the primary workspace color to maintain high legibility. `bg-slate-50/50` is used for secondary sidebars and panel grouping to create subtle depth without shadows.
- **Navigation:** The global navigation rail uses `bg-slate-950` to provide a high-contrast anchor point for the application shell.
- **Borders:** A consistent `border-slate-200/80` is used for all structural divisions, ensuring a crisp grid without visual noise.
- **Semantic Accents:** Status colors are high-chroma but balanced against the slate background. Emerald represents active/healthy states, Blue signifies ongoing progress, Amber denotes urgency/pending status, and Red indicates critical SLA breaches.

## Typography
The system uses **Hanken Grotesk** for all standard UI elements due to its exceptional legibility at small scales and professional, sharp terminal ends. 

**JetBrains Mono** is reserved strictly for technical identifiers (Ticket IDs, Error Codes, API Keys) to differentiate metadata from conversational content. 

To maintain high density, the base body size is set to 14px, with 13px used for supporting metadata and sidebar lists. All caps labels are utilized for table headers and section titles to create clear hierarchical separation without increasing font size.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. The global navigation rail and local sidebars are fixed widths to ensure tool consistency, while the main content area (ticket details or data grids) is fluid.

A strict **4px baseline grid** governs all spacing.
- **High Density:** Gutters between data cells are minimized to 16px.
- **Vertical Rhythm:** Stacked elements within cards use 4px or 8px increments.
- **Responsive Behavior:** On tablet, the local sidebar collapses into an icon-only view. Desktop views prioritize side-by-side "Master-Detail" views (list on left, ticket details on right) to reduce context switching.

## Elevation & Depth
This design system eschews traditional shadows in favor of **Tonal Layering and Borders**. 
- **Level 0 (Surface):** The background of the application (`bg-white`).
- **Level 1 (Panels):** Inset sidebars and secondary navigation areas using `bg-slate-50/50`.
- **Level 2 (Modals/Overlays):** These are the only elements allowed to use a shadow. Use a sharp, 4px blur with 10% opacity `slate-900` to indicate separation.
- **Dividers:** All data cells and container boundaries are defined by a 1px border (`border-slate-200/80`).

## Shapes
The system employs a **Hybrid Geometry** logic:
- **Structural Elements:** Main dashboard containers, data grid rows, and card wrappers use `0px` (Sharp) corners. This reinforces the grid and maximizes internal alignment.
- **Interactive Elements:** Buttons, form inputs, badges, and tabs use `rounded-md` (6px) to provide a subtle visual cue that these elements are clickable and "softer" than the framework holding them.

## Components
### App Shell
- **Nav Rail:** `bg-slate-950`, icons centered, 64px width. Active state indicated by a 3px emerald left-border.
- **Header:** `bg-white`, 48px height, thin bottom border. Contains breadcrumbs and global search.

### Data Grids
- **Rows:** `border-b border-slate-100`. On hover, use `bg-slate-50`.
- **Headers:** `bg-slate-50/80`, sticky, using `label-caps` typography.

### Interactive Elements
- **Buttons:** Primary uses `bg-slate-900` with white text. Secondary uses `border-slate-200` with `bg-white`.
- **Inputs:** 32px height for high density. `border-slate-300` base, `border-blue-500` on focus with no glow/ring.
- **Badges:** Small font size, `rounded-md`, low-opacity background of the semantic color with high-opacity text (e.g., Emerald-50 background with Emerald-700 text).

### SLA & Progress
- **SLA Bars:** 4px height, background `slate-100`, fill color determined by urgency (Emerald -> Amber -> Red).
- **Status Pills:** Solid background for "Open/Active" states; outlined for "Resolved/Closed" states.