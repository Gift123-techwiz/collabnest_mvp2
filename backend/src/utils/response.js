// Thin, consistent response helpers so every controller returns the same
// envelope shape. Kept intentionally simple — no wrapping magic beyond
// `success` / `data` / `error` so the frontend team has one shape to parse.

function ok(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

function created(res, data) {
  return ok(res, data, 201);
}

function noContent(res) {
  return res.status(204).send();
}

function fail(res, statusCode, message, details) {
  const body = { success: false, error: { message } };
  if (details) body.error.details = details;
  return res.status(statusCode).json(body);
}

module.exports = { ok, created, noContent, fail };
