# Frontend Styling Design

## Context

The frontend (`UploadPanel`, `ChatPanel`, `MessageList`, `SourceCitations`, `App`) was
built with zero CSS — `App.jsx` never imports `App.css`, and none of the components
have class-specific styles. The result is raw, unstyled form controls stacked on the
browser default background, with no visual separation between the upload and chat
sections. This spec covers a CSS/markup-only pass to make it look like a finished
"clean modern SaaS" product: light background, card-based panels, indigo accent,
single stacked column layout.

**Out of scope:** no new components, no new behavior/logic, no new dependencies
(no Tailwind/UI kit — plain CSS, consistent with the project's free-tier/keep-it-simple
constraint), no drag-and-drop upload, no new automated tests (existing tests assert
behavior — loading/error/success states, form submission — not styling, and must
stay green unchanged).

## Design tokens

- Background: `#f8fafc` (slate-50)
- Page container: centered column, `max-width: 680px`, `40px` vertical padding
- Cards: white background, `1px solid #e2e8f0` border, `12px` border-radius,
  shadow `0 1px 3px rgba(0,0,0,0.06)`, `24px` internal padding
- Accent (indigo): `#4f46e5`, hover `#4338ca` — used for primary buttons, focus
  rings, links, and user-message bubbles
- Text: headings `#0f172a` (slate-900), body/secondary `#475569` (slate-600),
  error `#dc2626` (red-600), success `#16a34a` (green-600)
- Font: system font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  sans-serif`) — no webfont, keeps the app dependency-free
- Gap between the two top-level cards: `24px`

## App shell (`App.jsx` / `index.css`)

- `<h1>` centered, `28px`, semibold, slate-900, `32px` bottom margin
- Two cards stacked vertically in document order: `UploadPanel` then `ChatPanel`,
  `24px` gap between them
- `index.css` sets the page background and base typography; a new
  `App.css` (replacing the unused scaffolded one) holds the shell layout

## Upload panel (`UploadPanel.jsx`)

- Rendered as a card (see tokens above)
- The label (`Upload a document`) becomes a small heading above the control,
  not inline text butting against the native file input
- The raw `<input type="file">` stays functionally the same (click-to-browse,
  same `id`/`htmlFor` pairing the existing tests rely on via `getByLabelText`)
  but gets a styled wrapper: a dashed-border dropzone-look box containing the
  label text and a styled "Choose File" affordance — no drag-and-drop behavior,
  purely a visual treatment around the existing input
- Status line below the control, switching by state (all existing `role`
  attributes unchanged so tests keep passing):
  - idle: nothing rendered (as today)
  - loading (`role="status"`): indigo spinner (small CSS-only spinner) + "Uploading and indexing..."
  - error (`role="alert"`): red text, left-bordered in red
  - done (`role="status"`): green checkmark + "Document indexed."

## Chat panel (`ChatPanel.jsx` / `MessageList.jsx` / `SourceCitations.jsx`)

- Rendered as a card, taller than the upload card, with an internal scrollable
  message area (`max-height: 420px; overflow-y: auto`) so long conversations
  don't push the input off-screen
- Empty state: when `messages.length === 0`, render a single muted placeholder
  line ("Ask a question about your uploaded documents") inside the message
  area instead of an empty `<ul>` — new conditional render in `ChatPanel.jsx`,
  no new test needed (purely presentational, no state/logic branch)
- Messages render as chat bubbles instead of a plain bulleted list:
  - user messages: right-aligned, indigo-filled bubble, white text
  - assistant messages: left-aligned, light-gray (`#f1f5f9`) bubble, slate-900 text
  - each bubble has `border-radius: 16px` with the corner nearest the
    conversation edge slightly squared (`4px`) for a chat-app feel
- `SourceCitations` renders as small pill-style tags (rounded, light indigo
  background, small font) laid out in a horizontal wrapping row beneath an
  assistant bubble, replacing the current bullet list — markup changes from
  `<ul><li>` to a `<div>` of `<span>` pills; text content per citation stays
  the same (`[n] filename (chunk N, similarity X.XX)`) so existing test
  assertions (`getByText(/geo\.txt/)`, `getByText(/0\.87/)`) still match
- Input row pinned to the bottom of the card: text input (flex-grow) + indigo
  "Send" button, both disabled/grayed while `status === 'loading'` (existing
  behavior, just styled)
- Loading/error text (`role="status"` / `role="alert"`) styled consistently
  with the upload panel's versions

## Data flow / error handling

No changes — this is a pure presentation-layer pass. All existing state
machines (`idle` → `loading` → `done`/`error`) in `UploadPanel` and `ChatPanel`
are untouched.

## Testing

- No new tests. Existing Vitest + Testing Library suites
  (`App.test.jsx`, `UploadPanel.test.jsx`, `ChatPanel.test.jsx`,
  `MessageList.test.jsx`, `SourceCitations.test.jsx`) assert on text content,
  roles, and labels — not on class names or computed styles — so they must
  still pass unmodified after this change.
- Manual verification: reload the already-running dev server in a browser
  and visually confirm the card layout, bubble alignment, and state styling
  (loading/error/done) render as designed.
