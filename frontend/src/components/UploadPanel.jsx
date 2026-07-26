import { useState } from 'react';
import { uploadDocument } from '../api/client';
import './UploadPanel.css';

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
    <div className="upload-panel card">
      <div className="upload-dropzone">
        <label htmlFor="file-upload" className="upload-label">Upload a document</label>
        <input
          id="file-upload"
          type="file"
          onChange={handleChange}
          disabled={status === 'loading'}
          className="upload-input"
        />
      </div>
      {status === 'loading' && (
        <p role="status" className="status status-loading">Uploading and indexing...</p>
      )}
      {status === 'error' && (
        <p role="alert" className="status status-error">{error}</p>
      )}
      {status === 'done' && (
        <p role="status" className="status status-done">Document indexed.</p>
      )}
    </div>
  );
}
