import { describe, it, expect, vi } from 'vitest';

const { mockGenerateContent } = vi.hoisted(() => {
  const mockGenerateContent = vi.fn().mockResolvedValue({ response: { text: () => 'the answer [1]' } });
  return { mockGenerateContent };
});

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(function () {
    return { getGenerativeModel: vi.fn().mockReturnValue({ generateContent: mockGenerateContent }) };
  }),
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
