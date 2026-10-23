---
name: frontend-design
description: Design, build, redesign, and audit production-quality web application interfaces with exceptional UI/UX, distinctive visual identity, native-app-like mobile experiences, responsive layouts, accessibility, and performance. Use when creating or improving any frontend page, component, dashboard, client portal, admin panel, form, navigation system, or complete web application.
---

# Frontend Design Engineering Skill

## 1. Mission

Act as a senior product designer, principal frontend engineer, interaction designer, and design systems specialist working together.

The objective is to create interfaces that feel intentionally designed by an exceptional human design team.

Do not merely make an interface look modern. Make it visually distinctive, easy to understand, pleasant to use, responsive, accessible, fast, and reliable.

Every design decision must serve the actual product, its users, and its context.

The finished interface must satisfy five objectives:

1. Distinctive visual identity.
2. Excellent usability and interaction design.
3. Native-app-like mobile experience.
4. Production-quality frontend engineering.
5. Verified behavior across relevant screen sizes.

A beautiful screenshot is not sufficient if the actual application is difficult to use.

A technically functional application is not sufficient if its interface is generic, inconsistent, or poorly designed.

## 2. Mandatory Project Inspection

Before modifying any existing project:

1. Identify the framework, routing system, styling approach, and component architecture.
2. Inspect the existing folder structure and relevant source files.
3. Read the existing design tokens, theme configuration, and reusable components.
4. Identify the actual purpose of the page and its primary user actions.
5. Understand existing authentication, authorization, API calls, database interactions, and application state.
6. Identify existing responsive behavior and potential mobile usability problems.
7. Determine which components can be reused and which genuinely require redesign.
8. Inspect available testing, linting, and build commands.

Do not assume the project uses a particular framework.

Do not replace the existing architecture merely because a different approach is more familiar.

Do not rewrite working components unnecessarily.

Preserve existing business logic, API contracts, routes, authentication, permissions, and data integrity.

When requirements are unclear, investigate the existing implementation before making assumptions.

## 3. Design Direction Before Coding

Every substantial UI task must begin with an intentional design direction.

Determine:

- Product purpose.
- Target users.
- Primary user journey.
- Most important action on the screen.
- Information hierarchy.
- Brand personality.
- Desktop interaction requirements.
- Mobile interaction requirements.
- Accessibility requirements.
- Performance constraints.

Choose a coherent aesthetic appropriate for the product.

Possible directions include:

- Refined architectural editorial.
- Contemporary enterprise software.
- Understated luxury.
- Modern industrial.
- Editorial minimalism.
- Warm professional.
- Technical precision.
- Distinctive consumer-product design.

These are starting points, not templates.

Choose a visual language that fits the actual product. Do not automatically use the same design direction for every project.

Before implementing a significant redesign, establish:

1. Visual direction.
2. Typography system.
3. Color system.
4. Spacing scale.
5. Layout structure.
6. Component behavior.
7. Responsive strategy.
8. Interaction and motion principles.

For small, localized fixes, use the existing design system instead of introducing unnecessary planning or redesign work.

## 4. Human-Level Visual Design Standards

The interface must demonstrate deliberate design judgment rather than default component assembly.

### Typography

- Establish a clear hierarchy between page titles, section headings, body text, metadata, and supporting labels.
- Choose typefaces appropriate to the product's personality and readability requirements.
- Use a restrained, consistent type scale.
- Control line length, line height, letter spacing, and text wrapping.
- Prevent awkward title wrapping and clipped labels.
- Use tabular numerals when comparing prices, quantities, measurements, or financial figures.
- Avoid excessively small text on mobile devices.
- Do not use bold typography for everything.

Choose fonts based on actual design requirements. Do not automatically select the same fashionable font for every project.

### Color

- Establish primary, secondary, neutral, surface, border, success, warning, and error tokens.
- Use brand colors intentionally.
- Maintain sufficient contrast.
- Reserve high-emphasis colors for meaningful actions and important states.
- Avoid excessive gradients, decorative glow, and unnecessary transparency.
- Ensure that status is not communicated through color alone.

Do not introduce a new palette when the existing product already has a coherent brand identity.

### Spacing and Layout

- Establish a consistent spacing scale.
- Use a coherent alignment system.
- Group related information visually.
- Give important content sufficient breathing room.
- Maintain consistent relationships between headings, descriptions, controls, and sections.
- Use negative space to establish hierarchy.
- Avoid arbitrary spacing adjustments that make related screens feel inconsistent.

Prefer consistent design tokens over repeated, unexplained pixel values.

### Surface and Component Design

Every card, panel, modal, drawer, and container must have a clear purpose.

Do not wrap every piece of content in a card.

Use visual separation, typography, borders, backgrounds, and spacing according to the information hierarchy.

Avoid automatically applying:

