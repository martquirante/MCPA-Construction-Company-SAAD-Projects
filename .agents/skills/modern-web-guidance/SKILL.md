---
name: modern-web-guidance
description: Best practices, modern Web platform APIs, and architectural patterns for modern web development. Covers modern CSS (container queries, @starting-style, :has(), :user-invalid, color spaces, subgrid, anchor positioning), native HTML/Web APIs (<dialog>, Popover, View Transitions, field-sizing), Core Web Vitals, performance optimization, accessibility, and clean web standards. Use when designing, building, modernizing, or refactoring web applications, UI components, responsive layouts, or web performance.
---

# Modern Web Guidance & Web Platform Standards

## 1. Mission and Philosophy

Prioritize native web platform capabilities, modern APIs, and clean web standards over outdated patterns, legacy polyfills, and unnecessary third-party runtime dependencies.

Modern browsers provide powerful built-in primitives that are faster, more accessible, and easier to maintain than custom JavaScript workarounds.

---

## 2. Modern CSS & Layout Patterns

### Container Queries
Design responsive components relative to their parent container rather than viewport dimensions:
```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 480px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}
```

### Relational & Pseudo Selectors
- **`:has()`**: Parent-aware styling without JavaScript listeners (e.g., `form:has(:invalid) button[type="submit"] { opacity: 0.6; }`).
- **`:user-invalid` / `:user-valid`**: Validate form inputs only after user interaction, preventing premature validation errors while typing.
- **`:not()` / `:is()` / `:where()`**: Flatten specificity and simplify complex selector rules.

### CSS Subgrid
Align child elements across nested grid layouts without flattening markup structure:
```css
.grid-item {
  display: grid;
  grid-template-rows: subgrid;
}
```

### Modern Color Spaces & Theming
- Use `oklch()` for perceptually uniform colors and accessible contrast calculations.
- Use `color-mix()` for dynamic tints, shades, and opacity states:
  ```css
  background-color: color-mix(in srgb, var(--primary) 15%, transparent);
  ```
- Use `light-dark()` for concise system theme adaptation:
  ```css
  color: light-dark(#1a1a1a, #f5f5f5);
  ```

### Typography & Form Controls
- **`text-wrap: balance`**: For headlines and titles to avoid single-word orphan lines.
- **`text-wrap: pretty`**: For body text paragraphs to optimize typographic line breaks.
- **`field-sizing: content`**: Auto-growing form inputs and textareas without JavaScript resize event handlers.

---

## 3. Native UI Primitives

### Native Modal & Non-Modal Dialogs (`<dialog>`)
Use standard `<dialog>` with `.showModal()` for built-in focus trapping, `Escape` key handling, and `::backdrop` styling:
```html
<dialog id="confirmDialog" class="modal">
  <h2>Confirm Action</h2>
  <p>Are you sure you want to proceed?</p>
  <button id="cancelBtn" value="cancel" formmethod="dialog">Cancel</button>
  <button id="confirmBtn" value="confirm" class="btn-primary">Confirm</button>
</dialog>
```

### Popover API
Use declarative popovers for menus, tooltips, and flyouts without custom z-index or click-outside managers:
```html
<button popovertarget="my-menu">Actions</button>
<div id="my-menu" popover>
  <ul>
    <li><a href="#edit">Edit</a></li>
    <li><a href="#delete">Delete</a></li>
  </ul>
</div>
```

### CSS `@starting-style` & Discrete Transitions
Animate entrance and exit states for elements transitioning from `display: none` or top layer (`dialog`, `popover`):
```css
dialog[open] {
  opacity: 1;
  transform: scale(1);
  transition: opacity 0.2s ease, transform 0.2s ease, display 0.2s allow-discrete;
}

@starting-style {
  dialog[open] {
    opacity: 0;
    transform: scale(0.95);
  }
}
```

---

## 4. Web Performance & Optimization

- **Interaction to Next Paint (INP)**: Break long tasks into chunks using `await scheduler.yield()` to yield control back to the browser main thread.
- **Speculative Loading**: Use Speculation Rules API (`<script type="speculationrules">`) to prerender high-confidence navigation links before click.
- **Efficient Rendering**:
  - `content-visibility: auto`: Defer rendering off-screen DOM nodes to drastically reduce initial layout cost.
  - `IntersectionObserver`: Defer heavy media loading and scroll-triggered animations.
  - `AbortController`: Cancel pending asynchronous operations and fetch requests on component unmount or state changes.

---

## 5. Accessibility (A11y) & Core UX Standards

- **Semantic HTML**: Use native semantic elements (`<main>`, `<nav>`, `<article>`, `<section>`, `<button>`) before reaching for custom `<div>` solutions with ARIA roles.
- **Keyboard Navigation & Inertness**: Use `inert` attribute to completely disable inactive background sections and prevent focus leakage during overlays.
- **User Preference Media Queries**:
  - `prefers-reduced-motion`: Respect user motion sensitivity with simplified transitions.
  - `prefers-contrast`: Provide enhanced contrast when requested by the OS.
  - `prefers-color-scheme`: Provide appropriate light and dark themes.

