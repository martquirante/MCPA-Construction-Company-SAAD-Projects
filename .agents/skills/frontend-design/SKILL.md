---
name: frontend-design
description: Use when creating, designing, redesigning, implementing, or reviewing frontend interfaces, including websites, landing pages, dashboards, admin panels, client portals, forms, navigation, tables, design systems, and mobile-responsive web applications. Enforces distinctive, product-specific, human-quality UI/UX; native-app-like mobile experiences; accessibility; responsive behavior; maintainable architecture; and production-grade frontend performance. Avoids generic AI-generated aesthetics, unnecessary effects, template-like layouts, and superficial redesigns.
---

# Frontend Design & UI/UX Engineering Standards

## 1. Mission and Quality Bar

Build frontend interfaces that look intentionally designed by an experienced product designer and implemented by a senior frontend engineer.

The objective is not to make every page flashy, trendy, or visually complicated. The objective is to create an interface that is distinctive, trustworthy, intuitive, accessible, responsive, performant, and appropriate for its actual users.

Every implementation must balance:

- Visual design and usability.
- Brand identity and consistency.
- Desktop productivity and mobile usability.
- Accessibility and visual quality.
- Maintainability and implementation complexity.
- Performance and interaction richness.
- Existing functionality and design improvements.

**Core principle:** The interface must feel designed for this particular product, not generated from a generic template.

Prefer:

- Clear hierarchy over decoration.
- Strong composition over excessive effects.
- Consistency over arbitrary novelty.
- Real content over placeholder content.
- Useful interactions over decorative animations.
- Product-specific decisions over default templates.
- Working functionality over static mockups.
- Evidence-based improvements over personal assumptions.

Do not sacrifice accessibility, performance, or functionality for screenshots that merely look impressive.

---

## 2. Mandatory Workflow Before Coding

Never begin by immediately generating JSX, HTML, CSS, or components without understanding the task and existing project.

### Step 1 — Understand the product

Determine:

- What product or organization does the interface represent?
- Who will use it?
- What is the primary user goal?
- What actions must users complete?
- What information matters most?
- Is the interface public-facing, administrative, customer-facing, or internal?
- What devices and environments will users use?
- What existing design constraints must be preserved?

If the user already supplied the answers, use them. Ask a clarification only when a missing requirement materially affects the implementation.

### Step 2 — Inspect the existing project

Before modifying files:

1. Identify the framework, language, package manager, and styling approach.
2. Inspect the existing folder structure and application entry points.
3. Read relevant routes, layouts, components, styles, tokens, and configuration.
4. Identify existing reusable components and dependencies.
5. Understand the current navigation, authentication, data flow, and interactions.
6. Inspect the existing UI before deciding what needs to change.
7. Identify constraints such as deployment platform, browser support, and mobile performance.

Do not introduce a new component library, CSS framework, or design system without checking whether the project already has one.

### Step 3 — Establish a design direction

Before implementation, determine:

- Product personality and intended emotional response.
- Primary and secondary visual hierarchy.
- Typography and font pairing.
- Color palette and contrast requirements.
- Spacing rhythm and layout grid.
- Component shapes, borders, and surface treatments.
- Image and icon style.
- Interaction behavior and motion principles.
- Mobile navigation and content adaptation.

Choose a coherent design direction appropriate for the product.

Possible directions include editorial, architectural, technical, refined corporate, minimalist, utilitarian, luxury, playful, or data-dense enterprise interfaces.

These are options, not templates. Choose the direction based on actual product context.

### Step 4 — Plan before implementation

Identify:

- Components that can be reused.
- Existing components that should be retained.
- Pages or states affected by the change.
- Responsive layout behavior.
- Required loading, empty, error, success, and disabled states.
- Accessibility considerations.
- Performance risks.
- Tests or manual verification needed.

For existing applications, prefer targeted improvements over unnecessary rewrites.

---

## 3. Anti-Vibe-Coded Design Rules

Avoid the predictable patterns that make interfaces look automatically generated, generic, or assembled from unrelated UI kits.

Do not automatically use:

