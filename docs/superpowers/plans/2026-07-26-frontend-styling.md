# Frontend Styling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Style the existing "Chat with Your Docs" frontend (currently unstyled — `App.css` isn't even imported) into a clean, modern SaaS look: light background, card-based panels, indigo accent, single stacked column, chat-bubble message list.

**Architecture:** CSS/markup-only pass. `index.css` holds design tokens (CSS custom properties) and a global reset; `App.css` holds shell layout (`.app` container, shared `.card` class); each component gets its own colocated CSS file (`UploadPanel.css`, `ChatPanel.css`) imported directly by that component. Chat bubbles and source-citation pills are achieved by styling the *existing* `MessageList`/`SourceCitations` markup (`ul`/`li`) via CSS selectors — those two files need zero JS/JSX changes.

**Tech Stack:** Plain CSS (no Tailwind/UI kit, no new dependencies), React (existing components), Vitest + Testing Library (existing tests, unmodified).

## Global Constraints

- CSS/markup-only changes — no new component logic, no new automated tests. Existing Vitest + Testing Library suites (`App.test.jsx`, `UploadPanel.test.jsx`, `ChatPanel.test.jsx`, `MessageList.test.jsx`, `SourceCitations.test.jsx`) must stay green, unmodified, after every task.
- No new dependencies — no Tailwind, no component library, no webfonts. System font stack only.
- No drag-and-drop upload behavior — visual dropzone-look only, click-to-browse via the existing `<input type="file">`.
- Design tokens (exact values, from `docs/superpowers/specs/2026-07-26-frontend-styling-design.md`):
  - Background `#f8fafc`, card background `#ffffff`, border `#e2e8f0`
  - Text `#0f172a` (headings), `#475569` (body/secondary)
  - Accent `#4f46e5`, accent hover `#4338ca`
  - Error `#dc2626`, success `#16a34a`
  - Card: `12px` border-radius, shadow `0 1px 3px rgba(0,0,0,0.06)`, `24px` padding
  - Page container: `max-width: 680px`, centered, `40px` vertical padding, `24px` gap between cards
  - Font: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

---

## File Structure

```
frontend/src/
  index.css                       # Modify: design tokens + reset (replaces scaffolded theme)
  App.css                         # Modify: shell layout + shared .card class (replaces unused scaffolded content)
  App.jsx                         # Modify: import './App.css' (currently missing)
  components/
    UploadPanel.jsx                # Modify: add card/dropzone classNames, import './UploadPanel.css'
    UploadPanel.css                # Create: dropzone + status styling
    ChatPanel.jsx                  # Modify: add card classNames, empty-state, import './ChatPanel.css'
    ChatPanel.css                  # Create: message bubbles, citation pills, input row, status styling
    MessageList.jsx                # No change (styled entirely via ChatPanel.css selectors)
    SourceCitations.jsx            # No change (styled entirely via ChatPanel.css selectors)
```

---

### Task 1: Design tokens and app shell

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/App.css`
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Produces: CSS custom properties on `:root` (`--color-bg`, `--color-card`, `--color-border`, `--color-text`, `--color-text-secondary`, `--color-accent`, `--color-accent-hover`, `--color-error`, `--color-success`, `--shadow-card`, `--font-sans`) and a `.card` class, both consumed by `UploadPanel.css` (Task 2) and `ChatPanel.css` (Task 3).

- [ ] **Step 1: Replace `frontend/src/index.css`**

```css
:root {
  --color-bg: #f8fafc;
  --color-card: #ffffff;
  --color-border: #e2e8f0;
  --color-text: #0f172a;
  --color-text-secondary: #475569;
  --color-accent: #4f46e5;
  --color-accent-hover: #4338ca;
  --color-error: #dc2626;
  --color-success: #16a34a;
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.06);
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-text-secondary);
  font-family: var(--font-sans);
}
```

- [ ] **Step 2: Replace `frontend/src/App.css`**

```css
.app {
  max-width: 680px;
  margin: 0 auto;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.app h1 {
  text-align: center;
  font-size: 28px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 8px;
}

.card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  padding: 24px;
}
```

- [ ] **Step 3: Import `App.css` in `frontend/src/App.jsx`**

```jsx
import './App.css';
import { UploadPanel } from './components/UploadPanel';
import { ChatPanel } from './components/ChatPanel';

