---
name: design-standards
description: Visual quality bar — spacing, type, contrast, accessibility.
---

# Design Standards

Every component you ship must meet these bars.

## Spacing
- Page gutters: `px-6` on mobile, `px-8` on tablet, `px-12` on desktop.
- Section spacing: `py-16` for hero, `py-12` for standard sections.
- Stack spacing: `space-y-4` for content, `space-y-6` for cards, `space-y-8` for major blocks.

## Type
- Headings use `font-semibold` or `font-bold`, body stays `font-normal`.
- Line height: `leading-tight` for headings, `leading-relaxed` for paragraphs.
- Tracking: `tracking-tight` on large headings only.

## Color
- Primary action: `bg-blue-600 hover:bg-blue-700 text-white`.
- Secondary action: `bg-gray-100 hover:bg-gray-200 text-gray-900`.
- Destructive: `bg-red-600 hover:bg-red-700 text-white`.
- Never use pure black or pure white for text — use `text-gray-900` / `text-gray-50`.

## Accessibility
- Every interactive element has a visible `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`.
- Buttons without visible text need `aria-label`.
- Form inputs always have an associated `<label>`.
- Contrast ratio ≥ 4.5:1 for body text, ≥ 3:1 for large headings.
