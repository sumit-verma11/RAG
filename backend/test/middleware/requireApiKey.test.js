import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockConfig } = vi.hoisted(() => ({ mockConfig: { config: { apiKey: null } } }));

vi.mock('../../src/config.js', () => mockConfig);

import { requireApiKey } from '../../src/middleware/requireApiKey.js';

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe('requireApiKey', () => {
  beforeEach(() => {
    mockConfig.config.apiKey = null;
  });

  it('allows the request through when no API key is configured', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = vi.fn();

    requireApiKey(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects the request when a key is configured but the header is missing', () => {
    mockConfig.config.apiKey = 'secret';
    const req = { headers: {} };
    const res = mockRes();
    const next = vi.fn();

    requireApiKey(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('rejects the request when the header does not match', () => {
    mockConfig.config.apiKey = 'secret';
    const req = { headers: { 'x-api-key': 'wrong' } };
    const res = mockRes();
    const next = vi.fn();

    requireApiKey(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('allows the request through when the header matches', () => {
    mockConfig.config.apiKey = 'secret';
    const req = { headers: { 'x-api-key': 'secret' } };
    const res = mockRes();
    const next = vi.fn();

    requireApiKey(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
