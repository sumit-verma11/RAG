# Chat with Your Docs (RAG) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack "chat with your documents" RAG app: upload documents, extract/chunk/embed them into Supabase pgvector, then answer questions using only retrieved chunks via Gemini, with citations.

**Architecture:** Vite+React frontend talks to an Express backend over REST. Ingest path: extract text (pdfjs-dist + tesseract.js OCR fallback / mammoth / native fs) → chunk (~500 words, ~50 overlap) → embed (Gemini `text-embedding-004`) → store in Supabase (`documents` table, pgvector). Query path: embed question → `match_documents` similarity search → grounded prompt → Gemini `gemini-1.5-flash` → answer + sources.

**Tech Stack:** Node + Express (ESM), Vite + React (JS), pdfjs-dist, tesseract.js, mammoth, canvas, multer, @google/generative-ai, @supabase/supabase-js, Vitest + Supertest (backend), Vitest + @testing-library/react (frontend).

## Global Constraints

- Free tier only — never introduce a paid API or service (`CLAUDE.md` → Tech stack).
- Answers must be grounded in retrieved chunks and show sources; if context lacks the answer, respond exactly `"I don't know based on the provided documents."` instead of guessing (`CLAUDE.md` → Conventions).
- Every network call in the frontend needs explicit loading and error states (`CLAUDE.md` → Conventions).
- Gemini embedding calls must be batched with retry/backoff for rate limits (`CLAUDE.md` → Conventions).
- `.env` files are gitignored in both apps; `.env.example` is kept up to date in both apps (`CLAUDE.md` → Environment variables).
- Test each phase end-to-end before moving to the next (`CLAUDE.md` → Conventions, Build order).
- Backend env vars: `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`. Frontend env var: `VITE_API_URL`.
- Embeddings: `text-embedding-004` (768 dimensions). LLM: `gemini-1.5-flash`. Vector DB: Supabase Postgres + pgvector.

---

## File Structure

```
/backend
  src/
    config.js
    app.js                       # express app (exported, no listen)
    server.js                    # imports app, calls listen
    extraction/
      plainTextExtract.js
      docxExtract.js
      pdfExtract.js
      extractText.js             # dispatcher by extension
    chunking/
      chunkText.js
    embeddings/
      geminiEmbeddings.js
    chat/
      geminiChat.js
    vectorstore/
      supabaseClient.js
      documentsStore.js
    routes/
      health.js
      ingest.js
      query.js
    middleware/
      errorHandler.js
  supabase/
    schema.sql
  test/                          # mirrors src/
  uploads/                       # multer tmp dir, gitignored
  package.json
  .env.example

/frontend
  src/
    api/
      client.js
    components/
      UploadPanel.jsx
      ChatPanel.jsx
      MessageList.jsx
      SourceCitations.jsx
    App.jsx
    main.jsx
  package.json
  .env.example

.gitignore
CLAUDE.md
```

---

### Task 1: Backend scaffold + health endpoint

**Files:**
- Create: `.gitignore` (repo root)
- Create: `backend/package.json`
- Create: `backend/.env.example`
- Create: `backend/src/config.js`
- Create: `backend/src/app.js`
- Create: `backend/src/server.js`
- Create: `backend/src/routes/health.js`
- Test: `backend/test/health.test.js`

**Interfaces:**
- Produces: `config` object `{ port, geminiApiKey, supabaseUrl, supabaseServiceKey }` exported from `backend/src/config.js`, imported by every later backend module that needs env vars.
- Produces: `app` (Express instance) exported as default from `backend/src/app.js`, imported by `server.js` and by every route test via supertest.

- [ ] **Step 1: Create root `.gitignore`**

```
node_modules/
.env
dist/
uploads/
```

- [ ] **Step 2: Init backend project and install deps**

```bash
mkdir -p backend/src/routes backend/test
cd backend
npm init -y
npm pkg set type="module"
npm install express cors dotenv morgan
npm install -D vitest supertest
```

- [ ] **Step 3: Add npm scripts**

Edit `backend/package.json`, add to `"scripts"`:

```json
"scripts": {
  "start": "node src/server.js",
  "dev": "node --watch src/server.js",
  "test": "vitest run"
}
```

- [ ] **Step 4: Write `backend/.env.example`**

```
PORT=4000
GEMINI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
```

- [ ] **Step 5: Write `backend/src/config.js`**

```javascript
import 'dotenv/config';

export const config = {
  port: process.env.PORT || 4000,
  geminiApiKey: process.env.GEMINI_API_KEY,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
};
```

- [ ] **Step 6: Write the failing test for the health endpoint**

`backend/test/health.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `cd backend && npx vitest run test/health.test.js`
Expected: FAIL — cannot find module `../src/app.js`

- [ ] **Step 8: Implement `backend/src/routes/health.js`**

```javascript
import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});
```

- [ ] **Step 9: Implement `backend/src/app.js`**

```javascript
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { healthRouter } from './routes/health.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(healthRouter);

export default app;
```

- [ ] **Step 10: Implement `backend/src/server.js`**

```javascript
import app from './app.js';
import { config } from './config.js';

app.listen(config.port, () => {
  console.log(`Backend listening on port ${config.port}`);
});
```

- [ ] **Step 11: Run test to verify it passes**

Run: `cd backend && npx vitest run test/health.test.js`
Expected: PASS

- [ ] **Step 12: Commit**

```bash
git add .gitignore backend/package.json backend/package-lock.json backend/.env.example backend/src backend/test
git commit -m "feat(backend): scaffold express app with health endpoint"
```

---

### Task 2: Frontend scaffold + smoke test

**Files:**
- Create: `frontend/` (via Vite scaffold)
- Create: `frontend/.env.example`
- Test: `frontend/src/App.test.jsx`

**Interfaces:**
- Produces: `frontend/src/App.jsx` default export, wired up in Task 16 with real panels.

- [ ] **Step 1: Scaffold Vite React app non-interactively**

```bash
cd /Volumes/Projects/RAG
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: Configure Vitest in `frontend/vite.config.js`**

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
});
```

- [ ] **Step 3: Create `frontend/src/setupTests.js`**

```javascript
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Add test script**