- Excessive rounded corners.
- Repeated floating-card layouts.
- Heavy shadows on every component.
- Unnecessary glassmorphism.
- Decorative gradients without a functional purpose.
- Generic dashboard layouts unrelated to the product.
- Excessive pill-shaped buttons.
- Random icon decorations.

These treatments are not forbidden. Use them only when they support the intended design direction.

### Visual Consistency

Create or reuse design tokens for:

- Colors.
- Typography.
- Spacing.
- Border radii.
- Borders.
- Elevation.
- Component heights.
- Breakpoints.
- Motion duration.
- Focus indicators.

Repeated interface patterns must behave consistently across the application.

A coherent design system is more important than isolated visual effects.

## 5. Mobile-First, Native-App-Like Experience

This is a mandatory priority.

A responsive website must not simply be a desktop layout reduced to a smaller width.

On mobile, the interface must feel like a carefully designed application.

### Mobile Layout

- Prioritize the main user task.
- Remove unnecessary horizontal complexity.
- Reorganize information according to mobile usage.
- Use the available viewport efficiently.
- Avoid desktop sidebars that consume most of the screen.
- Prevent horizontal overflow.
- Avoid excessively tall pages caused by unnecessary nested cards.
- Keep important actions accessible without obstructing content.
- Use appropriate full-width layouts for forms and primary workflows.
- Maintain readable content widths and spacing.

Do not hide important functionality merely to simplify the mobile layout.

When a desktop table becomes impractical on a narrow screen, choose an appropriate alternative, such as a horizontally scrollable table, prioritized columns, or a mobile record layout.

Select the solution according to the task and information density.

### Mobile Navigation

Choose navigation according to the application's information architecture.

Appropriate patterns may include:

- Bottom navigation for a small set of frequently used destinations.
- A compact top bar for contextual navigation.
- A drawer for larger navigation hierarchies.
- Tabs for closely related sections.
- Breadcrumbs or back navigation for hierarchical workflows.
- A contextual action bar for task-specific actions.

Do not automatically use every navigation pattern.

Bottom navigation should contain a limited number of high-priority destinations. Avoid overcrowding it with rarely used pages.

Respect device safe areas where necessary, particularly when implementing fixed bottom navigation or bottom action bars.

Fixed navigation must not cover form fields, buttons, messages, or scrollable content.

### Touch Interactions

- Make interactive elements comfortable to tap.
- Aim for approximately 44–48 CSS pixels for primary touch targets where practical.
- Provide sufficient spacing between adjacent controls.
- Never rely exclusively on hover interactions.
- Ensure controls work with touch, mouse, and keyboard.
- Avoid requiring precise gestures for essential functionality.
- Provide visible feedback for successful and unsuccessful actions.
- Prevent accidental activation of destructive actions.

Use touch-friendly menus, dialogs, and pickers when appropriate.

### Mobile Forms

- Use appropriate input types.
- Associate every input with a meaningful label.
- Use input modes that match the expected data.
- Make validation messages understandable.
- Preserve entered values when recoverable errors occur.
- Avoid unnecessarily long forms.
- Group related fields logically.
- Keep important actions visible without obscuring the keyboard or content.
- Test the layout when the virtual keyboard is open.

Never use placeholder text as the only field label.

### Safe Areas and Viewport

- Account for notches and device safe areas when relevant.
- Avoid hard-coded assumptions about device height.
- Prefer dynamic viewport units when appropriate.
- Test fixed and sticky elements on narrow screens.
- Ensure content remains usable in portrait orientation.
- Avoid layouts that break when browser chrome expands or collapses.

## 6. Desktop and Tablet Experience

Do not sacrifice desktop usability to achieve a mobile-app-like appearance.

Desktop layouts should take advantage of larger screens when doing so improves the workflow.

Depending on the product, this may include:

- Persistent navigation.
- Multi-column layouts.
- Data tables.
- Side-by-side detail panels.
- Contextual toolbars.
- Keyboard-accessible actions.
- Efficient information density.

Tablet layouts should use an intentional intermediate layout rather than blindly inheriting either desktop or mobile behavior.

Use responsive breakpoints based on where the content and interactions stop working well, not solely on specific device models.

## 7. Interaction Design

Every interactive component must have a clear purpose and predictable behavior.

Define the appropriate states for:

- Default.
- Hover, where applicable.
- Focus-visible.
- Active or pressed.
- Disabled.
- Loading.
- Success.
- Error.
- Empty.
- Selected.

Not every component requires every state, but every relevant state must be handled.

### Buttons

- Use labels that describe the action.
- Establish a clear hierarchy between primary, secondary, and destructive actions.
- Prevent repeated submissions when necessary.
- Show progress when an operation takes time.
- Do not make a decorative element appear clickable.
- Do not implement buttons without meaningful behavior.

### Forms

