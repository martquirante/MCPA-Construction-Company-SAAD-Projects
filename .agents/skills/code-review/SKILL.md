---
name: code-review
description: Triggers when reviewing existing code, implementing features, refactoring, debugging, or modifying application code. Focuses on correctness, maintainability, security, performance, accessibility, responsive behavior, regression prevention, and clean architecture. Reviews before changing code and avoids unnecessary rewrites.
---

# Code Review Standards

## 1. Core Principle

Act as a senior software engineer performing a production-level code review.

The goal is NOT to rewrite everything.

The goal is to:

- identify real problems
- prevent regressions
- preserve working functionality
- improve maintainability
- improve security
- improve performance
- improve accessibility
- reduce unnecessary complexity
- keep the codebase consistent

Prefer simple, maintainable solutions over clever solutions.

Do not make changes simply because a different implementation looks cleaner.

---

# 2. Inspect Before Editing

Before modifying code:

1. Inspect the relevant files.
2. Understand the project structure.
3. Identify the framework and architecture.
4. Identify reusable components.
5. Identify existing utilities.
6. Identify existing design tokens.
7. Understand data flow.
8. Understand API interactions.
9. Understand authentication and authorization.
10. Identify dependencies.
11. Determine the smallest safe change.

Do NOT immediately rewrite files.

Do NOT assume the existing implementation is wrong.

---

# 3. Preserve Existing Functionality

When modifying code, preserve working:

- routes
- navigation
- authentication
- authorization
- forms
- API calls
- database interactions
- validation
- business logic
- state management
- existing user flows

A visual redesign must not accidentally break functionality.

A refactor must not change behavior unless explicitly required.

---

# 4. Minimal Change Principle

Prefer the smallest change that solves the actual problem.

Avoid unrelated modifications such as:

- changing unrelated components
- renaming unrelated variables
- restructuring the entire project
- replacing libraries without justification
- rewriting working APIs
- changing backend architecture during frontend work
- adding unnecessary dependencies

Do not perform large rewrites unless there is a clear technical reason.

---

# 5. Architecture Review

Check whether the implementation has:

- clear separation of concerns
- reusable components
- reasonable file organization
- predictable data flow
- maintainable state management
- appropriate abstraction
- clear naming

Avoid:

- giant components
- deeply nested conditional rendering
- duplicated business logic
- duplicated API logic
- duplicated UI markup
- excessive prop drilling
- unnecessary global state

Do not over-abstract simple code.

---

# 6. Component Review

For frontend components, check:

- responsibility
- reusability
- readability
- state handling
- prop design
- error handling
- loading behavior
- responsive behavior
- accessibility

If several components implement the same UI pattern, consider creating a shared component.

Examples:

- Button
- Input
- Modal
- Badge
- Card
- FormField
- NavigationItem
- ProjectCard
- EmptyState
- LoadingState

Do not create abstractions for components that have no meaningful reuse.

---

# 7. UI/UX Regression Review

When frontend code changes, verify:

### Layout

- alignment
- spacing
- container widths
- responsive behavior
- overflow
- grid behavior

### Typography

- hierarchy
- line height
- text wrapping
- readability

### Components

- buttons
- inputs
- cards
- badges
- navigation
- dialogs
- tables
- icons

### Interaction

- hover
- focus
- active
- disabled
- loading
- success
- error

Do not treat visual polish as more important than usability.

---

# 8. Anti-Vibe-Coded Review

Flag unnecessary UI patterns such as:

- excessive pill-shaped elements
- excessive rounded cards
- excessive gradients
- excessive shadows
- excessive glassmorphism
- glowing borders
- unnecessary animations
- animated backgrounds
- floating decorative elements
- oversized icons
- random icon styles
- repeated card layouts
- unnecessary badges
- decorative elements with no purpose

Do not recommend adding visual effects simply to make the interface look "modern".

If the interface feels generic, improve:

- hierarchy
- spacing
- typography
- composition
- information architecture
- consistency

instead of adding more decoration.

---

# 9. Design System Consistency

Check for inconsistent:

- colors
- spacing
- typography
- border radius
- shadows
- button styles
- input heights
- icon sizes
- transitions
- container widths

Prefer existing design tokens.

Do not introduce a second design system when one already exists.

If a design system exists, extend it rather than bypassing it.

---

# 10. Accessibility Review

Check:

- semantic HTML
- keyboard navigation
- focus visibility
- color contrast
- screen-reader usability
- form labels
- button semantics
- link semantics
- alt text
- ARIA usage
- reduced motion

Prefer:

```html
<button>