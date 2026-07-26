import { supabase } from './supabaseClient.js';

export async function insertChunks(rows) {
  const { error } = await supabase.from('documents').insert(rows);
  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
}

export async function matchDocuments(queryEmbedding, k = 5) {
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_count: k,
  });
  if (error) throw new Error(`Supabase match_documents failed: ${error.message}`);
  return data;
}
