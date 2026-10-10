# Design System

## Mode

The application is dark mode only. Do not add light mode, automatic color-scheme switching, or light backgrounds unless explicitly requested.

## Color Palette

Use blue tones as the primary visual identity.

- App background: `#07111f`
- Surface: `#0d1b2f`
- Elevated surface: `#13233a`
- Primary blue: `#3b82f6`
- Primary blue hover: `#2563eb`
- Secondary cyan: `#38bdf8`
- Accent indigo: `#818cf8`
- Text primary: `#e5eefb`
- Text secondary: `#9fb3c8`
- Border: `#22344f`
- Success: `#22c55e`
- Warning: `#f59e0b`
- Error: `#ef4444`

## Typography

- Use the system sans-serif stack defined in `src/index.css`.
- Use strong weights only for page titles, card values, and primary totals.
- Do not scale font size with viewport width.
- Keep dashboard and form text compact enough for repeated daily use.

## Spacing

- Base spacing unit follows Material UI spacing.
- Mobile pages should use 16px horizontal padding.
- Desktop pages should use a constrained `lg` container.
- Cards and panels should use 16px to 24px internal padding depending on viewport.

## Shape And Elevation

- Use 8px to 16px radius depending on element size.
- Prefer borders and subtle shadows over heavy elevation.
- Cards should not be nested inside decorative cards.

## Components

- Buttons use the primary blue theme color.
- Inputs use filled or outlined Material UI fields with dark surfaces.
- Navigation uses clear active states and icon + text labels.
- Summary cards use concise labels and prominent values.
- Progress indicators use blue or semantic colors only when the status requires it.
