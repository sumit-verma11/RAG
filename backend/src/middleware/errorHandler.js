import multer from 'multer';

export function errorHandler(err, req, res, _next) {
  console.error(err);

  if (err instanceof multer.MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ error: err.message });
  }

  // Only our own deliberately-crafted, safe-to-show errors set statusCode.
  // Everything else (DB drivers, third-party SDKs, unexpected bugs) is
  // logged above but never echoed to the client.
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
}
