# 6. Enforce Zero-Radius High-Density UI Style

## Status
Accepted

## Context
Our help desk center is an enterprise operational tool used daily by internal employees and agents to manage high volumes of concurrent tickets. 

Many modern component libraries favor rounded corners (`rounded-md`, `rounded-full`), generous outer frame padding, and fluid canvas spacing. While visually appealing for consumer apps, this style reduces data scanning density, slows down administrative workflows, and makes complex dashboards look cluttered.

## Decision
We will enforce a Hybrid Geometric Layout System to maximize density while preserving intuitive UI control cues:

1. **Outer Grid Framework**: All global structural blocks, data lists, main preview panes, and table grids are bound to hard-edged containers using `rounded-none`.
2. **Inner Interactive Elements**: Interactive user interface micro-widgets—including status capsules, priority badges, action checkboxes, metric percentages, and dropdown context lists—will utilize standard border-radius rules (`rounded` or `rounded-md`) to ensure standard web design expectations and visual contrast against the rigid layout grid.
3. **Data-Scanners Over Spacing**: We prioritize data density, explicit column typography grid layouts, and low-contrast horizontal row separating lines over heavy bounding boxes.

## Alternatives Considered
*   *Adopting a Pre-styled UI Library (e.g., Tailwind UI, shadcn/ui)*: Rejected for this iteration. These kits rely heavily on specific rounded-radius configurations out-of-the-box. Forcing them to be sharp-edged requires custom layer overrides, which bloats configuration files.
*   *Mixed Curvature UI*: Rejected because mixing round buttons with sharp data tables breaks visual consistency.

## Consequences
*   **Positive**: High-density layouts allow agents to scan twice as many tickets per page without scrolling.
*   **Positive**: Simplifies Tailwind code construction significantly; sub-agents only need to stamp `rounded-none`.
*   **Negative**: The interface may look overly rigid or plain if typography hierarchies, hover feedback states, and color contrast tokens are not implemented perfectly.
