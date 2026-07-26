import 'dotenv/config';

export const config = {
  port: process.env.PORT || 4000,
  geminiApiKey: process.env.GEMINI_API_KEY,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
  // Optional shared-secret gate for /api/ingest and /api/query. If unset,
  // those routes are left open (local dev default). Set this before
  // deploying publicly.
  apiKey: process.env.API_KEY || null,
  // Comma-separated list of allowed CORS origins. Defaults to the Vite
  // dev server so local development keeps working out of the box.
  frontendOrigins: (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
