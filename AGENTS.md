# Project Instructions

## Visual Design Rules

- Respect the project's dark-mode visual system. Do not introduce light mode unless explicitly requested.
- Primary colors must be blue tones. Use the Material UI theme in `src/theme.js` as the source of truth.
- Do not redesign the application unless explicitly requested. Prefer small, incremental UI changes.
- Preserve existing layout intent, spacing rhythm, navigation structure, and component hierarchy.
- Use Material UI components and theme tokens instead of hardcoded colors whenever practical.
- Keep interfaces compact, readable, and application-focused. Avoid marketing-style heroes, decorative gradients, and oversized sections.
- Mobile and desktop layouts must both be considered before finishing UI work.
- Tables should have an alternate mobile presentation when horizontal scrolling would hurt usability.
- Forms should remain usable on small screens, with fields stacking cleanly.

## Change Scope

- Keep UI changes limited to the requested feature.
- Do not rename visible labels unless asked.
- Do not change navigation structure unless required.
- If a visual rule is unclear, ask before making broad visual changes.

## Verification

- Run `npm run lint` after code changes.
- Run `npm run build` after UI or routing changes.
- If the dev server is running, keep the user-facing URL current.
