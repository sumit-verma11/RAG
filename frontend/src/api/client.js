const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

function authHeaders() {
  return API_KEY ? { 'x-api-key': API_KEY } : {};
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_URL}/api/ingest`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

export async function sendQuery(question) {
  const res = await fetch(`${API_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ question }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Query failed');
  return data;
}
