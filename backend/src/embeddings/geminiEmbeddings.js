import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 768;

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

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
      const requests = batch.map((text) => ({
        model: `models/${EMBEDDING_MODEL}`,
        content: { role: 'user', parts: [{ text }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }));
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
