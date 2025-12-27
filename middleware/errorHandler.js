const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value: ${field}`;
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Web3 errors
  if (err.message && err.message.includes('insufficient funds')) {
    const message = 'Insufficient funds for transaction';
    error = { message, statusCode: 400 };
  }

  if (err.message && err.message.includes('nonce too low')) {
    const message = 'Transaction nonce error. Please try again.';
    error = { message, statusCode: 400 };
  }

  if (err.message && err.message.includes('gas required exceeds allowance')) {
    const message = 'Insufficient gas for transaction';
    error = { message, statusCode: 400 };
  }

  // Rate limiting errors
  if (err.statusCode === 429) {
    const message = 'Too many requests. Please try again later.';
    error = { message, statusCode: 429 };
  }

  // Network errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    const message = 'Network error. Please check your connection.';
    error = { message, statusCode: 503 };
  }

  // Default error
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Don't send stack trace in production
  const response = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // Send error response
  res.status(statusCode).json(response);
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation error formatter
const formatValidationErrors = (errors) => {
  const formatted = {};
  
  Object.keys(errors).forEach(key => {
    formatted[key] = errors[key].message;
  });
  
  return formatted;
};

// Business logic error
class BusinessError extends Error {
  constructor(message, statusCode = 400, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'BusinessError';
  }
}

// Insufficient funds error
class InsufficientFundsError extends BusinessError {
  constructor(token, required, available) {
    super(`Insufficient ${token} balance. Required: ${required}, Available: ${available}`, 400, 'INSUFFICIENT_FUNDS');
    this.token = token;
    this.required = required;
    this.available = available;
  }
}

// Insufficient liquidity error
class InsufficientLiquidityError extends BusinessError {
  constructor(token, required, available) {
    super(`Insufficient ${token} liquidity in pool. Required: ${required}, Available: ${available}`, 400, 'INSUFFICIENT_LIQUIDITY');
    this.token = token;
    this.required = required;
    this.available = available;
  }
}

// Invalid transaction error
class InvalidTransactionError extends BusinessError {
  constructor(message, details = null) {
    super(message, 400, 'INVALID_TRANSACTION');
    this.details = details;
  }
}

module.exports = {
  errorHandler,
  asyncHandler,
  formatValidationErrors,
  BusinessError,
  InsufficientFundsError,
  InsufficientLiquidityError,
  InvalidTransactionError
};
