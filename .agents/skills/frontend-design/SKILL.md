---
name: frontend-design
description: Triggers when designing, redesigning, reviewing, or implementing frontend UI/UX, including pages, components, dashboards, forms, navigation, responsive layouts, design systems, and visual styling. Prioritizes intentional human-designed interfaces, strong information hierarchy, accessibility, responsive behavior, restrained motion, and distinctive brand-specific visual systems over generic or AI-generated patterns.
---

# Frontend Design & UI/UX Standards

## 1. Core Design Philosophy

Design the interface as a professional product designer would.

The goal is NOT to make the interface look "fancy", "modern", or visually impressive through excessive effects.

The goal is:

- clear information hierarchy
- intentional composition
- strong typography
- consistent spacing
- excellent usability
- accessibility
- responsive behavior
- visual consistency
- brand identity
- thoughtful interaction design
- restrained visual decoration

Every significant visual decision should have a reason.

Prefer:

Hierarchy over decoration.
Clarity over complexity.
Consistency over novelty.
Intentionality over trends.
Usability over visual effects.

---

# 2. Anti-Vibe-Coded Design Rules

Avoid visual patterns that make the interface look automatically generated, template-based, or assembled without a coherent design system.

Do NOT automatically use:

- excessive pill-shaped badges
- excessive rounded cards
- huge border radiuses
- gradients everywhere
- glassmorphism everywhere
- glowing borders
- excessive shadows
- floating decorative elements
- animated backgrounds
- random blobs
- oversized icons
- excessive badges
- excessive statistics
- repetitive 3-card sections
- generic SaaS layouts
- generic startup hero sections
- excessive centered layouts
- unnecessary parallax
- excessive scroll animations
- decorative elements with no UX purpose

Do not add visual effects merely because they are popular.

If a decorative element does not improve:

- comprehension
- hierarchy
- navigation
- feedback
- branding
- interaction

consider removing it.

---

# 3. Brand-Specific Design

Interfaces must feel designed for the actual product or organization.

Do not create a generic design and simply replace:

- logo
- colors
- text
- images

Instead, derive the visual language from the product's actual identity.

For construction, architecture, engineering, corporate, or professional-service products, consider visual characteristics such as:

- precision
- structure
- technical documentation
- editorial composition
- materiality
- architectural photography
- measured spacing
- strong alignment
- restrained typography

Do not use construction clichés unnecessarily.

Avoid blindly using:

- hard hats
- cranes
- blueprint backgrounds
- construction icons
- generic building illustrations

Use the brand's actual content and identity instead.

---

# 4. Design Tokens

Maintain a coherent design token system.

Use tokens for:

- colors
- typography
- spacing
- radius
- borders
- shadows
- transitions
- container widths
- breakpoints

Prefer a consistent 4px / 8px spacing rhythm where appropriate.

Do not introduce arbitrary spacing values throughout components.

Example:

```css
--space-1
--space-2
--space-3
--space-4
--space-5
--space-6
--space-8
--space-10
--space-12