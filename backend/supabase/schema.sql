create extension if not exists vector;

create table if not exists documents (
  id bigint generated always as identity primary key,
  source_filename text not null,
  chunk_index int not null,
  content text not null,
  embedding vector(768) not null,
  created_at timestamptz not null default now()
);

create index if not exists documents_embedding_idx
  on documents using ivfflat (embedding vector_cosine_ops) with (lists = 100);

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