function App() {
  return (
    <div className="app">
      <h1>Chat with Your Docs</h1>
      <UploadPanel />
      <ChatPanel />
    </div>
  );
}

export default App;
```

- [ ] **Step 4: Run the existing App test to confirm nothing broke**

Run: `cd frontend && npx vitest run src/App.test.jsx`
Expected: PASS (3 assertions: heading, upload label, chat placeholder — unchanged by this task)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/index.css frontend/src/App.css frontend/src/App.jsx
git commit -m "style(frontend): add design tokens and app shell layout"
```

---

### Task 2: Upload panel styling

**Files:**
- Modify: `frontend/src/components/UploadPanel.jsx`
- Create: `frontend/src/components/UploadPanel.css`

**Interfaces:**
- Consumes: `--color-*`, `--font-sans`, `.card` (Task 1).
- No change to `UploadPanel`'s props or exported behavior — `onUploaded` callback and `status`/`error` state machine are untouched.

- [ ] **Step 1: Replace `frontend/src/components/UploadPanel.jsx`**

```jsx
import { useState } from 'react';
import { uploadDocument } from '../api/client';
import './UploadPanel.css';

export function UploadPanel({ onUploaded }) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  async function handleChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    setStatus('loading');
    setError(null);

    try {
      const result = await uploadDocument(file);
      setStatus('done');
      onUploaded?.(result);
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  }

  return (
    <div className="upload-panel card">
      <div className="upload-dropzone">
        <label htmlFor="file-upload" className="upload-label">Upload a document</label>
        <input
          id="file-upload"
          type="file"
          onChange={handleChange}
          disabled={status === 'loading'}
          className="upload-input"
        />
      </div>
      {status === 'loading' && (
        <p role="status" className="upload-status upload-status-loading">Uploading and indexing...</p>
      )}
      {status === 'error' && (
        <p role="alert" className="upload-status upload-status-error">{error}</p>
      )}
      {status === 'done' && (
        <p role="status" className="upload-status upload-status-done">Document indexed.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/UploadPanel.css`**

```css
.upload-dropzone {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  padding: 16px;
}

.upload-label {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text);
}

.upload-input {
  font-family: var(--font-sans);
  font-size: 14px;
}

.upload-status {
  margin: 12px 0 0;
  font-size: 14px;
  padding-left: 10px;
  border-left: 3px solid transparent;
}

.upload-status-loading {
  color: var(--color-accent);
  border-left-color: var(--color-accent);
}

.upload-status-loading::before {
  content: '⏳ ';
}

.upload-status-error {
  color: var(--color-error);
  border-left-color: var(--color-error);
}

.upload-status-error::before {
  content: '⚠ ';
}

.upload-status-done {
  color: var(--color-success);
  border-left-color: var(--color-success);
}

.upload-status-done::before {
  content: '✓ ';
}
```

- [ ] **Step 3: Run the existing UploadPanel test to confirm nothing broke**

Run: `cd frontend && npx vitest run src/components/UploadPanel.test.jsx`
Expected: PASS (2 tests: loading→done text, loading→error text — `getByLabelText`/`findByText` still resolve since the `label`/`input` pairing and status paragraph text content are unchanged)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/UploadPanel.jsx frontend/src/components/UploadPanel.css
git commit -m "style(frontend): style upload panel as a card with dropzone look"
```

---

### Task 3: Chat panel, message bubbles, and citation pills

**Files:**
- Modify: `frontend/src/components/ChatPanel.jsx`
- Create: `frontend/src/components/ChatPanel.css`

**Interfaces:**
- Consumes: `--color-*`, `--font-sans`, `.card` (Task 1); the existing `.message-list` / `.message.message-user` / `.message.message-assistant` / `.source-citations` class names already rendered by `MessageList.jsx` (Task 15 of the original plan) and `SourceCitations.jsx` — those two files are not modified in this task, only targeted by CSS selectors here.
- No change to `ChatPanel`'s state machine (`idle`/`loading`/`error`) or `sendQuery` usage.

- [ ] **Step 1: Replace `frontend/src/components/ChatPanel.jsx`**

```jsx
import { useState } from 'react';
import { sendQuery } from '../api/client';
import { MessageList } from './MessageList';
import './ChatPanel.css';