- Purple-to-blue gradients on every page.
- Excessive pill-shaped buttons and badges.
- Large rounded corners on every container.
- Glassmorphism as a default surface treatment.
- Glowing borders, neon accents, or excessive shadows.
- Random floating circles, blobs, and decorative shapes.
- Animated backgrounds without a product-related purpose.
- Oversized headings that consume useful screen space.
- Generic hero sections with a centered heading and two buttons.
- Repetitive three-card layouts across every section.
- Excessive statistics that provide no useful information.
- Unnecessary icons beside every label.
- Multiple competing accent colors.
- Excessive centered content and identical section compositions.
- Fake terminal windows, dashboards, or browser mockups without a reason.
- Decorative charts with invented data.
- Repeated glass cards nested inside other glass cards.
- Excessive entrance animations and scroll-triggered effects.
- Random font combinations selected only to appear different.
- Placeholder content that does not fit the real business.
- The same visual design reused for unrelated products.

These patterns are not universally forbidden. Use them when they genuinely serve the design, not because they are common in AI-generated interfaces.

Before adding a visual element, ask:

1. Does it improve comprehension?
2. Does it establish meaningful hierarchy?
3. Does it reinforce the product's identity?
4. Does it communicate state or affordance?
5. Does it improve usability?

If the answer is no, remove it unless there is a compelling artistic reason to retain it.

**A polished interface is not necessarily an elaborate interface.** Restrained, precise design is often better than excessive visual treatment.

---

## 4. Product-Specific Brand Identity

Never design a generic interface and simply replace its logo, colors, and text.

Derive the design language from the product's purpose, audience, content, and brand identity.

### Examples of contextual design decisions

**Construction, architecture, and engineering**
- Precise alignment, structured grids, technical typography, material-inspired surfaces, project photography, clear project statuses, and professional documentation patterns.
- Use architectural imagery when it contributes to the actual content.
- Avoid automatically decorating the interface with cranes, hard hats, blueprints, or generic construction icons.

**Financial and business applications**
- Strong numerical hierarchy, readable tables, restrained colors, explicit transaction states, and clear decision-making workflows.

**Healthcare applications**
- Legible information, calm visual hierarchy, accessible controls, understandable terminology, and careful handling of sensitive information.

**E-commerce**
- Product imagery, clear pricing, useful comparison information, predictable filters, and frictionless checkout interactions.

**Administrative dashboards**
- Information density appropriate to the task, efficient navigation, clear data grouping, strong table readability, and actionable status indicators.

These are starting considerations, not rigid templates. Adapt the actual interface to the specific product.

### Brand consistency

Maintain consistency across:

- Typography.
- Color usage.
- Spacing.
- Iconography.
- Borders and surfaces.
- Button hierarchy.
- Navigation patterns.
- Feedback states.
- Motion.
- Content tone.

Do not force identical page layouts when different pages serve different purposes.

---

## 5. Design Tokens and Design System

Use a coherent design-token system instead of scattering arbitrary values throughout components.

Define tokens for:

- Primary, secondary, accent, and semantic colors.
- Page backgrounds and surface colors.
- Typography families, sizes, weights, and line heights.
- Spacing.
- Border radii.
- Borders and dividers.
- Shadows.
- Container widths.
- Responsive breakpoints.
- Focus indicators.
- Animation durations and easing.
- Layering and stacking order.

Prefer a consistent 4px or 8px spacing rhythm where appropriate.

Example:

```css
:root {
  --color-bg: #f8f7f5;
  --color-surface: #ffffff;
  --color-text: #20211f;
  --color-text-muted: #686b66;
  --color-border: #e5e5e0;
  --color-primary: #2457a7;
  --color-primary-hover: #1d4789;
  --color-success: #237a52;
  --color-warning: #9a6500;
  --color-danger: #b42318;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;

  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;

  --content-max: 80rem;
  --transition-fast: 150ms ease;
}
```

This is an example, not a mandatory palette or token set. Adapt the values to the existing project and chosen design direction.

Rules:

1. Reuse existing tokens when available.
2. Avoid duplicate tokens with nearly identical purposes.
3. Do not introduce arbitrary values when an existing token is appropriate.
4. Use semantic tokens for meaning, not only raw colors.
5. Ensure text and interactive states remain readable in every supported theme.
6. Avoid introducing a second design system for an isolated component.
7. Keep tokens easy to maintain and extend.

---

## 6. Typography and Content Hierarchy

Typography is a major part of visual quality and usability.

Establish a deliberate typographic hierarchy for:

- Display headings.
- Page titles.
- Section headings.
- Body text.
- Supporting text.
- Labels.
- Form instructions.
- Data values.
- Table content.
- Legal and technical information.

Rules:

- Choose typefaces that fit the brand and support the required character sets.
- Use distinctive typography only when it improves the product's identity.
- Do not force unusual fonts into applications that benefit from familiar, highly readable typography.
- Use a limited and intentional set of font families and weights.
- Keep line lengths comfortable for reading.
- Avoid excessively small text, particularly on mobile.
- Use appropriate line heights and paragraph spacing.
- Prevent headings from wrapping awkwardly at common screen widths.
- Use tabular numerals for financial values and aligned numerical data when appropriate.
- Preserve readable contrast between primary and secondary text.
- Use real product terminology rather than generic marketing copy.

Do not inflate every heading simply to make the design look impressive.

Content hierarchy should reflect the user's actual tasks and information needs.

---

## 7. Layout, Spacing, and Composition

Create layouts with intentional alignment, grouping, density, and whitespace.

### Desktop

- Use a clear content container and consistent page margins.
- Align related elements to shared grid lines.
- Use columns when they improve scanning or comparison.
- Keep forms, tables, and long text within comfortable reading widths.
- Use available screen space without stretching every component.
- Maintain a meaningful hierarchy between navigation, primary content, and supporting information.
- Allow dense interfaces to remain dense when that density supports the workflow.

### Mobile

- Reconsider the layout instead of simply shrinking desktop content.
- Prioritize the main task and most important information.
- Stack columns when side-by-side layouts become cramped.
- Reorganize complex tables into appropriate mobile representations when necessary.
- Reduce unnecessary horizontal padding while preserving comfortable touch targets.
- Prevent content from overflowing the viewport.
- Keep critical actions accessible without covering content.
- Use compact spacing where appropriate without making the interface feel cramped.

### Visual rhythm

Alternate layouts only when it benefits comprehension, storytelling, or task completion.

Avoid repetitive section compositions and excessive decorative whitespace that forces users to scroll unnecessarily.

---

## 8. Mobile-First and Native-App-Like Web Experience

**Priority: When viewed on a phone, a responsive web application should feel purpose-built for mobile, not like a desktop website squeezed into a narrow screen.**

This is especially important for customer portals, administrative tools, booking systems, ticketing systems, dashboards, and data-entry applications.

### Mobile layout

- Design for small screens from the beginning.
- Adapt navigation to the available space and primary tasks.
- Consider a bottom navigation bar for applications with a small number of frequently used destinations.
- Use a drawer or compact navigation pattern when there are many destinations.
- Avoid bottom navigation for ordinary content websites unless it genuinely improves usability.
- Keep primary actions visible and predictable.
- Make forms easy to complete with one hand when practical.
- Use full-width inputs when appropriate.
- Ensure modals and dialogs fit small screens.
- Use bottom sheets only when they suit the interaction.
- Keep important actions away from device safe areas.
- Support portrait orientation and handle landscape layouts when relevant.
- Avoid unnecessary horizontal scrolling.

### Touch interactions

- Target approximately 44 × 44 CSS pixels for primary touch controls when practical.
- Keep adequate spacing between neighboring controls.
- Do not rely exclusively on hover states.
- Provide visible pressed, focused, disabled, and loading states.
- Avoid tiny icon-only buttons without accessible names.
- Prevent accidental destructive actions.
- Use native input types where appropriate, including email, telephone, numeric, and date inputs.
- Ensure the on-screen keyboard does not obscure the active input or primary action.

