import { Router } from 'express';
import { embedTexts } from '../embeddings/geminiEmbeddings.js';
import { matchDocuments } from '../vectorstore/documentsStore.js';
import { generateAnswer } from '../chat/geminiChat.js';
import { filterCitedSources } from '../chat/citations.js';
import { requireApiKey } from '../middleware/requireApiKey.js';
import { queryLimiter } from '../middleware/rateLimiters.js';

export const queryRouter = Router();

const DEFAULT_K = 5;
const MAX_K = 20;

function normalizeK(rawK) {
  const num = Number(rawK);
  if (!Number.isInteger(num) || num < 1) return DEFAULT_K;
  return Math.min(num, MAX_K);
}

queryRouter.post('/api/query', requireApiKey, queryLimiter, async (req, res, next) => {
  const { question } = req.body;
  const k = normalizeK(req.body.k);

  if (!question || typeof question !== 'string' || question.trim() === '') {
    return res.status(400).json({ error: 'question is required' });
  }

  try {
    const [questionEmbedding] = await embedTexts([question]);
    const chunks = await matchDocuments(questionEmbedding, k);

    if (chunks.length === 0) {
      return res.json({ answer: "I don't know based on the provided documents.", sources: [] });
    }

    const rawAnswer = await generateAnswer(question, chunks);
    const { answer, sources } = filterCitedSources(rawAnswer, chunks);

    res.json({ answer, sources });
  } catch (err) {
    next(err);
  }
});
