import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

let client;

export function getSupabaseClient() {
  if (!client) {
    client = createClient(config.supabaseUrl, config.supabaseServiceKey);
  }
  return client;
}
