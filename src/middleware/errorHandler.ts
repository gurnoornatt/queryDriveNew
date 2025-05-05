import { Request, Response, NextFunction } from 'express';

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Redact PII data from logs
  const redactedUrl = req.url.replace(/\/[a-zA-Z0-9]{8,}/g, '/[REDACTED]');
  const redactedMethod = req.method;

  console.error(`Error on ${redactedMethod} ${redactedUrl}:`, err.message);

  // Determine the status code
  const statusCode = err.status || err.statusCode || 500;

  // Send appropriate response
  res.status(statusCode).json({
    error: {
      message: statusCode === 500 ? 'Internal server error' : err.message,
      status: statusCode,
    },
  });
};
