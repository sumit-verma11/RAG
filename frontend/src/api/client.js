const API_URL = import.meta.env.VITE_API_URL;

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_URL}/api/ingest`, { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

export async function sendQuery(question) {
  const res = await fetch(`${API_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Query failed');
  return data;
}
