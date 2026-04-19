# Design System Specification: Mini Campaign Manager

## 1. Overview & Creative North Star
**The Creative North Star: "Luminous Depth"**

This design system moves away from the sterile, "flat" look of 2010s SaaS and toward a high-end, editorial digital experience. It is designed to feel like a premium command center—nocturnal, sophisticated, and authoritative. 

The "Luminous Depth" philosophy dictates that the UI is not a collection of boxes on a page, but a series of layered, semi-translucent glass panels floating in a deep indigo space. We break the rigid grid through intentional asymmetry: large-scale metrics bleed into white space, and technical data is grounded by high-contrast typography. This is "Mini Campaign Manager"—a tool that feels as powerful as the data it visualizes.

---

## 2. Colors: The Palette of Precision

The palette is built on a foundation of deep indigo (`surface`) with electric purple (`secondary`) accents to highlight campaign performance.

### Surface Hierarchy & Nesting
To create a premium feel, we prohibit traditional 1px solid borders for sectioning. Boundaries must be defined by background shifts or tonal transitions.
- **The "No-Line" Rule:** Do not use lines to separate content. Instead, use the `surface-container` tiers to define hierarchy.
    - **Base Layer:** `surface` (#0b1326) – The canvas.
    - **Sectioning:** Use `surface-container-low` (#131b2e) for secondary content areas.
    - **Focal Points:** Use `surface-container-high` (#222a3d) or `highest` (#2d3449) for cards and primary interaction zones.
- **The "Glass & Gradient" Rule:** Floating elements (modals, dropdowns, hovered cards) must utilize `surface-variant` with a `backdrop-blur` (20px+) to create a frosted glass effect. 
- **Signature Textures:** For primary CTAs and hero analytics, use a subtle linear gradient from `primary` (#bdc2ff) to `primary-container` (#3e49bb) at 135 degrees. This adds "soul" and prevents the UI from feeling flat.

---

## 3. Typography: Editorial Authority

We use the **Inter** font family exclusively, relying on dramatic scale shifts rather than font variety to create an editorial feel.

- **Display (display-lg/md):** Reserved for singular, high-impact campaign metrics (e.g., total ROI). These should feel like a headline in a high-end magazine.
- **Titles & Headlines:** Use `headline-sm` for section titles. Ensure generous tracking (letter-spacing: -0.02em) to maintain a modern, tight aesthetic.
- **Data Labels:** Use `label-md` and `label-sm` for technical metadata. These should be in `on-surface-variant` (#c6c5d5) to recede visually, allowing the data values themselves to pop in `on-surface` (#dae2fd).

---

## 4. Elevation & Depth: Tonal Layering

In this design system, elevation is a function of light and translucency, not just shadows.

- **The Layering Principle:** Stack containers to create lift. A card (`surface-container-high`) sitting on a section (`surface-container-low`) creates natural depth. 
- **Ambient Shadows:** When an element must "float" (like a tool-tip or modal), use a diffused shadow.
    - **Specs:** `0px 24px 48px rgba(6, 14, 32, 0.4)`. The shadow color should be a darker version of the surface color, never pure black.
- **The "Ghost Border" Fallback:** If a container requires more definition (e.g., in high-density data views), use a **Ghost Border**: `outline-variant` (#454653) at 15% opacity. Never use 100% opaque borders.
- **Glassmorphism:** Use `surface-variant` at 60% opacity with a blur. This allows the primary indigo background to bleed through, softening the interface and making it feel integrated.

---

## 5. Components: Polished Primitives

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-container`). Roundedness: `md` (0.375rem). Text: `label-md` in `on-primary`.
- **Secondary/Tertiary:** No fill. Use the "Ghost Border" (15% opacity `outline`) or a subtle `surface-container-highest` hover state.

### Cards & Analytics Modules
- **Rule:** Forbid the use of divider lines.
- **Spacing:** Use vertical white space (32px or 48px) to separate data groups. 
- **Style:** Cards should use `surface-container-highest` or the Glassmorphism effect.

### Input Fields
- **Background:** `surface-container-lowest`.
- **Border:** Ghost Border (10% opacity `outline-variant`).
- **Active State:** Border transitions to `secondary` (electric purple) with a subtle glow (2px outer blur).

### Chips & Badges
- **Status:** Use `secondary_container` for positive campaign trends and `error_container` for drops. Keep these small and pill-shaped (`rounded-full`).

### Key Analytics Components (Context Specific)
- **The Trend Sparkline:** Use `secondary` (electric purple) for the line color with a `secondary_container` gradient fade beneath the line.
- **Floating Action Dock:** A bottom-center anchored navigation bar using maximum Glassmorphism and a `xl` (0.75rem) corner radius.

---

## 6. Do's and Don'ts

### Do
- **Do** prioritize white space. If a layout feels "crowded," increase the padding to the next step in the scale rather than adding a border.
- **Do** use `on-surface-variant` for helper text to maintain a clear visual hierarchy.
- **Do** use subtle motion. Elements should slide up 4px as they fade in, mimicking a physical "placement" on the glass surface.

### Don't
- **Don't** use pure black (#000) or pure white (#fff). Always use the themed tokens to maintain the deep indigo tonal depth.
- **Don't** use sharp corners. Stick to the `md` (0.375rem) and `xl` (0.75rem) scale to keep the "professional-grade" feel approachable.
- **Don't** use standard "drop shadows" on every card. Rely on background color shifts first; reserve shadows for floating UI only.