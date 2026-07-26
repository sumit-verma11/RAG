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