### Native-feeling behavior

- Use clear and consistent transitions between screens.
- Preserve relevant scroll positions when navigating where appropriate.
- Provide immediate feedback for user actions.
- Use skeletons or progress indicators when loading takes long enough to require feedback.
- Avoid unnecessary full-page reloads in application workflows.
- Use browser-native behavior appropriately rather than imitating native components badly.
- Respect reduced-motion preferences.
- Avoid implementing custom gestures unless they are necessary and reliable.
- Maintain browser back-button behavior and deep-link support.

### Safe areas and viewport behavior

Use appropriate viewport and safe-area handling for supported devices.

```css
.app-shell {
  min-height: 100vh;
  min-height: 100dvh;
}

.mobile-bottom-nav {
  padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
}
```

Do not apply fixed positioning everywhere. Fixed headers, footers, and navigation should be introduced only when they improve the workflow and do not obscure content.

### Responsive verification

At minimum, consider these viewport widths:

- 320px: narrow legacy mobile screens.
- 375px: common compact mobile layout.
- 390–430px: common modern mobile screens.
- 768px: tablet portrait.
- 1024px: tablet landscape and compact desktop.
- 1280px and above: desktop layouts.

These are testing checkpoints, not mandatory breakpoint definitions. Follow the actual project requirements and responsive framework.

---

## 9. Components and Reusability

Build components around meaningful responsibilities, not around every individual HTML element.

Examples of reusable components:

- Buttons and icon buttons.
- Inputs and form fields.
- Selects and searchable selects.
- Dialogs and confirmation modals.
- Navigation items.
- Tables and pagination.
- Status indicators.
- Empty states.
- Toasts and alerts.
- Loading indicators.
- Cards when the content genuinely benefits from card grouping.
- Page headers and section headers.
- Mobile navigation.
- Shared layout shells.

### Component rules

1. Reuse established components before creating new ones.
2. Keep components focused on clear responsibilities.
3. Avoid excessive abstraction for trivial, one-off elements.
4. Avoid duplicating complex interaction logic across multiple components.
5. Use explicit props and clear component contracts.
6. Preserve existing API contracts unless a change is necessary.
7. Separate reusable UI from product-specific business logic when appropriate.
8. Avoid enormous components containing unrelated page sections and behaviors.
9. Do not create abstractions that make simple UI harder to understand.
10. Keep component styling consistent with the design tokens.

### State and interaction

Components must behave correctly, not merely look correct.

Implement:

- Input validation.
- Loading and disabled states.
- Error feedback.
- Success feedback.
- Empty states.
- Confirmation for destructive actions.
- Keyboard interaction.
- Appropriate focus management.
- Form submission and failure handling.
- Pagination, filtering, and sorting when required.
- Correct handling of asynchronous operations.

Never replace working business logic with hardcoded demo interactions during a redesign.

---

## 10. Forms and Data-Heavy Interfaces

Forms and dashboards require special attention because visual polish alone does not make them usable.

### Forms

- Group related fields logically.
- Use persistent labels rather than placeholder-only labels.
- Explain required fields and validation rules.
- Show validation errors near the relevant field.
- Preserve user-entered data when a submission fails.
- Prevent accidental duplicate submissions.
- Use appropriate input types and autocomplete attributes.
- Provide understandable success and error messages.
- Make keyboard navigation predictable.
- Avoid excessive form steps when one clear form would work.
- Use multi-step forms only when they improve comprehension or reduce cognitive load.

### Tables and dashboards

- Align numerical values consistently.
- Make column headers clear.
- Provide readable row spacing and adequate contrast.
- Preserve important data when adapting tables to mobile.
- Use sorting and filtering only when useful.
- Provide pagination or virtualization for large datasets when appropriate.
- Display meaningful loading, empty, error, and partial-data states.
- Use charts only when they communicate real data or meaningful relationships.
- Do not fabricate numbers, statistics, charts, testimonials, or customer activity to fill empty space.
- Distinguish between missing data, zero values, and failed requests.
- Make important actions available without overwhelming each row with buttons.