Edit `frontend/package.json`, add to `"scripts"`: `"test": "vitest run"`

- [ ] **Step 5: Write `frontend/.env.example`**

```
VITE_API_URL=http://localhost:4000
```

- [ ] **Step 6: Write the failing smoke test**

`frontend/src/App.test.jsx`:

```javascript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the app heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run test to verify it fails or passes against default scaffold**

Run: `cd frontend && npx vitest run src/App.test.jsx`
Expected: default Vite template has no `<h1>`, so this FAILs — confirms the test is exercising real render output.

- [ ] **Step 8: Replace `frontend/src/App.jsx` with a minimal placeholder heading**

```jsx
function App() {
  return (
    <div className="app">
      <h1>Chat with Your Docs</h1>
    </div>
  );
}

export default App;
```

- [ ] **Step 9: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/App.test.jsx`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add frontend
git commit -m "feat(frontend): scaffold vite react app with smoke test"
```

---

### Task 3: Plain text/markdown extraction

**Files:**
- Create: `backend/src/extraction/plainTextExtract.js`
- Test: `backend/test/extraction/plainTextExtract.test.js`

**Interfaces:**
- Produces: `extractPlainText(filePath: string): Promise<string>`, consumed by `extractText.js` in Task 6.

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect, afterEach } from 'vitest';
import { writeFile, unlink } from 'node:fs/promises';
import { extractPlainText } from '../../src/extraction/plainTextExtract.js';

const tmpPath = './test/extraction/fixture.txt';

describe('extractPlainText', () => {
  afterEach(async () => {
    await unlink(tmpPath).catch(() => {});
  });

  it('returns the raw file contents', async () => {
    await writeFile(tmpPath, 'hello world');
    const text = await extractPlainText(tmpPath);
    expect(text).toBe('hello world');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run test/extraction/plainTextExtract.test.js`
Expected: FAIL — cannot find module `../../src/extraction/plainTextExtract.js`

- [ ] **Step 3: Implement**

```javascript
import { readFile } from 'node:fs/promises';

export async function extractPlainText(filePath) {
  return readFile(filePath, 'utf-8');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run test/extraction/plainTextExtract.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/extraction/plainTextExtract.js backend/test/extraction/plainTextExtract.test.js
git commit -m "feat(backend): extract text from txt/md files"
```

---

### Task 4: DOCX extraction

**Files:**
- Create: `backend/src/extraction/docxExtract.js`
- Test: `backend/test/extraction/docxExtract.test.js`

**Interfaces:**
- Produces: `extractDocx(filePath: string): Promise<string>`, consumed by `extractText.js` in Task 6.

- [ ] **Step 1: Install mammoth**

```bash
cd backend && npm install mammoth
```

- [ ] **Step 2: Write the failing test (mocks mammoth)**

```javascript
import { describe, it, expect, vi } from 'vitest';

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({ value: 'docx contents' }),
  },
}));

import mammoth from 'mammoth';
import { extractDocx } from '../../src/extraction/docxExtract.js';

describe('extractDocx', () => {
  it('delegates to mammoth.extractRawText and returns its value', async () => {
    const text = await extractDocx('/tmp/fake.docx');
    expect(mammoth.extractRawText).toHaveBeenCalledWith({ path: '/tmp/fake.docx' });
    expect(text).toBe('docx contents');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && npx vitest run test/extraction/docxExtract.test.js`
Expected: FAIL — cannot find module `../../src/extraction/docxExtract.js`

- [ ] **Step 4: Implement**

```javascript
import mammoth from 'mammoth';

export async function extractDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && npx vitest run test/extraction/docxExtract.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/src/extraction/docxExtract.js backend/test/extraction/docxExtract.test.js
git commit -m "feat(backend): extract text from docx files via mammoth"
```

---

### Task 5: PDF extraction (text layer + OCR fallback)

**Files:**
- Create: `backend/src/extraction/pdfExtract.js`
- Test: `backend/test/extraction/pdfExtract.test.js`

**Interfaces:**
- Produces: `extractPdf(filePath: string): Promise<string>`, consumed by `extractText.js` in Task 6.

- [ ] **Step 1: Install deps**

```bash
cd backend && npm install pdfjs-dist tesseract.js canvas
```

- [ ] **Step 2: Write the failing test (mocks pdfjs-dist, canvas, tesseract.js)**

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPage = {
  getTextContent: vi.fn(),
  getViewport: vi.fn().mockReturnValue({ width: 10, height: 10 }),
  render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
};

const mockPdf = {
  numPages: 1,
  getPage: vi.fn().mockResolvedValue(mockPage),
};

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(Buffer.from('fake-pdf-bytes')),
}));

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: vi.fn().mockReturnValue({ promise: Promise.resolve(mockPdf) }),
}));

vi.mock('canvas', () => ({
  createCanvas: vi.fn().mockReturnValue({
    getContext: vi.fn().mockReturnValue({}),
    toBuffer: vi.fn().mockReturnValue(Buffer.from('fake-png')),
  }),
}));

vi.mock('tesseract.js', () => ({
  default: { recognize: vi.fn().mockResolvedValue({ data: { text: 'ocr text' } }) },
}));

import Tesseract from 'tesseract.js';
import { extractPdf } from '../../src/extraction/pdfExtract.js';

describe('extractPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the text layer when it is non-empty', async () => {
    mockPage.getTextContent.mockResolvedValue({ items: [{ str: 'real text' }] });
    const text = await extractPdf('/tmp/fake.pdf');
    expect(text).toContain('real text');
    expect(Tesseract.recognize).not.toHaveBeenCalled();
  });

  it('falls back to OCR when the text layer is empty', async () => {
    mockPage.getTextContent.mockResolvedValue({ items: [] });
    const text = await extractPdf('/tmp/fake.pdf');
    expect(Tesseract.recognize).toHaveBeenCalled();
    expect(text).toContain('ocr text');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && npx vitest run test/extraction/pdfExtract.test.js`
Expected: FAIL — cannot find module `../../src/extraction/pdfExtract.js`

- [ ] **Step 4: Implement**

```javascript
import { readFile } from 'node:fs/promises';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from 'canvas';
import Tesseract from 'tesseract.js';

async function loadPdf(filePath) {
  const data = new Uint8Array(await readFile(filePath));
  return getDocument({ data }).promise;
}

async function extractTextLayer(pdf) {
  let text = '';
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(' ') + '\n';
  }
  return text;
}

async function renderPageToPng(page) {
  const viewport = page.getViewport({ scale: 2 });
  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext('2d');
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas.toBuffer('image/png');
}

async function extractViaOcr(pdf) {
  let text = '';
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const png = await renderPageToPng(page);
    const { data } = await Tesseract.recognize(png, 'eng');
    text += data.text + '\n';
  }
  return text;
}

