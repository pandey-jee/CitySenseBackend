// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error.status = 400;
    error.message = 'Validation Error';
    error.details = err.details?.map(detail => detail.message) || [];
  }

  if (err.code === 'auth/id-token-expired') {
    error.status = 401;
    error.message = 'Token expired';
  }

  if (err.code === 'auth/id-token-revoked') {
    error.status = 401;
    error.message = 'Token revoked';
  }

  if (err.code === 'permission-denied') {
    error.status = 403;
    error.message = 'Permission denied';
  }

  if (err.code === 'not-found') {
    error.status = 404;
    error.message = 'Resource not found';
  }

  // Firebase Firestore errors
  if (err.code === 'failed-precondition') {
    error.status = 400;
    error.message = 'Failed precondition';
  }

  if (err.code === 'resource-exhausted') {
    error.status = 429;
    error.message = 'Resource exhausted';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && error.status === 500) {
    error.message = 'Internal Server Error';
  }

  res.status(error.status).json({
    error: error.message,
    ...(error.details && { details: error.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  asyncHandler
};
