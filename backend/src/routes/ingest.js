import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { unlink } from 'node:fs/promises';
import { extractText } from '../extraction/extractText.js';
import { chunkText } from '../chunking/chunkText.js';
import { embedTexts } from '../embeddings/geminiEmbeddings.js';
import { insertChunks } from '../vectorstore/documentsStore.js';
import { requireApiKey } from '../middleware/requireApiKey.js';
import { ingestLimiter } from '../middleware/rateLimiters.js';

const ALLOWED_EXTENSIONS = new Set(['.txt', '.md', '.docx', '.pdf']);
const MAX_FILE_BYTES = 15 * 1024 * 1024;

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    const err = new Error(`Unsupported file type: ${ext}`);
    err.statusCode = 400;
    return cb(err);
  }
  cb(null, true);
}

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter,
});

export const ingestRouter = Router();

ingestRouter.post(
  '/api/ingest',
  requireApiKey,
  ingestLimiter,
  upload.single('file'),
  async (req, res, next) => {
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
  }
);