export async function extractPdf(filePath) {
  const pdf = await loadPdf(filePath);
  const textLayer = await extractTextLayer(pdf);
  if (textLayer.trim().length > 0) return textLayer;
  return extractViaOcr(pdf);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && npx vitest run test/extraction/pdfExtract.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/src/extraction/pdfExtract.js backend/test/extraction/pdfExtract.test.js
git commit -m "feat(backend): extract pdf text layer with tesseract ocr fallback"
```

---

### Task 6: Extraction dispatcher

**Files:**
- Create: `backend/src/extraction/extractText.js`
- Test: `backend/test/extraction/extractText.test.js`

**Interfaces:**
- Consumes: `extractPlainText` (Task 3), `extractDocx` (Task 4), `extractPdf` (Task 5).
- Produces: `extractText(filePath: string, originalName: string): Promise<string>`, consumed by the ingest route in Task 10.

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/extraction/plainTextExtract.js', () => ({
  extractPlainText: vi.fn().mockResolvedValue('txt'),
}));
vi.mock('../../src/extraction/docxExtract.js', () => ({
  extractDocx: vi.fn().mockResolvedValue('docx'),
}));
vi.mock('../../src/extraction/pdfExtract.js', () => ({
  extractPdf: vi.fn().mockResolvedValue('pdf'),
}));

import { extractText } from '../../src/extraction/extractText.js';

describe('extractText', () => {
  it('routes .txt to extractPlainText', async () => {
    expect(await extractText('/tmp/a.txt', 'a.txt')).toBe('txt');
  });

  it('routes .md to extractPlainText', async () => {
    expect(await extractText('/tmp/a.md', 'a.md')).toBe('txt');
  });

  it('routes .docx to extractDocx', async () => {
    expect(await extractText('/tmp/a.docx', 'a.docx')).toBe('docx');
  });

  it('routes .pdf to extractPdf', async () => {
    expect(await extractText('/tmp/a.pdf', 'a.pdf')).toBe('pdf');
  });

  it('throws for unsupported extensions', async () => {
    await expect(extractText('/tmp/a.exe', 'a.exe')).rejects.toThrow('Unsupported file type: .exe');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run test/extraction/extractText.test.js`
Expected: FAIL — cannot find module `../../src/extraction/extractText.js`

- [ ] **Step 3: Implement**

```javascript
import path from 'node:path';
import { extractPlainText } from './plainTextExtract.js';
import { extractDocx } from './docxExtract.js';
import { extractPdf } from './pdfExtract.js';

export async function extractText(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  if (ext === '.txt' || ext === '.md') return extractPlainText(filePath);
  if (ext === '.docx') return extractDocx(filePath);
  if (ext === '.pdf') return extractPdf(filePath);
  throw new Error(`Unsupported file type: ${ext}`);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run test/extraction/extractText.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/extraction/extractText.js backend/test/extraction/extractText.test.js
git commit -m "feat(backend): dispatch text extraction by file extension"
```

---

### Task 7: Chunking module

**Files:**
- Create: `backend/src/chunking/chunkText.js`
- Test: `backend/test/chunking/chunkText.test.js`

**Interfaces:**
- Produces: `chunkText(text: string, options?: { chunkSize?: number, overlap?: number }): { index: number, content: string }[]`, consumed by the ingest route in Task 10.

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { chunkText } from '../../src/chunking/chunkText.js';

describe('chunkText', () => {
  it('returns an empty array for empty input', () => {
    expect(chunkText('')).toEqual([]);
  });

  it('returns a single chunk when text is shorter than chunkSize', () => {
    const chunks = chunkText('one two three', { chunkSize: 500, overlap: 50 });
    expect(chunks).toEqual([{ index: 0, content: 'one two three' }]);
  });

  it('splits long text into overlapping chunks', () => {
    const words = Array.from({ length: 120 }, (_, i) => `w${i}`);
    const chunks = chunkText(words.join(' '), { chunkSize: 50, overlap: 10 });
    expect(chunks).toHaveLength(3);
    expect(chunks[0].content.split(' ')).toHaveLength(50);
    expect(chunks[0].content.split(' ').slice(-10)).toEqual(chunks[1].content.split(' ').slice(0, 10));
    expect(chunks[2].content.split(' ').at(-1)).toBe('w119');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run test/chunking/chunkText.test.js`
Expected: FAIL — cannot find module `../../src/chunking/chunkText.js`

- [ ] **Step 3: Implement**

```javascript
export function chunkText(text, { chunkSize = 500, overlap = 50 } = {}) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks = [];
  const step = chunkSize - overlap;
  let start = 0;
  let index = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    chunks.push({ index, content: words.slice(start, end).join(' ') });
    index += 1;
    if (end === words.length) break;
    start += step;
  }

  return chunks;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run test/chunking/chunkText.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/chunking/chunkText.js backend/test/chunking/chunkText.test.js
git commit -m "feat(backend): chunk extracted text with word-based overlap"
```

---

### Task 8: Supabase schema + vector store

**Files:**
- Create: `backend/supabase/schema.sql`
- Create: `backend/src/vectorstore/supabaseClient.js`
- Create: `backend/src/vectorstore/documentsStore.js`
- Test: `backend/test/vectorstore/documentsStore.test.js`

**Interfaces:**
- Produces: `insertChunks(rows: { source_filename, chunk_index, content, embedding }[]): Promise<void>` and `matchDocuments(queryEmbedding: number[], k?: number): Promise<{ id, source_filename, chunk_index, content, similarity }[]>`, both consumed by the ingest route (Task 10) and query route (Task 12).

- [ ] **Step 1: Install supabase client**

```bash
cd backend && npm install @supabase/supabase-js
```

- [ ] **Step 2: Write `backend/supabase/schema.sql`**

```sql
create extension if not exists vector;

create table if not exists documents (
  id bigint generated always as identity primary key,
  source_filename text not null,
  chunk_index int not null,
  content text not null,
  embedding vector(768) not null,
  created_at timestamptz not null default now()
);

create index if not exists documents_embedding_idx
  on documents using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create or replace function match_documents(
  query_embedding vector(768),
  match_count int default 5
)
returns table (
  id bigint,
  source_filename text,
  chunk_index int,
  content text,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.source_filename,
    documents.chunk_index,
    documents.content,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  order by documents.embedding <=> query_embedding
  limit match_count;
$$;
```

> Run this file's contents in the Supabase project's SQL editor once a project exists (manual step, not automated by this plan).

- [ ] **Step 3: Write the failing test (mocks @supabase/supabase-js)**

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
const mockRpc = vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null });

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({ from: mockFrom, rpc: mockRpc }),
}));

import { insertChunks, matchDocuments } from '../../src/vectorstore/documentsStore.js';

describe('documentsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
    mockRpc.mockResolvedValue({ data: [{ id: 1 }], error: null });
  });

  it('insertChunks inserts rows into the documents table', async () => {
    const rows = [{ source_filename: 'a.txt', chunk_index: 0, content: 'hi', embedding: [0.1] }];
    await insertChunks(rows);
    expect(mockFrom).toHaveBeenCalledWith('documents');
    expect(mockInsert).toHaveBeenCalledWith(rows);
  });

  it('insertChunks throws when supabase returns an error', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'boom' } });
    await expect(insertChunks([])).rejects.toThrow('Supabase insert failed: boom');
  });

  it('matchDocuments calls the match_documents rpc and returns data', async () => {
    const result = await matchDocuments([0.1, 0.2], 3);
    expect(mockRpc).toHaveBeenCalledWith('match_documents', { query_embedding: [0.1, 0.2], match_count: 3 });
    expect(result).toEqual([{ id: 1 }]);
  });

  it('matchDocuments throws when supabase returns an error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'boom' } });
    await expect(matchDocuments([0.1])).rejects.toThrow('Supabase match_documents failed: boom');
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd backend && npx vitest run test/vectorstore/documentsStore.test.js`
Expected: FAIL — cannot find module `../../src/vectorstore/documentsStore.js`

- [ ] **Step 5: Implement `backend/src/vectorstore/supabaseClient.js`**

```javascript
import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

export const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
```

- [ ] **Step 6: Implement `backend/src/vectorstore/documentsStore.js`**

```javascript
import { supabase } from './supabaseClient.js';

export async function insertChunks(rows) {
  const { error } = await supabase.from('documents').insert(rows);
  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
}

export async function matchDocuments(queryEmbedding, k = 5) {
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_count: k,
  });
  if (error) throw new Error(`Supabase match_documents failed: ${error.message}`);
  return data;
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd backend && npx vitest run test/vectorstore/documentsStore.test.js`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/supabase backend/src/vectorstore backend/test/vectorstore
git commit -m "feat(backend): add supabase pgvector schema and document store"
```

---

### Task 9: Gemini embeddings (batched, retry/backoff)

**Files:**
- Create: `backend/src/embeddings/geminiEmbeddings.js`
- Test: `backend/test/embeddings/geminiEmbeddings.test.js`

**Interfaces:**
- Produces: `embedTexts(texts: string[]): Promise<number[][]>`, consumed by the ingest route (Task 10) and query route (Task 12).

- [ ] **Step 1: Install the Gemini SDK**

```bash
cd backend && npm install @google/generative-ai
```

- [ ] **Step 2: Write the failing test (mocks @google/generative-ai)**

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockBatchEmbedContents = vi.fn();
const mockGetGenerativeModel = vi.fn().mockReturnValue({ batchEmbedContents: mockBatchEmbedContents });

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

import { embedTexts } from '../../src/embeddings/geminiEmbeddings.js';

function embeddingsResult(count) {
  return { embeddings: Array.from({ length: count }, (_, i) => ({ values: [i] })) };
}

describe('embedTexts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('embeds a small batch in a single call', async () => {
    mockBatchEmbedContents.mockResolvedValue(embeddingsResult(3));
    const vectors = await embedTexts(['a', 'b', 'c']);
    expect(mockBatchEmbedContents).toHaveBeenCalledTimes(1);
    expect(vectors).toEqual([[0], [1], [2]]);
  });

  it('splits more than 20 texts into multiple batch calls', async () => {
    mockBatchEmbedContents
      .mockResolvedValueOnce(embeddingsResult(20))
      .mockResolvedValueOnce(embeddingsResult(5));
    const texts = Array.from({ length: 25 }, (_, i) => `text-${i}`);
    const vectors = await embedTexts(texts);
    expect(mockBatchEmbedContents).toHaveBeenCalledTimes(2);
    expect(vectors).toHaveLength(25);
  });

  it('retries on rate-limit errors then succeeds', async () => {
    mockBatchEmbedContents
      .mockRejectedValueOnce({ status: 429, message: 'rate limit' })
      .mockResolvedValueOnce(embeddingsResult(1));
    const vectors = await embedTexts(['a']);
    expect(mockBatchEmbedContents).toHaveBeenCalledTimes(2);
    expect(vectors).toEqual([[0]]);
  });

  it('does not retry non-rate-limit errors', async () => {
    mockBatchEmbedContents.mockRejectedValue(new Error('boom'));
    await expect(embedTexts(['a'])).rejects.toThrow('boom');
    expect(mockBatchEmbedContents).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && npx vitest run test/embeddings/geminiEmbeddings.test.js`
Expected: FAIL — cannot find module `../../src/embeddings/geminiEmbeddings.js`

- [ ] **Step 4: Implement**

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

const MAX_BATCH = 20;
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err) {
  return err?.status === 429 || /rate limit/i.test(err?.message ?? '');
}

async function embedBatchWithRetry(batch) {
  let attempt = 0;
  for (;;) {
    try {
      const requests = batch.map((text) => ({ content: { role: 'user', parts: [{ text }] } }));
      const result = await model.batchEmbedContents({ requests });
      return result.embeddings.map((e) => e.values);
    } catch (err) {
      attempt += 1;
      if (!isRateLimitError(err) || attempt > MAX_RETRIES) throw err;
      await sleep(BASE_DELAY_MS * 2 ** (attempt - 1));
    }
  }
}

export async function embedTexts(texts) {
  const vectors = [];
  for (let i = 0; i < texts.length; i += MAX_BATCH) {
    const batch = texts.slice(i, i + MAX_BATCH);
    vectors.push(...(await embedBatchWithRetry(batch)));
  }
  return vectors;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && npx vitest run test/embeddings/geminiEmbeddings.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/src/embeddings backend/test/embeddings
git commit -m "feat(backend): batch gemini embeddings with rate-limit retry"
```

---

### Task 10: Ingest API route

**Files:**
- Create: `backend/src/middleware/errorHandler.js`
- Create: `backend/src/routes/ingest.js`
- Modify: `backend/src/app.js`
- Test: `backend/test/routes/ingest.test.js`

**Interfaces:**
- Consumes: `extractText` (Task 6), `chunkText` (Task 7), `embedTexts` (Task 9), `insertChunks` (Task 8).
- Produces: `POST /api/ingest` — multipart field `file` → `201 { filename, chunksIndexed }`, mounted on `app` for the frontend `uploadDocument` call in Task 13.

- [ ] **Step 1: Install multer**

```bash
cd backend && npm install multer
```

- [ ] **Step 2: Implement `backend/src/middleware/errorHandler.js`**

```javascript
export function errorHandler(err, req, res, _next) {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
}
```

- [ ] **Step 3: Write the failing test (mocks the pipeline modules)**

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../../src/extraction/extractText.js', () => ({ extractText: vi.fn() }));
vi.mock('../../src/chunking/chunkText.js', () => ({ chunkText: vi.fn() }));
vi.mock('../../src/embeddings/geminiEmbeddings.js', () => ({ embedTexts: vi.fn() }));
vi.mock('../../src/vectorstore/documentsStore.js', () => ({ insertChunks: vi.fn() }));

import { extractText } from '../../src/extraction/extractText.js';
import { chunkText } from '../../src/chunking/chunkText.js';
import { embedTexts } from '../../src/embeddings/geminiEmbeddings.js';
import { insertChunks } from '../../src/vectorstore/documentsStore.js';
import app from '../../src/app.js';

describe('POST /api/ingest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when no file is uploaded', async () => {
    const res = await request(app).post('/api/ingest');
    expect(res.status).toBe(400);
  });

  it('extracts, chunks, embeds, and stores the uploaded file', async () => {
    extractText.mockResolvedValue('hello world');
    chunkText.mockReturnValue([{ index: 0, content: 'hello world' }]);
    embedTexts.mockResolvedValue([[0.1, 0.2]]);
    insertChunks.mockResolvedValue(undefined);

    const res = await request(app)
      .post('/api/ingest')
      .attach('file', Buffer.from('hello world'), 'notes.txt');

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ filename: 'notes.txt', chunksIndexed: 1 });
    expect(insertChunks).toHaveBeenCalledWith([
      { source_filename: 'notes.txt', chunk_index: 0, content: 'hello world', embedding: [0.1, 0.2] },
    ]);
  });

  it('returns 422 when no chunks are produced', async () => {
    extractText.mockResolvedValue('');
    chunkText.mockReturnValue([]);

    const res = await request(app)
      .post('/api/ingest')
      .attach('file', Buffer.from(''), 'empty.txt');

    expect(res.status).toBe(422);
  });

  it('returns 500 when extraction throws', async () => {
    extractText.mockRejectedValue(new Error('bad file'));

    const res = await request(app)
      .post('/api/ingest')
      .attach('file', Buffer.from('x'), 'broken.txt');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'bad file' });
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd backend && npx vitest run test/routes/ingest.test.js`
Expected: FAIL — cannot find module `../../src/routes/ingest.js`

- [ ] **Step 5: Implement `backend/src/routes/ingest.js`**

```javascript
import { Router } from 'express';
import multer from 'multer';
import { unlink } from 'node:fs/promises';
import { extractText } from '../extraction/extractText.js';
import { chunkText } from '../chunking/chunkText.js';
import { embedTexts } from '../embeddings/geminiEmbeddings.js';
import { insertChunks } from '../vectorstore/documentsStore.js';

const upload = multer({ dest: 'uploads/' });
export const ingestRouter = Router();

ingestRouter.post('/api/ingest', upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const text = await extractText(req.file.path, req.file.originalname);
    const chunks = chunkText(text);

    if (chunks.length === 0) {
      return res.status(422).json({ error: 'No extractable text found in document' });
    }

    const vectors = await embedTexts(chunks.map((c) => c.content));
    const rows = chunks.map((chunk, i) => ({
      source_filename: req.file.originalname,
      chunk_index: chunk.index,
      content: chunk.content,
      embedding: vectors[i],
    }));

    await insertChunks(rows);
    res.status(201).json({ filename: req.file.originalname, chunksIndexed: rows.length });
  } catch (err) {
    next(err);
  } finally {
    await unlink(req.file.path).catch(() => {});
  }
});
```

- [ ] **Step 6: Wire the router and error handler into `backend/src/app.js`**

```javascript
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { healthRouter } from './routes/health.js';
import { ingestRouter } from './routes/ingest.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(healthRouter);
app.use(ingestRouter);
app.use(errorHandler);

export default app;
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd backend && npx vitest run test/routes/ingest.test.js`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/src/app.js backend/src/routes/ingest.js backend/src/middleware backend/test/routes/ingest.test.js
git commit -m "feat(backend): add ingest api route wiring extraction to vector store"
```

---

### Task 11: Gemini grounded chat

**Files:**
- Create: `backend/src/chat/geminiChat.js`
- Test: `backend/test/chat/geminiChat.test.js`

**Interfaces:**
- Produces: `buildGroundedPrompt(question: string, chunks: { content: string, source_filename: string }[]): string` and `generateAnswer(question: string, chunks): Promise<string>`, consumed by the query route in Task 12.

- [ ] **Step 1: Write the failing test (mocks @google/generative-ai)**

```javascript
import { describe, it, expect, vi } from 'vitest';

const mockGenerateContent = vi.fn().mockResolvedValue({ response: { text: () => 'the answer [1]' } });

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({ generateContent: mockGenerateContent }),
  })),
}));

