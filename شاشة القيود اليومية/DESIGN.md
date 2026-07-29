---
name: Equilibrium Finance
colors:
  surface: '#f8f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#3d4949'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#6d7979'
  outline-variant: '#bcc9c8'
  surface-tint: '#006a6a'
  primary: '#006767'
  on-primary: '#ffffff'
  primary-container: '#008282'
  on-primary-container: '#f3fffe'
  inverse-primary: '#6fd7d6'
  secondary: '#4c56af'
  on-secondary: '#ffffff'
  secondary-container: '#959efd'
  on-secondary-container: '#27308a'
  tertiary: '#8237b2'
  on-tertiary: '#ffffff'
  tertiary-container: '#9d52cd'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#8cf3f3'
  primary-fixed-dim: '#6fd7d6'
  on-primary-fixed: '#002020'
  on-primary-fixed-variant: '#004f4f'
  secondary-fixed: '#e0e0ff'
  secondary-fixed-dim: '#bdc2ff'
  on-secondary-fixed: '#000767'
  on-secondary-fixed-variant: '#343d96'
  tertiary-fixed: '#f4d9ff'
  tertiary-fixed-dim: '#e4b5ff'
  on-tertiary-fixed: '#2f004b'
  on-tertiary-fixed-variant: '#6a1b9a'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: IBM Plex Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  numeric-data:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  gutter: 16px
  card-gap: 20px
  desktop-breakpoint: 1440px
  tablet-breakpoint: 1024px
  mobile-breakpoint: 600px
---

## Brand & Style
The brand personality is rooted in precision, reliability, and executive clarity. Designed for corporate accounting, the visual language prioritizes data density without sacrificing airiness. The style is **Corporate Modern**, leveraging a structured white-space-first approach to reduce cognitive load during complex financial tasks. 

The system utilizes a refined card-based architecture to modularize information, ensuring that every financial metric is contained within its own logical boundary. High-contrast headings provide clear entry points for scanning, while soft shadows and consistent stroke weights create a sense of professional depth and craftsmanship.

## Colors
The palette is functional and semantic, designed to communicate financial health at a glance.
- **Primary (Turquoise):** Used for primary actions and brand presence.
- **Secondary (Deep Blue):** Reserved for navigation elements and structural headers to provide a grounded, professional foundation.
- **Tertiary (Purple):** Applied to secondary data sets or specific budget categories.
- **Semantic (Green, Orange, Red):** Strictly reserved for status indicators: Profit/Growth (Green), Pending/Warning (Orange), and Loss/Critical (Red).
- **Backgrounds:** A pure white base (`#FFFFFF`) is used for the primary workspace to maximize contrast, with Light Gray (`#F5F7F9`) used for background surfaces to separate the page from the dashboard cards.

## Typography
This design system uses **IBM Plex Sans** for its exceptional clarity and professional engineering feel. It provides the structured, "Segoe UI" style requested while offering superior RTL support for Arabic numerals and script.

**RTL Specifics:**
- Text alignment must default to Right for Arabic locales.
- Numerical data should remain highly legible; use tabular lining for financial tables to ensure digits align vertically.
- Hierarchy is established through weight rather than decorative flourishes to maintain a "no-nonsense" corporate tone.

## Layout & Spacing
The layout follows a **Fluid Grid** model with fixed maximum widths for desktop viewing to prevent line lengths from becoming unreadable.
- **Grid:** A 12-column grid is used for the main dashboard. Cards typically span 3, 4, 6, or 12 columns.
- **Rhythm:** An 8px base grid governs all padding and margins (referenced as increments of the 4px unit).
- **RTL Behavior:** The layout mirrors horizontally. The sidebar moves from the left to the right, and the content flow direction is reversed.
- **Breakpoints:** On tablet, 12 columns collapse to 6. On mobile, columns collapse to a single stack with reduced page margins (16px).

## Elevation & Depth
Depth is created using a combination of **Tonal Layers** and **Ambient Shadows**. 
- **The Surface:** The main background is light gray. Cards sit on this surface with a white fill.
- **Shadows:** Use a single, soft shadow level for interactive cards: `0px 4px 12px rgba(0, 0, 0, 0.05)`. 
- **Borders:** Every card and input uses a subtle 1px stroke (`#E0E4E8`) to define boundaries, ensuring clarity even if shadows are not rendered. 
- **Interactive State:** On hover, the shadow should slightly deepen (`0px 8px 24px rgba(0, 0, 0, 0.08)`) and the border color should shift to the Primary Turquoise.

## Shapes
The shape language is "Rounded," utilizing a 0.5rem (8px) corner radius for most UI components.
- **Standard Radius:** 8px for cards, input fields, and buttons.
- **Large Radius:** 16px (rounded-lg) for large modal containers or main dashboard panels.
- **Small Radius:** 4px (rounded-sm) for small utility tags or checkboxes.
This consistent roundedness softens the corporate aesthetic, making the professional environment feel modern and accessible.

## Components
- **Buttons:** Primary buttons use a solid Turquoise fill with white text. Secondary buttons use a Turquoise stroke with a transparent background. 
- **Cards:** The core of the dashboard. Each card includes a 24px internal padding, a subtle border, and the standard soft shadow. Card headers should use `headline-sm` with a bottom divider.
- **Input Fields:** Use a light gray background (`#F9FAFB`) with an 8px radius. On focus, the border transitions to a 2px Turquoise stroke.
- **Data Tables:** Row-based with alternating subtle gray highlights on hover. Headers are `label-md` in Deep Blue.
- **Status Chips:** Small, high-contrast pills with light tinted backgrounds and dark text (e.g., Green text on light green background for "Paid").
- **Financial Metric Groups:** Specialized components that display a large numeric value with a small trend indicator (arrow + percentage) positioned to the right of the value in LTR and to the left in RTL.