export function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;

    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setStatus('loading');
    setError(null);

    try {
      const { answer, sources } = await sendQuery(question);
      setMessages((prev) => [...prev, { role: 'assistant', content: answer, sources }]);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  }

  return (
    <div className="chat-panel card">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <p className="chat-empty">Ask a question about your uploaded documents</p>
        ) : (
          <MessageList messages={messages} />
        )}
      </div>
      {status === 'loading' && (
        <p role="status" className="chat-status chat-status-loading">Thinking...</p>
      )}
      {status === 'error' && (
        <p role="alert" className="chat-status chat-status-error">{error}</p>
      )}
      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your documents"
          disabled={status === 'loading'}
          className="chat-input"
        />
        <button type="submit" disabled={status === 'loading'} className="chat-send">Send</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/ChatPanel.css`**

```css
.chat-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-messages {
  max-height: 420px;
  overflow-y: auto;
}

.chat-empty {
  color: var(--color-text-secondary);
  font-size: 14px;
  text-align: center;
  margin: 0;
  padding: 24px 0;
}

.message-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.4;
}

.message p {
  margin: 0;
}

.message-user {
  align-self: flex-end;
  background: var(--color-accent);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message-assistant {
  align-self: flex-start;
  background: #f1f5f9;
  color: var(--color-text);
  border-bottom-left-radius: 4px;
}

.source-citations {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.source-citations li {
  background: rgba(79, 70, 229, 0.1);
  color: var(--color-accent-hover);
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 12px;
}

.chat-status {
  margin: 0;
  font-size: 14px;
  padding-left: 10px;
  border-left: 3px solid transparent;
}

.chat-status-loading {
  color: var(--color-accent);
  border-left-color: var(--color-accent);
}

.chat-status-error {
  color: var(--color-error);
  border-left-color: var(--color-error);
}

.chat-form {
  display: flex;
  gap: 8px;
}

.chat-input {
  flex-grow: 1;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  font-family: var(--font-sans);
}

.chat-input:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
}

.chat-send {
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  background: var(--color-accent);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: var(--font-sans);
}

.chat-send:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.chat-send:disabled,
.chat-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

- [ ] **Step 3: Run the existing ChatPanel test to confirm nothing broke**

Run: `cd frontend && npx vitest run src/components/ChatPanel.test.jsx`
Expected: PASS (2 tests: submit→answer with sources, submit→error text — `getByPlaceholderText`, `getByRole('button', { name: /send/i })`, and message text lookups are all unaffected by the added wrapper `div`/classNames)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ChatPanel.jsx frontend/src/components/ChatPanel.css
git commit -m "style(frontend): add chat bubbles, citation pills, and empty state"
```

---

### Task 4: Full regression check and manual verification

**Files:** None (verification only).

- [ ] **Step 1: Run the full frontend test suite**

Run: `cd frontend && npx vitest run`
Expected: PASS — all 6 test files, all 12 tests (same count as before this plan; no tests added or removed)

- [ ] **Step 2: Manual visual verification in a browser**

With the frontend dev server running (`npm run dev` in `frontend/`, default `http://localhost:5173`), reload the page and confirm:
- Page has a light `#f8fafc` background, centered column, max ~680px wide
- Upload panel and chat panel render as two white bordered/shadowed cards with a gap between them
- Upload panel shows a dashed-border box around the label + file input
- Chat panel shows the empty-state placeholder text before any message is sent
- Submitting a question renders the user message as a right-aligned indigo bubble and (once a response arrives, or the error state on failure) shows the corresponding styled status line
- Loading/error text on both panels is colored (indigo for loading, red for error) and left-bordered, not plain black text

- [ ] **Step 3: Report**

No commit needed for this task (verification only). If Step 1 or Step 2 reveals a regression, fix it as part of the task that introduced it (Task 1, 2, or 3) rather than patching here.

---

## Self-Review Notes

- **Spec coverage:** design tokens (Task 1), app shell/card layout (Task 1), upload panel dropzone + status styling (Task 2), chat bubbles + citation pills + empty state + input row (Task 3), "no new tests" + "existing tests stay green" (verified at the end of every task, confirmed again in Task 4).
- **Placeholder scan:** no TBDs; every step has the literal file content to write.
- **Markup-safety check:** `MessageList.jsx` and `SourceCitations.jsx` are intentionally left unmodified — the bubble/pill look is achieved by styling their existing `.message-list` / `.message` / `.source-citations` class names from `ChatPanel.css`, so none of the five existing frontend test files' selectors (`getByLabelText`, `getByPlaceholderText`, `getByRole`, `getByText` with exact strings) can be affected by this plan.
