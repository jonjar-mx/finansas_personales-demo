# UI Patterns

## Layout

- Use `Layout` for all pages.
- Keep content inside the shared `Container maxWidth="lg"`.
- Page sections should be full-width within the container, not floating decorative blocks.

## Header

- Header remains sticky.
- Brand area stays left on desktop and first row on mobile.
- Navigation uses the existing routes: Dashboard and Transactions.
- Active navigation state must remain visible.

## Dashboard

- The month selector stays near the page title.
- Monthly totals appear before detailed budgets.
- Budget cards use a responsive grid: one column on mobile, two or more columns on larger screens.
- Each budget card must show category, spent amount, total budget, remaining amount, status, and progress.

## Transactions

- Desktop uses a table.
- Mobile uses stacked transaction cards.
- The transaction form stacks on mobile and uses multiple columns on desktop.
- Amounts should be right-aligned in tables and visually prominent in mobile cards.

## Responsiveness

- Mobile breakpoint behavior must be intentional, not accidental overflow.
- Avoid horizontal scrolling except for intentionally scrollable navigation.
- Long descriptions should wrap safely.
- Buttons must remain large enough to tap on mobile.
