/**
 * Custom Error Class to handle API exceptions uniformly.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP Status Code.
   * @param {string} message - Error description.
   * @param {Array} errors - Detailed validation error array (optional).
   * @param {string} stack - Custom stack trace (optional).
   */
  constructor(statusCode, message = 'Something went wrong', errors = [], stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;
