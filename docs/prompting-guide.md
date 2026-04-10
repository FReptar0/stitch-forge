# Stitch Prompting Guide

## Core Framework: Zoom-Out-Zoom-In

### Zoom Out (Context)
- Product name and what it does
- Target user/audience
- Overall aesthetic direction

### Zoom In (Specifics)
- Exact page type (landing page, dashboard, pricing page)
- Goal of this screen
- Layout hierarchy
- Key sections with brief descriptions

## Initial Prompt Structure

```
A [adjective] [page type] for "[Product Name]," a [product description].
[Target user context]. [Visual tone].

Include these sections:
1. [Section with brief description]
2. [Section with brief description]
...
```

### Example
```
A modern, clean landing page for "Acme," a project management SaaS
for remote teams. Designed for startup founders and team leads.
Minimal, professional, indigo and white.

Include these sections:
1. Hero with value proposition and demo CTA
2. Three-column services grid with icons
3. Client logo strip (6 logos)
4. Testimonial slider
5. Contact form with phone and email fields
```

## Refinement Prompt Structure

```
On the [specific section] of [screen name], [specific change]:
- [Detail 1]
- [Detail 2]
```

### Example
```
On the hero section of homepage, change the CTA button:
- Background color to #F5A623
- Text to "Schedule a Demo"
- Add a subtle drop shadow
```

## Critical Rules

1. **One screen per prompt** — Never generate multiple screens at once
2. **One change per refinement** — Never combine layout + content + style changes
3. **Max 5000 characters** — Longer prompts cause Stitch to omit components
4. **Be specific** — "primary CTA button on hero section" not "the button"
5. **No vague requests** — "make it better" fails. Say exactly what and how
6. **Reference elements** — Use UI/UX vocabulary: "bento grid", "sticky header", "card layout"
7. **Multi-screen consistency** — Prefix with "Following the same design language as the homepage..."

## Localization

Apply AFTER layout is established, as a separate refinement:
```
Switch all text content to Spanish.
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| "Create homepage and about page" | Generate one screen per prompt |
| "Make the hero bigger and change colors and add animation" | One change at a time |
| "Design a beautiful website" | Specify: page type, sections, aesthetic |
| "Fix the layout" | Say which element, what's wrong, what you want |
| 6000+ char prompt | Break into initial + refinement prompts |
