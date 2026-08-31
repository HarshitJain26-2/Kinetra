---
name: Kinetra Elite
colors:
  surface: '#111415'
  surface-dim: '#111415'
  surface-bright: '#373a3b'
  surface-container-lowest: '#0c0f10'
  surface-container-low: '#191c1d'
  surface-container: '#1d2021'
  surface-container-high: '#282a2b'
  surface-container-highest: '#323536'
  on-surface: '#e1e3e4'
  on-surface-variant: '#c7c6ca'
  inverse-surface: '#e1e3e4'
  inverse-on-surface: '#2e3132'
  outline: '#919094'
  outline-variant: '#46464a'
  surface-tint: '#c8c6c7'
  primary: '#c8c6c7'
  on-primary: '#313031'
  primary-container: '#0a0a0b'
  on-primary-container: '#7a797a'
  inverse-primary: '#5f5e5f'
  secondary: '#e9c349'
  on-secondary: '#3c2f00'
  secondary-container: '#af8d11'
  on-secondary-container: '#342800'
  tertiary: '#ffb3b1'
  on-tertiary: '#680011'
  tertiary-container: '#200002'
  on-tertiary-container: '#e23644'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e5e2e3'
  primary-fixed-dim: '#c8c6c7'
  on-primary-fixed: '#1c1b1c'
  on-primary-fixed-variant: '#474647'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#ffdad8'
  tertiary-fixed-dim: '#ffb3b1'
  on-tertiary-fixed: '#410007'
  on-tertiary-fixed-variant: '#92001c'
  background: '#111415'
  on-background: '#e1e3e4'
  surface-variant: '#323536'
typography:
  headline-xl:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
  data-display:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '300'
    lineHeight: 32px
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  margin-mobile: 20px
  margin-desktop: 64px
---

## Brand & Style
The design system embodies "Athletic Luxury"—a fusion of high-performance data and premium lifestyle aesthetics. It targets an elite audience that demands precision, exclusivity, and sophistication from their AI-driven fitness regimen.

The visual style is a hybrid of **Minimalism** and **Glassmorphism**. It utilizes expansive "Onyx" space to allow "Performance Crimson" and "Elite Gold" elements to breathe, creating a cinematic, high-contrast environment. Surfaces should feel like high-end gym equipment or luxury watch interfaces: sleek, dark, and meticulously polished. 

Key principles:
- **Cinematic immersion:** High-contrast photography with low-key lighting.
- **Precision weight:** Thin lines and deliberate typography to reflect technical accuracy.
- **Controlled vibrancy:** Use of gradients and blurs only to signify AI activity or premium status.

## Colors
The palette is rooted in a "Dark Mode First" philosophy to minimize eye strain during workouts and maximize the "premium" feel. 

- **Midnight Onyx (#0A0A0B):** Used for the primary canvas to create depth and focus.
- **Elite Gold (#D4AF37):** Reserved for achievement states, premium subscription features, and high-value AI insights.
- **Performance Crimson (#E63946):** The "Active" color. Used for heart rate data, "Start" buttons, and critical performance alerts.
- **Titanium White (#F8F9FA):** Provides maximum legibility against the dark background for critical information and body text.

## Typography
This design system employs a high-contrast typographic pairing to balance tradition with technology.

- **Playfair Display** is used for headlines (H1-H3) to evoke the editorial feel of a luxury magazine. It should be used sparingly for maximum impact.
- **Inter** handles all functional UI, data visualizations, and body copy. Its geometric neutrality ensures that complex fitness data remains legible at a glance.
- **Mobile Scaling:** For mobile devices, `headline-xl` should scale down to 36px. All `data-display` roles should maintain high visibility, often utilizing "Light" or "Extra Light" weights to feel sophisticated even at large scales.

## Layout & Spacing
The layout follows a strict **8px spatial grid** for consistent rhythm, with a 4px "half-step" for tight component internal spacing.

- **Grid Model:** A 12-column fluid grid on desktop, transitioning to a 4-column grid on mobile. 
- **Generous Whitespace:** Components should have high internal padding (minimum 24px) to maintain a feeling of "Space and Luxury."
- **Data Densities:** While general UI is airy, workout dashboards may use a tighter 8px gutter to keep critical stats within a single viewport.

## Elevation & Depth
Depth is achieved through **Glassmorphism** and **Tonal Layering** rather than traditional heavy shadows.

- **Base Layer:** Midnight Onyx (#0A0A0B).
- **Surface Layer:** A slightly lighter Onyx (#161618) with a 1px "Titanium" stroke at 10% opacity to define edges.
- **Overlays (AI/Modals):** Background blur (20px to 40px) with a semi-transparent dark fill (60% opacity). This allows the workout content or imagery to peak through behind AI insights.
- **Shadows:** Only used for floating action buttons (FABs) or active cards. Use an extra-diffused "Performance Crimson" or "Elite Gold" outer glow (20% opacity) to signify a "Live" state.

## Shapes
The shape language is "Sophisticated Softness." We use subtle rounding to feel modern and premium, but avoid overly "bubbly" or pill-shaped designs that look too casual.

- **Standard Cards:** 0.5rem (8px) corner radius.
- **Buttons:** 0.25rem (4px) or completely sharp to maintain a "technical" edge.
- **Selection States:** Use a 1px Elite Gold border to highlight active selections rather than changing the shape.

## Components
Consistent implementation of the following patterns ensures the design system maintains its elite status:

- **Primary Button:** High-contrast Titanium White background with black Inter Bold text. No border. Sharp 4px corners.
- **Secondary/Accent Button:** Elite Gold stroke (1.5px) with transparent background. Gold text.
- **Ghost/AI Overlay:** Glassmorphic background (40px blur), Titanium White 10% stroke, and Crimson highlights for AI-detected errors in form.
- **Cards:** Use the "Surface Layer" color. Content should be padded by 24px. Imagery inside cards should use a subtle vignette to blend into the card background.
- **Data Visuals:** Use thin (1px) lines for charts. Gradients should flow from Performance Crimson to transparent.
- **Fitness Chips:** Small, semi-transparent Crimson or Gold pills used for "Live" tags or "Personal Record" indicators.
- **Inputs:** Underlined rather than boxed to maintain the minimal, elegant look. Active state shifts the underline to Elite Gold.