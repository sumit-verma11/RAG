create extension if not exists vector;

create table if not exists documents (
  id bigint generated always as identity primary key,
  source_filename text not null,
  chunk_index int not null,
  content text not null,
  embedding vector(768) not null,
  created_at timestamptz not null default now()
);

-- No ANN index (ivfflat/hnsw) here on purpose: ivfflat is an approximate
-- index that clusters rows into `lists` buckets and only probes 1 by
-- default. With a small personal document set (far fewer rows than
-- `lists`), a matching row can land in a bucket the query never probes,
-- so the search silently returns nothing instead of erroring. A plain
-- sequential scan (no index) gives exact results and is plenty fast at
-- this scale. Add an ivfflat/hnsw index only once the table has grown
-- into the thousands of rows.

create or replace function match_documents(
  query_embedding vector(768),
  match_count int default 5
)
returns table (
  id bigint,
  source_filename text,
  chunk_index int,
  content text,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.source_filename,
    documents.chunk_index,
    documents.content,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  order by documents.embedding <=> query_embedding
  limit match_count;
$$;
