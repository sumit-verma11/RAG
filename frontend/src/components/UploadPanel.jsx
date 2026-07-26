import { useState } from 'react';
import { uploadDocument } from '../api/client';

export function UploadPanel({ onUploaded }) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  async function handleChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    setStatus('loading');
    setError(null);

    try {
      const result = await uploadDocument(file);
      setStatus('done');
      onUploaded?.(result);
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  }

  return (
    <div className="upload-panel">
      <label htmlFor="file-upload">Upload a document</label>
      <input id="file-upload" type="file" onChange={handleChange} disabled={status === 'loading'} />
      {status === 'loading' && <p role="status">Uploading and indexing...</p>}
      {status === 'error' && <p role="alert">{error}</p>}
      {status === 'done' && <p role="status">Document indexed.</p>}
    </div>
  );
}
