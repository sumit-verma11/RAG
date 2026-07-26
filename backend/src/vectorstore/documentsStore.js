import { getSupabaseClient } from './supabaseClient.js';

// Single-tenant by design: all documents share one table and
// matchDocuments searches across everything ever ingested. There is no
// per-user/session scoping. Fine for a personal or single-operator
// deployment; if this is ever opened up to multiple untrusted users,
// add a session/user id column and filter both insertChunks and
// matchDocuments by it first.

export async function insertChunks(rows) {
  const { error } = await getSupabaseClient().from('documents').insert(rows);
  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
}

export async function matchDocuments(queryEmbedding, k = 5) {
  const { data, error } = await getSupabaseClient().rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_count: k,
  });
  if (error) throw new Error(`Supabase match_documents failed: ${error.message}`);
  return data;
}