- Validate at the appropriate time.
- Provide specific error messages.
- Explain how to resolve validation failures.
- Preserve user input when possible.
- Prevent accidental data loss.
- Indicate successful submission.
- Handle network failures gracefully.

### Dialogs and Drawers

- Provide appropriate dismissal behavior.
- Support keyboard navigation.
- Manage focus correctly.
- Prevent background interaction when a modal requires it.
- Avoid dialogs that unnecessarily interrupt a workflow.
- Make destructive confirmations clear.

### Motion

Use animation to communicate state, hierarchy, and spatial relationships.

Prefer restrained, purposeful transitions.

Avoid:

- Animating every element.
- Excessive parallax.
- Unnecessary scroll-triggered effects.
- Long entrance animations that delay interaction.
- Motion that reduces readability.
- Animations that consume substantial resources on mobile devices.

Respect the user's reduced-motion preference.

Animation must never be required to understand essential information.

## 8. Anti-Generic UI Rules

Before accepting a design, evaluate whether it looks like a generic AI-generated template.

Reject the following when they have no product-specific justification:

- A predictable dashboard made entirely of identical cards.
- Random purple or blue gradients.
- Excessive glassmorphism.
- Oversized headings that waste valuable screen space.
- Repeated rounded rectangles around every section.
- Decorative statistics unrelated to the user's workflow.
- Fake charts or invented business metrics.
- Placeholder content left in production screens.
- Excessive emoji used as interface icons.
- Unnecessary animation and decorative background effects.
- Inconsistent spacing between similar components.
- Multiple competing primary buttons.
- Excessive empty space without a clear purpose.
- Generic layouts copied across unrelated products.

Do not confuse visual complexity with design quality.

A restrained, precisely executed interface can be more sophisticated than a visually crowded one.

Do not deliberately make a design unusual merely to avoid looking generic.

Originality must improve the product's identity, usability, or clarity.

## 9. Design-System and Component Reuse

Before creating a component:

1. Check whether an equivalent component already exists.
2. Determine whether it can support the required behavior.
3. Extend the existing component when appropriate.
4. Create a new reusable component only when it provides a genuine architectural or design benefit.

Keep design tokens centralized when the existing architecture supports it.

Avoid:

- Duplicated components with slightly different styling.
- Repeated magic numbers.
- Unnecessary dependencies.
- Multiple competing icon libraries.
- Reimplementing functionality already provided by the project.
- Replacing the styling system without a clear reason.

Use semantic HTML and appropriate accessible component patterns.

A component library may accelerate development, but its default appearance must not dictate the final design.

Customize components to match the product's visual system.

## 10. Accessibility

Accessibility is a core requirement, not a final cosmetic check.

- Use semantic HTML.
- Maintain logical heading hierarchy.
- Provide accessible names for controls.
- Associate form labels and errors correctly.
- Maintain visible keyboard focus.
- Support keyboard navigation.
- Use appropriate ARIA attributes only when necessary.
- Ensure dialogs and menus manage focus correctly.
- Provide sufficient text and control contrast.
- Avoid color-only status communication.
- Respect reduced-motion preferences.
- Make touch interactions usable without relying on hover.

Target WCAG 2.2 Level AA where applicable.

Do not claim accessibility compliance without appropriate checks.

## 11. Performance and Reliability

Visual quality must not compromise application performance.

- Avoid unnecessary client-side JavaScript.
- Minimize expensive re-renders.
- Avoid unnecessarily large dependencies.
- Optimize images and media.
- Reserve layout space when practical to reduce layout shifts.
- Use lazy loading where appropriate.
- Avoid excessive shadows, filters, and expensive animations.
- Keep interactions responsive on lower-powered mobile devices.
- Prevent unnecessary network requests.
- Preserve existing caching and data-fetching strategies.
- Avoid introducing large animation libraries for trivial effects.

For React and Next.js projects, follow the existing architecture and framework-specific best practices.

Prefer server-rendered or server components where appropriate for the framework and project.

Use client-side interactivity where the interface genuinely requires it.

Never compromise authentication, authorization, validation, or data integrity for visual convenience.

## 12. Real Content and Product Context

Design using the application's actual data model, user roles, and workflows.

Do not invent business metrics, project statuses, financial figures, user records, or analytics.

Use existing API responses and project data wherever available.

If sample data is necessary for a prototype, label it appropriately.

Account for:

- Long names.
- Large numbers.
- Missing images.
- Empty lists.
- Long descriptions.
- Validation failures.
- Slow network responses.
- Permission restrictions.
- Expired sessions.
- Unexpected API responses.

The interface must remain understandable when real-world data differs from the ideal example.

## 13. Reference Research and Agentic Resources

When a task would benefit from established design knowledge, inspect relevant official documentation or reputable open-source repositories.

Potential references:

- Anthropic Skills:
  https://github.com/anthropics/skills

- UI UX Pro Max:
  https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

- Vercel Agent Skills:
  https://github.com/vercel-labs/agent-skills

- Addy Osmani Agent Skills:
  https://github.com/addyosmani/agent-skills

Use these resources selectively.

Research the specific skill, component, pattern, or guideline relevant to the current task.

Do not blindly copy a repository's entire design system.

Do not install dependencies simply because a repository is popular.

Inspect installation instructions, licensing, dependencies, and compatibility before introducing external code.

Prefer official documentation when verifying framework APIs and accessibility behavior.

If external research is unavailable, proceed using the existing project and established engineering principles rather than fabricating research results.

## 14. Mandatory Implementation Workflow

For substantial UI work, follow this sequence.

### Phase A — Inspect

- Inspect the existing implementation.
- Identify the relevant components and styles.
- Understand the user workflow.
- Identify technical constraints and potential regressions.

### Phase B — Plan

- Establish the visual direction.
- Define the information hierarchy.
- Decide how desktop, tablet, and mobile should differ.
- Identify reusable components.
- Define expected interaction states.

Avoid producing an unnecessarily long plan for small changes.

### Phase C — Implement

- Make focused changes.
- Reuse existing architecture where appropriate.
- Implement actual functionality.
- Apply consistent design tokens.
- Build responsive layouts intentionally.
- Preserve existing integrations.
- Handle loading, empty, success, and error states.

### Phase D — Verify

- Run available linting and type checks.
- Run relevant tests.
- Build the application when practical.
- Inspect the actual rendered interface when browser tools are available.
- Check the mobile layout at approximately 320, 360, 390, and 430 CSS pixels.
- Check tablet and desktop layouts.
- Test important user interactions.
- Check for horizontal overflow.
- Inspect console errors and failed network requests when available.

These widths are test points, not the only supported viewport sizes.

If browser automation or screenshot inspection is unavailable, perform the available static and automated checks and clearly identify what remains unverified.

### Phase E — Refine

Look for:

- Misaligned elements.
- Inconsistent spacing.
- Poor text wrapping.
- Incorrect visual hierarchy.
- Oversized mobile components.
- Crowded navigation.
- Inadequate touch targets.
- Missing focus indicators.
- Broken loading states.
- Overlapping fixed elements.
- Unnecessary decoration.
- Performance regressions.

Correct the most important issues before declaring the task complete.

## 15. Visual Quality Review

Evaluate the result against these criteria.

| Category | Acceptance criteria |
|---|---|
| Visual identity | Clear, coherent, and appropriate to the actual product. |
| Hierarchy | Users can quickly identify important information and actions. |
| Typography | Readable, consistent, and correctly proportioned. |
| Spacing | Intentional, consistent, and visually balanced. |
| Mobile UX | Touch-friendly, responsive, and comfortable to navigate. |
| Desktop UX | Efficient use of available screen space. |
| Functionality | Relevant controls and workflows work correctly. |
| Accessibility | Semantic structure, focus, labels, and contrast are addressed. |
| Performance | No unnecessary dependencies or avoidable rendering costs. |
| Reliability | Loading, empty, success, and error states are handled appropriately. |
| Maintainability | Changes fit the existing architecture and design system. |

Do not treat this table as permission to ignore problems simply because most categories pass.

Fix significant defects even when the initial implementation appears visually impressive.

## 16. Rules for Existing Projects

When redesigning an existing application:

- Preserve working business logic.
- Preserve API contracts.
- Preserve existing routes unless a route change is required.
- Preserve authorization boundaries.
- Avoid modifying unrelated files.
- Avoid replacing real data with mock data.
- Avoid removing features merely to simplify the design.
- Avoid introducing unnecessary dependencies.
- Avoid breaking existing desktop workflows to improve mobile appearance.
- Explain significant architectural changes.

Prefer targeted improvements over unnecessary rewrites.

If a broader redesign is genuinely necessary, establish its scope before making extensive changes.

## 17. Completion Requirements

A task is not complete merely because code has been written.

Before reporting completion:

1. Summarize the important changes.
2. Identify the relevant files modified.
3. State which checks were performed.
4. Report any failed checks.
5. Identify any important behavior that remains unverified.
6. Mention any known limitations.

Never claim that a page was visually tested if it was not actually inspected.

Never claim that an application builds successfully without running the available build command or having equivalent verification evidence.

Never claim that all interactions work when they have not been tested.

The final result should demonstrate intentional design, functional completeness, responsive behavior, and engineering discipline.

## Final Principle

Design the experience for the person using the product, not for the screenshot.

A successful interface should feel coherent, distinctive, effortless to navigate, and appropriate to its device.

The objective is not to make every website look like a mobile app.

The objective is to make every application feel purpose-built for the screen, workflow, and person using it.