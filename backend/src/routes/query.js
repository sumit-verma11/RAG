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