Use badges and color-coded statuses only when they help users identify meaningful states quickly.

---

## 11. Accessibility and Inclusive Design

Target WCAG 2.2 Level AA where practical and relevant.

### Semantic structure

- Use semantic HTML elements.
- Maintain a logical heading hierarchy.
- Use buttons for actions and links for navigation.
- Associate labels with form controls.
- Provide accessible names for icon-only controls.
- Use ARIA only when necessary and correctly implemented.
- Do not use clickable `div` elements when a native button or link is appropriate.

### Keyboard and focus

- Ensure all interactive elements can be reached by keyboard.
- Provide clearly visible focus indicators.
- Avoid keyboard traps.
- Manage focus when dialogs open and close.
- Support Escape where appropriate.
- Ensure custom dropdowns, dialogs, menus, and comboboxes have appropriate keyboard behavior.

### Color and motion

- Check text contrast and interactive-state contrast.
- Do not communicate important information using color alone.
- Support `prefers-reduced-motion`.
- Avoid flashing or disorienting motion.
- Provide understandable error messages.
- Ensure content remains usable when text is zoomed or enlarged.

### Accessibility verification

Use automated tools where available, but do not assume that passing an automated scan proves the interface is accessible.

Manually inspect keyboard navigation, focus order, labels, errors, responsive zoom, and interaction behavior.

---

## 12. Motion and Micro-Interactions

Motion should communicate state, causality, and hierarchy.

Appropriate examples:

- A menu opening and closing.
- A button responding to a press.
- A dialog appearing.
- A progress indicator communicating an ongoing task.
- A subtle transition between related interface states.
- A meaningful chart transition.
- A controlled page transition where it supports navigation.

Rules:

- Prefer restrained motion over constant animation.
- Keep transitions short and purposeful.
- Avoid animating every element on page load.
- Do not delay access to important content for decorative sequences.
- Avoid unnecessary scroll hijacking or parallax.
- Do not animate large areas when a small transition is sufficient.
- Avoid layout shifts caused by animation.
- Use CSS transitions for simple effects.
- Use an existing motion library only when it adds meaningful value.
- Respect reduced-motion settings.
- Do not add dependencies solely for a simple hover effect.

Animation must never be the only way to communicate a state change.

---

## 13. Icons, Images, and Visual Assets

### Icons

- Reuse the project's existing icon library.
- Choose one coherent icon style.
- Use icons to improve recognition or reduce ambiguity.
- Keep icon sizing and alignment consistent.
- Avoid oversized icons used only as decoration.
- Do not mix unrelated icon sets without a reason.
- Provide accessible labels for icon-only actions.
- Avoid emoji as substitutes for professional interface icons.

### Images

- Use assets that fit the product, content, and brand.
- Prefer authentic product screenshots, real photography, or relevant illustrations when appropriate.
- Avoid irrelevant stock imagery and generic AI-looking visuals.
- Preserve appropriate aspect ratios.
- Use responsive image sizing and modern formats where supported.
- Lazy-load non-critical images when beneficial.
- Do not lazy-load critical above-the-fold images unnecessarily.
- Provide meaningful alternative text for informative images.
- Use empty alternative text for purely decorative images.
- Avoid large background images that significantly degrade mobile performance.

Never invent local asset paths or assume an image exists. Inspect available assets first.

---

## 14. Frontend Performance

A beautiful interface that loads slowly, consumes excessive memory, or performs poorly on mobile is not production-grade.

### General rules

- Minimize unnecessary dependencies.
- Avoid unnecessarily large client-side bundles.
- Use code splitting and lazy loading where appropriate.
- Optimize images and font loading.
- Avoid layout shifts.
- Avoid unnecessary re-renders.
- Keep event listeners and effects under control.
- Prevent repeated network requests when deduplication or caching is appropriate.
- Use pagination or virtualization for genuinely large datasets.
- Avoid expensive rendering work during scrolling.
- Test performance on realistic devices and network conditions when possible.

### React and Next.js

When working with React or Next.js:

- Follow the existing framework conventions.
- Prefer server rendering and server components where appropriate to the project architecture.
- Keep client components focused on actual interactive requirements.
- Avoid moving entire pages to the client without a reason.
- Avoid unnecessary waterfalls in data fetching.
- Parallelize independent requests where appropriate.
- Dynamically load heavy, non-critical features when beneficial.
- Avoid unnecessary state and effects.
- Keep props and serialized data at reasonable sizes.
- Protect server actions and API endpoints independently of the UI.

Use the official Vercel React best-practices repository as a reference when applicable.

### Performance budgets

Do not invent a universal bundle-size or response-time target for every project. Establish budgets based on the application's purpose, deployment platform, audience, and available measurements.

When performance tools are available, inspect:

- Largest Contentful Paint (LCP).
- Interaction to Next Paint (INP).
- Cumulative Layout Shift (CLS).
- JavaScript bundle size.
- Image weight.
- Network request count.
- Rendering and hydration overhead.

Prioritize measurable, user-visible problems rather than speculative micro-optimizations.

---

## 15. Data, Security, and Integration Boundaries

The frontend is not a security boundary.

- Never expose secret API keys, service-role keys, database passwords, or private tokens in client-side code.
- Treat all user input as untrusted.
- Do not rely on frontend-only authorization checks.
- Handle expired sessions and unauthorized API responses.
- Avoid rendering untrusted HTML without appropriate sanitization.
- Do not leak sensitive information through URLs, logs, error messages, or browser storage.
- Use environment variables according to the framework's public/private conventions.
- Preserve established authentication and authorization behavior.
- Handle network failures, timeouts, and invalid server responses gracefully.
- Do not assume that a successful frontend validation guarantees backend validation.

When connecting to a backend, database, or external API, inspect the existing contract before changing request formats, response handling, or error semantics.

A visual redesign must not silently break authentication, permissions, data integrity, or business workflows.

---

## 16. Frontend Architecture and Code Quality

Write code that another developer can maintain.

- Follow the repository's established conventions.
- Prefer clear naming and predictable file organization.
- Keep styles scoped appropriately.
- Avoid unnecessary global CSS.
- Avoid conflicting overrides and duplicated media queries.
- Reuse tokens instead of hardcoding repeated visual values.
- Remove dead code introduced by the change.
- Avoid adding dependencies for functionality already available.
- Preserve existing route structure unless a change is justified.
- Keep accessibility and responsive behavior close to the relevant components.
- Do not disable linting, type checking, or build checks to conceal errors.
- Do not use `any`, unsafe casts, or ignored errors as convenient shortcuts when safer alternatives are reasonable.

Do not rewrite the entire application merely to standardize a few components.

Keep the scope of the change aligned with the user's request.

---

## 17. Existing UI Redesign Rules

When the user asks to improve an existing interface:

1. Inspect the current implementation and identify actual weaknesses.
2. Preserve working functionality, data flow, routes, permissions, and integrations.
3. Identify which problems are visual, responsive, accessibility-related, performance-related, or functional.
4. Improve the most important problems first.
5. Reuse existing components and design tokens when appropriate.
6. Avoid replacing the whole design system without a clear reason.
7. Verify that all affected routes and states still work.
8. Compare the result with the original to confirm that the intended improvement occurred.

Do not make unrelated changes to backend code, database schemas, authentication, or deployment configuration unless necessary for the requested frontend task.

If the user requests a prototype rather than a working application, clearly distinguish mock data and simulated behavior from production functionality.

---

## 18. Browser Verification and Visual QA

Never assume that code is correct merely because it was generated successfully.

After implementing the UI, run the available checks appropriate to the project.

### Functional verification

Check:

- Routes and navigation.
- Buttons and interactive controls.
- Forms and validation.
- Modal and drawer behavior.
- Loading, empty, success, and error states.
- Data fetching and API integration.
- Authentication-dependent behavior.
- Browser back and forward navigation.
- Console errors.
- Failed network requests where inspectable.

### Visual verification

When browser or screenshot tools are available:

1. Run the application.
2. Open the affected page.
3. Inspect the desktop layout.
4. Inspect at least one narrow mobile viewport.
5. Check intermediate widths for broken transitions.
6. Inspect overflow, clipping, wrapping, spacing, and alignment.
7. Test interactive states.
8. Correct visible defects.
9. Repeat verification after significant changes.

Look for:

- Horizontal overflow.
- Cut-off headings.
- Overlapping elements.
- Inconsistent alignment.
- Unreadable text.
- Broken images.
- Incorrect sticky or fixed positioning.
- Keyboard or focus problems.
- Unexpected layout shifts.
- Controls obscured by the mobile keyboard.
- Excessive whitespace or unnecessarily dense sections.

If browser verification is unavailable, perform the strongest available checks and explicitly state what could not be verified. Never claim that a page was visually tested when it was not.

---

## 19. Testing and Completion Criteria

Use the tools already available in the project.

Depending on the change, run:

- Linting.
- Type checking.
- Unit tests.
- Component tests.
- Relevant integration tests.
- Production build.
- Browser-based functional checks.
- Responsive and accessibility checks.

Do not automatically run expensive or unrelated test suites when a smaller, relevant verification is sufficient, unless project requirements demand the full suite.

### Definition of done

A frontend task is complete when:

- The requested UI is implemented.
- The design fits the actual product.
- Existing functionality is preserved.
- Mobile and desktop layouts are usable.
- Important interactive states are implemented.
- Accessibility has been considered and checked appropriately.
- No obvious visual defects remain in the verified scope.
- Relevant checks pass, or failures are explicitly documented.
- Unverified assumptions and limitations are disclosed.
- The final summary accurately describes the files changed and checks performed.

Do not claim production readiness based solely on visual appearance.

---

## 20. Recommended GitHub Repositories

Use these repositories as reference material for design judgment, implementation patterns, performance, accessibility, and reusable components.

**Important:** These repositories provide different kinds of guidance. A design skill, a component library, a CSS framework, and an engineering best-practices guide are not interchangeable. Choose references relevant to the task and current stack.

### A. Frontend design and UI/UX skills

**1. Anthropic — Skills**

Repository: https://github.com/anthropics/skills

Use for:
- Frontend design skill patterns.
- Task-specific design instructions.
- Improving the planning and implementation workflow.

**2. UI UX Pro Max**

Repository: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

Use for:
- Design-system research.
- Industry-specific visual directions.
- Color palettes and typography combinations.
- Interface style references.
- UX considerations during design planning.

Treat suggested styles as options rather than blindly applying a preset.

**3. Vercel — Open Agents**

Repository: https://github.com/vercel-labs/open-agents

Use for:
- Distinctive frontend design workflows.
- Product-specific design decisions.
- Avoiding generic AI-generated interfaces.
- Production-oriented interface implementation.

**4. Emilkowalski — Skills**

Repository: https://github.com/emilkowalski/skills

Use for:
- Design and engineering judgment.
- Thoughtful interaction design.
- Motion and animation references where appropriate.

**5. Taste Skill**

Repository: https://github.com/leonxlnx/taste-skill

Use for:
- Establishing a distinct visual direction.
- Reviewing and improving generic-looking interfaces.
- Typography, spacing, layout, and motion decisions.

Do not blindly adopt another project's style. The goal is to develop a coherent identity appropriate to the current product.

### B. Frontend engineering and performance

**6. Vercel — Agent Skills**

Repository: https://github.com/vercel-labs/agent-skills

Use for:
- React and Next.js engineering guidance.
- Performance optimization.
- Web interface reviews.
- Composition and maintainability patterns.

Particularly relevant skills include `react-best-practices` and `web-design-guidelines`.

**7. React — Official Repository**

Repository: https://github.com/facebook/react

Use for:
- React APIs and component behavior.
- Official implementation references.
- Understanding framework conventions.

**8. Next.js — Official Repository**

Repository: https://github.com/vercel/next.js

Use for:
- App Router and routing patterns.
- Rendering strategies.
- Framework-specific performance and implementation guidance.