import { buildGroundedPrompt, generateAnswer } from '../../src/chat/geminiChat.js';

const chunks = [{ content: 'Paris is the capital of France.', source_filename: 'geo.txt' }];

describe('buildGroundedPrompt', () => {
  it('includes the question, context, and the "I don\'t know" instruction', () => {
    const prompt = buildGroundedPrompt('What is the capital of France?', chunks);
    expect(prompt).toContain('Paris is the capital of France.');
    expect(prompt).toContain('What is the capital of France?');
    expect(prompt).toContain("I don't know based on the provided documents.");
  });
});

describe('generateAnswer', () => {
  it('returns the model text response', async () => {
    const answer = await generateAnswer('What is the capital of France?', chunks);
    expect(mockGenerateContent).toHaveBeenCalled();
    expect(answer).toBe('the answer [1]');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run test/chat/geminiChat.test.js`
Expected: FAIL — cannot find module `../../src/chat/geminiChat.js`

- [ ] **Step 3: Implement**

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export function buildGroundedPrompt(question, chunks) {
  const context = chunks
    .map((c, i) => `[${i + 1}] (source: ${c.source_filename})\n${c.content}`)
    .join('\n\n');

  return `You are a helpful assistant that answers questions using ONLY the context below.
If the context does not contain the answer, respond exactly with "I don't know based on the provided documents."
Cite sources using their bracket number, e.g. [1].

Context:
${context}

Question: ${question}

Answer:`;
}

export async function generateAnswer(question, chunks) {
  const prompt = buildGroundedPrompt(question, chunks);
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run test/chat/geminiChat.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/chat backend/test/chat
git commit -m "feat(backend): build grounded gemini chat prompt"
```

---

### Task 12: Query API route

**Files:**
- Create: `backend/src/routes/query.js`
- Modify: `backend/src/app.js`
- Test: `backend/test/routes/query.test.js`

**Interfaces:**
- Consumes: `embedTexts` (Task 9), `matchDocuments` (Task 8), `generateAnswer` (Task 11).
- Produces: `POST /api/query` — `{ question, k? }` → `200 { answer, sources: { filename, chunkIndex, similarity }[] }`, consumed by the frontend `sendQuery` call in Task 13.

- [ ] **Step 1: Write the failing test (mocks the pipeline modules)**

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../../src/embeddings/geminiEmbeddings.js', () => ({ embedTexts: vi.fn() }));
vi.mock('../../src/vectorstore/documentsStore.js', () => ({ matchDocuments: vi.fn() }));
vi.mock('../../src/chat/geminiChat.js', () => ({ generateAnswer: vi.fn() }));

import { embedTexts } from '../../src/embeddings/geminiEmbeddings.js';
import { matchDocuments } from '../../src/vectorstore/documentsStore.js';
import { generateAnswer } from '../../src/chat/geminiChat.js';
import app from '../../src/app.js';

describe('POST /api/query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when question is missing', async () => {
    const res = await request(app).post('/api/query').send({});
    expect(res.status).toBe(400);
  });

  it('returns an answer with sources for a matched question', async () => {
    embedTexts.mockResolvedValue([[0.1]]);
    matchDocuments.mockResolvedValue([
      { source_filename: 'geo.txt', chunk_index: 0, content: 'Paris is the capital of France.', similarity: 0.9 },
    ]);
    generateAnswer.mockResolvedValue('Paris [1]');

    const res = await request(app).post('/api/query').send({ question: 'capital of France?' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      answer: 'Paris [1]',
      sources: [{ filename: 'geo.txt', chunkIndex: 0, similarity: 0.9 }],
    });
  });

  it('returns the "I don\'t know" answer when no chunks match', async () => {
    embedTexts.mockResolvedValue([[0.1]]);
    matchDocuments.mockResolvedValue([]);

    const res = await request(app).post('/api/query').send({ question: 'anything?' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ answer: "I don't know based on the provided documents.", sources: [] });
    expect(generateAnswer).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run test/routes/query.test.js`
Expected: FAIL — cannot find module `../../src/routes/query.js`

- [ ] **Step 3: Implement `backend/src/routes/query.js`**

```javascript
import { Router } from 'express';
import { embedTexts } from '../embeddings/geminiEmbeddings.js';
import { matchDocuments } from '../vectorstore/documentsStore.js';
import { generateAnswer } from '../chat/geminiChat.js';

export const queryRouter = Router();

queryRouter.post('/api/query', async (req, res, next) => {
  const { question, k = 5 } = req.body;

  if (!question || typeof question !== 'string' || question.trim() === '') {
    return res.status(400).json({ error: 'question is required' });
  }

  try {
    const [questionEmbedding] = await embedTexts([question]);
    const chunks = await matchDocuments(questionEmbedding, k);

    if (chunks.length === 0) {
      return res.json({ answer: "I don't know based on the provided documents.", sources: [] });
    }

    const answer = await generateAnswer(question, chunks);
    const sources = chunks.map((c) => ({
      filename: c.source_filename,
      chunkIndex: c.chunk_index,
      similarity: c.similarity,
    }));

    res.json({ answer, sources });
  } catch (err) {
    next(err);
  }
});
```

- [ ] **Step 4: Wire the router into `backend/src/app.js`**

```javascript
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { healthRouter } from './routes/health.js';
import { ingestRouter } from './routes/ingest.js';
import { queryRouter } from './routes/query.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(healthRouter);
app.use(ingestRouter);
app.use(queryRouter);
app.use(errorHandler);

export default app;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && npx vitest run test/routes/query.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/app.js backend/src/routes/query.js backend/test/routes/query.test.js
git commit -m "feat(backend): add grounded query api route"
```

---

### Task 13: Frontend API client

**Files:**
- Create: `frontend/src/api/client.js`
- Test: `frontend/src/api/client.test.js`

**Interfaces:**
- Produces: `uploadDocument(file: File): Promise<{ filename, chunksIndexed }>` and `sendQuery(question: string): Promise<{ answer, sources }>`, consumed by `UploadPanel` (Task 14) and `ChatPanel` (Task 15).

- [ ] **Step 1: Write the failing test**

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadDocument, sendQuery } from './client';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('uploadDocument', () => {
  it('posts the file as form data and returns the parsed body', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ filename: 'a.txt', chunksIndexed: 2 }) });
    const file = new File(['hi'], 'a.txt');
    const result = await uploadDocument(file);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/ingest'), expect.objectContaining({ method: 'POST' }));
    expect(result).toEqual({ filename: 'a.txt', chunksIndexed: 2 });
  });

  it('throws the server error message on failure', async () => {
    fetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'bad upload' }) });
    await expect(uploadDocument(new File(['x'], 'a.txt'))).rejects.toThrow('bad upload');
  });
});

describe('sendQuery', () => {
  it('posts the question as json and returns the parsed body', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ answer: 'hi', sources: [] }) });
    const result = await sendQuery('what?');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/query'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ question: 'what?' }) })
    );
    expect(result).toEqual({ answer: 'hi', sources: [] });
  });

  it('throws the server error message on failure', async () => {
    fetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'bad query' }) });
    await expect(sendQuery('what?')).rejects.toThrow('bad query');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/api/client.test.js`
Expected: FAIL — cannot find module `./client`

- [ ] **Step 3: Implement `frontend/src/api/client.js`**

```javascript
const API_URL = import.meta.env.VITE_API_URL;

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_URL}/api/ingest`, { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

export async function sendQuery(question) {
  const res = await fetch(`${API_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Query failed');
  return data;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/api/client.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api
git commit -m "feat(frontend): add api client for ingest and query endpoints"
```

---

### Task 14: Upload panel component

**Files:**
- Create: `frontend/src/components/UploadPanel.jsx`
- Test: `frontend/src/components/UploadPanel.test.jsx`

**Interfaces:**
- Consumes: `uploadDocument` (Task 13).
- Produces: `UploadPanel({ onUploaded? })` default-less named export, consumed by `App.jsx` in Task 16.

- [ ] **Step 1: Write the failing test**

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../api/client', () => ({ uploadDocument: vi.fn() }));

import { uploadDocument } from '../api/client';
import { UploadPanel } from './UploadPanel';

describe('UploadPanel', () => {
  it('shows a loading state then a success state on upload', async () => {
    uploadDocument.mockResolvedValue({ filename: 'a.txt', chunksIndexed: 2 });
    render(<UploadPanel />);

    const file = new File(['hello'], 'a.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText(/upload a document/i), { target: { files: [file] } });

    expect(await screen.findByText(/document indexed/i)).toBeInTheDocument();
  });

  it('shows an error message when upload fails', async () => {
    uploadDocument.mockRejectedValue(new Error('bad upload'));
    render(<UploadPanel />);

    const file = new File(['hello'], 'a.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText(/upload a document/i), { target: { files: [file] } });

    expect(await screen.findByText('bad upload')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/components/UploadPanel.test.jsx`
Expected: FAIL — cannot find module `./UploadPanel`

- [ ] **Step 3: Implement**

```jsx
import { useState } from 'react';
import { uploadDocument } from '../api/client';

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
    <div className="upload-panel">
      <label htmlFor="file-upload">Upload a document</label>
      <input id="file-upload" type="file" onChange={handleChange} disabled={status === 'loading'} />
      {status === 'loading' && <p role="status">Uploading and indexing...</p>}
      {status === 'error' && <p role="alert">{error}</p>}
      {status === 'done' && <p role="status">Document indexed.</p>}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/components/UploadPanel.test.jsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/UploadPanel.jsx frontend/src/components/UploadPanel.test.jsx
git commit -m "feat(frontend): add upload panel with loading and error states"
```

---

### Task 15: Chat panel, message list, and source citations

**Files:**
- Create: `frontend/src/components/SourceCitations.jsx`
- Create: `frontend/src/components/MessageList.jsx`
- Create: `frontend/src/components/ChatPanel.jsx`
- Test: `frontend/src/components/SourceCitations.test.jsx`
- Test: `frontend/src/components/MessageList.test.jsx`
- Test: `frontend/src/components/ChatPanel.test.jsx`

**Interfaces:**
- Consumes: `sendQuery` (Task 13).
- Produces: `ChatPanel()` default-less named export, consumed by `App.jsx` in Task 16.

- [ ] **Step 1: Write the failing test for `SourceCitations`**

```javascript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SourceCitations } from './SourceCitations';

describe('SourceCitations', () => {
  it('renders nothing when there are no sources', () => {
    const { container } = render(<SourceCitations sources={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a numbered entry per source', () => {
    render(<SourceCitations sources={[{ filename: 'geo.txt', chunkIndex: 0, similarity: 0.87 }]} />);
    expect(screen.getByText(/geo\.txt/)).toBeInTheDocument();
    expect(screen.getByText(/0\.87/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/components/SourceCitations.test.jsx`
Expected: FAIL — cannot find module `./SourceCitations`

- [ ] **Step 3: Implement `frontend/src/components/SourceCitations.jsx`**

```jsx
export function SourceCitations({ sources }) {
  if (!sources || sources.length === 0) return null;

  return (
    <ul className="source-citations">
      {sources.map((s, i) => (
        <li key={`${s.filename}-${s.chunkIndex}`}>
          [{i + 1}] {s.filename} (chunk {s.chunkIndex}, similarity {s.similarity.toFixed(2)})
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/components/SourceCitations.test.jsx`
Expected: PASS

- [ ] **Step 5: Write the failing test for `MessageList`**

```javascript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MessageList } from './MessageList';

describe('MessageList', () => {
  it('renders user and assistant messages with citations', () => {
    render(
      <MessageList
        messages={[
          { role: 'user', content: 'capital of France?' },
          { role: 'assistant', content: 'Paris [1]', sources: [{ filename: 'geo.txt', chunkIndex: 0, similarity: 0.9 }] },
        ]}
      />
    );
    expect(screen.getByText('capital of France?')).toBeInTheDocument();
    expect(screen.getByText('Paris [1]')).toBeInTheDocument();
    expect(screen.getByText(/geo\.txt/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/components/MessageList.test.jsx`
Expected: FAIL — cannot find module `./MessageList`

- [ ] **Step 7: Implement `frontend/src/components/MessageList.jsx`**

```jsx
import { SourceCitations } from './SourceCitations';

export function MessageList({ messages }) {
  return (
    <ul className="message-list">
      {messages.map((m, i) => (
        <li key={i} className={`message message-${m.role}`}>
          <p>{m.content}</p>
          {m.role === 'assistant' && <SourceCitations sources={m.sources} />}
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/components/MessageList.test.jsx`
Expected: PASS

- [ ] **Step 9: Write the failing test for `ChatPanel`**

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../api/client', () => ({ sendQuery: vi.fn() }));

import { sendQuery } from '../api/client';
import { ChatPanel } from './ChatPanel';

describe('ChatPanel', () => {
  it('submits a question and renders the answer with sources', async () => {
    sendQuery.mockResolvedValue({
      answer: 'Paris [1]',
      sources: [{ filename: 'geo.txt', chunkIndex: 0, similarity: 0.9 }],
    });

    render(<ChatPanel />);
    fireEvent.change(screen.getByPlaceholderText(/ask a question/i), { target: { value: 'capital of France?' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(screen.getByText('capital of France?')).toBeInTheDocument();
    expect(await screen.findByText('Paris [1]')).toBeInTheDocument();
  });

  it('shows an error message when the query fails', async () => {
    sendQuery.mockRejectedValue(new Error('bad query'));

    render(<ChatPanel />);
    fireEvent.change(screen.getByPlaceholderText(/ask a question/i), { target: { value: 'capital of France?' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByText('bad query')).toBeInTheDocument();
  });
});
```

- [ ] **Step 10: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/components/ChatPanel.test.jsx`
Expected: FAIL — cannot find module `./ChatPanel`

- [ ] **Step 11: Implement `frontend/src/components/ChatPanel.jsx`**

```jsx
import { useState } from 'react';
import { sendQuery } from '../api/client';
import { MessageList } from './MessageList';

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
    <div className="chat-panel">
      <MessageList messages={messages} />
      {status === 'loading' && <p role="status">Thinking...</p>}
      {status === 'error' && <p role="alert">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your documents"
          disabled={status === 'loading'}
        />
        <button type="submit" disabled={status === 'loading'}>Send</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 12: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/components/ChatPanel.test.jsx`
Expected: PASS

- [ ] **Step 13: Commit**

```bash
git add frontend/src/components
git commit -m "feat(frontend): add chat panel with message list and source citations"
```

---

### Task 16: Wire App.jsx and verify end-to-end

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/App.test.jsx`

**Interfaces:**
- Consumes: `UploadPanel` (Task 14), `ChatPanel` (Task 15).

- [ ] **Step 1: Update the failing/passing test to assert both panels render**

```javascript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the heading, upload input, and chat form', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText(/upload a document/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ask a question/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/App.test.jsx`
Expected: FAIL — `App` doesn't render `UploadPanel`/`ChatPanel` yet

- [ ] **Step 3: Implement `frontend/src/App.jsx`**

```jsx
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

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/App.test.jsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.jsx frontend/src/App.test.jsx
git commit -m "feat(frontend): wire upload and chat panels into app shell"
```

- [ ] **Step 6: Manual end-to-end verification (not automated — requires real API keys)**

1. Create a Supabase project, run `backend/supabase/schema.sql` in its SQL editor, and copy the project URL + service role key into `backend/.env`.
2. Get a Gemini API key and put it in `backend/.env` as `GEMINI_API_KEY`.
3. Run `cd backend && npm run dev`, then `cd frontend && npm run dev` (with `frontend/.env` pointing `VITE_API_URL` at the backend).
4. In the browser, upload a small `.txt` file, confirm "Document indexed." appears.
5. Ask a question the document answers — confirm an answer with `[1]`-style citations and a source list appears.
6. Ask a question unrelated to the document — confirm the response is exactly `"I don't know based on the provided documents."`.

---

### Task 17: Deployment configs

**Files:**
- Create: `frontend/vercel.json`
- Create: `backend/render.yaml`
- Modify: `backend/.env.example`
- Modify: `frontend/.env.example`

**Interfaces:**
- None (deployment configuration only; no code interfaces).

- [ ] **Step 1: Write `frontend/vercel.json`**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

- [ ] **Step 2: Write `backend/render.yaml`**

```yaml
services:
  - type: web
    name: rag-backend
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: GEMINI_API_KEY
        sync: false
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_KEY
        sync: false
```

- [ ] **Step 3: Confirm both `.env.example` files are current**

Verify `backend/.env.example` lists `PORT`, `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` and `frontend/.env.example` lists `VITE_API_URL` (both already written in Tasks 1–2; no changes expected).

- [ ] **Step 4: Commit**

```bash
git add frontend/vercel.json backend/render.yaml
git commit -m "chore: add vercel and render deployment configs"
```

---

## Self-Review Notes

- **Spec coverage:** every `CLAUDE.md` section maps to a task — tech stack (Tasks 1–2, 4–5, 9, 11), extraction (3–6), chunking (7), vector DB/data model (8), env vars (1, 2, 17), grounding/citations/"I don't know" (11, 12, 15), loading/error states (14, 15), batching+retry (9), hosting (17), phase-by-phase testing (manual step in Task 16, automated tests throughout).
- **Placeholder scan:** no TBDs; every step has runnable code or an exact shell command.
- **Type/interface consistency:** `chunkText` → `{ index, content }` used identically in Tasks 7, 10; `insertChunks`/`matchDocuments` row shape (`source_filename`, `chunk_index`, `content`, `embedding`, `similarity`) matches across Tasks 8, 10, 12; frontend `sources` shape (`filename`, `chunkIndex`, `similarity`) matches across Tasks 12, 13, 15.
