export function errorHandler(err, _req, res, _next) {
  // eslint-disable-next-line no-console
  console.error("[error]", err);
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ error: message });
}

