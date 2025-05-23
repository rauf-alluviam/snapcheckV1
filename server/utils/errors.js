export class ReportError extends Error {
  constructor(message, statusCode = 500, code = 'REPORT_ERROR', details = null) {
    super(message);
    this.name = 'ReportError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends ReportError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ReportError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class AccessDeniedError extends ReportError {
  constructor(message = 'Access denied') {
    super(message, 403, 'ACCESS_DENIED');
    this.name = 'AccessDeniedError';
  }
}

export class ReportValidationError extends ReportError {
  constructor(message, details = null) {
    super(message, 400, 'REPORT_VALIDATION_ERROR', details);
    this.name = 'ReportValidationError';
  }
}

export class ReportGenerationError extends ReportError {
  constructor(message, details = null) {
    super(message, 500, 'REPORT_GENERATION_ERROR', details);
    this.name = 'ReportGenerationError';
  }
}

export class ReportNotFoundError extends ReportError {
  constructor(message = 'Report type not found') {
    super(message, 404, 'REPORT_NOT_FOUND');
    this.name = 'ReportNotFoundError';
  }
}