**9. Tailwind CSS — Official Repository**

Repository: https://github.com/tailwindlabs/tailwindcss

Use for:
- Utility-first styling.
- Responsive design.
- Consistent styling conventions.
- Maintaining an existing Tailwind-based codebase.

Do not introduce Tailwind if the project uses another styling system and migration is not requested.

### C. Component libraries and design systems

**10. shadcn/ui**

Repository: https://github.com/shadcn-ui/ui

Documentation: https://ui.shadcn.com/docs

Use for:
- Customizable React components.
- Accessible UI primitives and patterns.
- Form controls, dialogs, dropdowns, tables, and other common interface elements.

Treat components as a starting point. Adapt their styling to the product's design system instead of accepting every default appearance.

**11. Radix UI — Primitives**

Repository: https://github.com/radix-ui/primitives

Use for:
- Accessible interaction primitives.
- Dialogs, menus, popovers, and related UI behavior.
- Keyboard and focus-management patterns.

**12. Chakra UI**

Repository: https://github.com/chakra-ui/chakra-ui

Use for:
- Projects already built with Chakra UI.
- Accessible React components.
- Theme-driven UI development.

Do not add Chakra UI alongside an existing component library without a justified architectural decision.

### D. Accessibility and interface quality

**13. Web Interface Guidelines — Vercel**

Repository: https://github.com/vercel-labs/agent-skills

Relevant skill: `web-design-guidelines`

Use for:
- Reviewing semantic HTML.
- Accessibility checks.
- Interaction behavior.
- Frontend quality audits.
- Identifying common usability and implementation problems.

**14. Storybook**

Repository: https://github.com/storybookjs/storybook

Use for:
- Isolated component development.
- Component documentation.
- Visual and interaction testing workflows.
- Maintaining shared UI components.

**15. Playwright**

Repository: https://github.com/microsoft/playwright

Use for:
- Browser-based functional testing.
- Cross-browser verification.
- Responsive viewport testing.
- Automated interaction checks.

### Repository usage rules

1. Inspect the actual repository, README, documentation, and relevant source files before relying on it.
2. Prefer official documentation for framework APIs and supported behavior.
3. Verify that a repository is active and relevant before adopting a dependency.
4. Check the license and maintenance status before copying code or adding packages.
5. Never assume that a repository's latest branch matches the project's installed versions.
6. Avoid installing an entire library when a small, existing component solves the problem.
7. Do not copy a reference design wholesale.
8. Use the smallest relevant set of references for each task.
9. Preserve the project's architecture unless there is a clear reason to change it.
10. Never claim to have inspected a repository or executed its code unless that actually happened.

---

## 21. Recommended Implementation Order

For most frontend tasks, follow this order:

1. Understand the request and inspect the project.
2. Identify the main UX problems or requirements.
3. Establish the design direction and hierarchy.
4. Reuse or refine the existing design tokens.
5. Build the main layout and navigation.
6. Implement responsive behavior.
7. Implement reusable components and functional states.
8. Integrate real data and existing application logic.
9. Add restrained interaction feedback and motion.
10. Verify accessibility and performance.
11. Test the affected routes and viewport sizes.
12. Fix visual and functional regressions.
13. Report the actual changes and verification results.

For small changes, simplify the workflow while preserving the essential checks.

---

## 22. Final Design Principles

Before considering a frontend implementation finished, ask:

- Does this feel like the actual product?
- Is the visual hierarchy obvious?
- Does every major element serve a purpose?
- Does the layout work on mobile without feeling like a compressed desktop page?
- Are the interactions functional and predictable?
- Is the interface accessible?
- Are spacing, typography, and colors consistent?
- Have generic visual patterns been avoided where they do not fit?
- Is the implementation maintainable?
- Does the page perform reasonably on realistic devices?
- Have I verified the actual result rather than relying only on generated code?

**Final rule:** Build interfaces with the judgment of a product designer, the discipline of a frontend engineer, and the empathy of someone who must use the product every day. Make the experience distinctive through deliberate decisions, not through the quantity of visual effects.