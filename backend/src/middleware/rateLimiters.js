import rateLimit from 'express-rate-limit';

// Both routes call billed/quota-limited Gemini APIs, so limits stay tight.
// Ingest also pays for OCR on scanned PDFs, so it gets the stricter cap.
export const ingestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many uploads. Please try again later.' },
});

export const queryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many questions. Please try again later.' },
});
