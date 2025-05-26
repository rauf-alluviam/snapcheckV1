import { ReportError } from '../utils/errors.js';

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err instanceof ReportError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        details: err.details
      }
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: Object.values(err.errors).map(e => e.message)
      }
    });
  }

  // Handle file generation errors
  if (err.code === 'ENOENT' || err.code === 'EACCES') {
    return res.status(500).json({
      error: {
        message: 'File system error',
        code: 'FILE_SYSTEM_ERROR',
        details: err.message
      }
    });
  }

  // Default error response
  res.status(500).json({
    error: {
      message: 'An unexpected error occurred',
      code: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }
  });
};