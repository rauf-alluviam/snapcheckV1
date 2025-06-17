/**
 * Enhanced Error Handler Utility
 * 
 * Provides consistent error handling and detailed validation messages
 * across all API endpoints.
 */

/**
 * Standard error response format
 */
export function createErrorResponse(
  req,
  statusCode,
  message,
  errors,
  summary,
  help
) {
  return {
    success: false,
    message,
    summary,
    errors,
    help,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };
}

/**
 * Enhanced validation error handler
 */
export function handleValidationError(req, res, validationErrors) {
  const errors = validationErrors.map(detail => {
    const field = detail.path.join('.');
    let message = detail.message;
    let requirements = getFieldRequirements(field);
    
    // Enhance error messages with more context
    switch (detail.type) {
      case 'any.required':
        message = `${field} is required and cannot be empty`;
        break;
      case 'string.empty':
        message = `${field} cannot be empty`;
        break;
      case 'string.min':
        message = `${field} must be at least ${detail.context.limit} characters long`;
        break;
      case 'string.max':
        message = `${field} must not exceed ${detail.context.limit} characters`;
        break;
      case 'string.email':
        message = `${field} must be a valid email address (e.g., user@example.com)`;
        break;
      case 'string.pattern.base':
        message = `${field} format is invalid. ${getFieldSpecificHelp(field)}`;
        break;
      case 'any.only':
        message = `${field} must be one of: ${detail.context.valids.join(', ')}`;
        break;
      case 'number.positive':
        message = `${field} must be a positive number`;
        break;
      case 'number.min':
        message = `${field} must be at least ${detail.context.limit}`;
        break;
      case 'number.max':
        message = `${field} must not exceed ${detail.context.limit}`;
        break;
      case 'date.base':
        message = `${field} must be a valid date (formats: YYYY-MM-DD or ISO datetime)`;
        break;
      case 'array.min':
        message = `${field} must contain at least ${detail.context.limit} item(s)`;
        break;
      default:
        // Keep custom error messages or enhance generic ones
        if (!message.includes('must be') && !message.includes('is required')) {
          message = `${field}: ${message}`;
        }
    }
    
    return {
      field,
      message,
      value: detail.context?.value,
      type: detail.type,
      requirements
    };
  });

  const errorResponse = createErrorResponse(
    req,
    400,
    'Validation failed',
    errors,
    `${errors.length} validation error(s) found. Please check the requirements below.`,
    'Review the requirements for each field and ensure all required fields are provided with valid values.'
  );

  return res.status(400).json(errorResponse);
}

/**
 * Handle specific error types
 */
export function handleDuplicateError(req, res, field, value) {
  const errorResponse = createErrorResponse(
    req,
    400,
    `${field} already exists`,
    [{
      field,
      message: `A record with this ${field} already exists: ${value}`,
      value,
      type: 'duplicate',
      requirements: `${field} must be unique`
    }],
    `Duplicate ${field} found`,
    `Please choose a different ${field} or check if you meant to update an existing record.`
  );

  return res.status(400).json(errorResponse);
}

/**
 * Handle not found errors
 */
export function handleNotFoundError(req, res, resource, id) {
  const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
  
  const errorResponse = createErrorResponse(
    req,
    404,
    message,
    undefined,
    `The requested ${resource.toLowerCase()} could not be found`,
    `Please check the ${resource.toLowerCase()} ID and try again, or contact support if the issue persists.`
  );

  return res.status(404).json(errorResponse);
}

/**
 * Handle authorization errors
 */
export function handleAuthorizationError(req, res, action) {
  const message = action ? `You are not authorized to ${action}` : 'Access denied';
  
  const errorResponse = createErrorResponse(
    req,
    403,
    message,
    undefined,
    'Insufficient permissions',
    'Please contact your administrator if you believe you should have access to this resource.'
  );

  return res.status(403).json(errorResponse);
}

/**
 * Handle authentication errors
 */
export function handleAuthenticationError(req, res, reason) {
  const message = reason || 'Authentication required';
  
  const errorResponse = createErrorResponse(
    req,
    401,
    message,
    undefined,
    'Please log in to continue',
    'You need to be logged in to access this resource. Please log in and try again.'
  );

  return res.status(401).json(errorResponse);
}

/**
 * Handle server errors
 */
export function handleServerError(req, res, error, message) {
  console.error('Server Error:', error);
  
  const errorResponse = createErrorResponse(
    req,
    500,
    message || 'Internal server error',
    undefined,
    'An unexpected error occurred',
    'Please try again later. If the problem persists, contact support.'
  );

  return res.status(500).json(errorResponse);
}

/**
 * Get field-specific help messages
 */
function getFieldSpecificHelp(field) {
  const helpMessages = {
    phone: 'Use formats like: 5551234567, +1 555 123 4567, (555) 123-4567',
    mobileNumber: 'Use formats like: 5551234567, +1 555 123 4567, (555) 123-4567',
    email: 'Must be a valid email address like user@example.com',
    password: 'Must be at least 6 characters long',
    name: 'Must be between 2 and 100 characters',
    address: 'Must not exceed 500 characters',
    organizationId: 'Must be a valid organization ID',
    workflowId: 'Must be a valid workflow ID',
    inspectionId: 'Must be a valid inspection ID',
    role: 'Must be one of: admin, inspector, approver, custom',
    size: 'Must be one of: small, medium, large, enterprise'
  };
  
  return helpMessages[field] || 'Please check the format and try again';
}

/**
 * Get detailed requirements for specific fields
 */
function getFieldRequirements(field) {
  const requirements = {
    name: 'Required. Must be 2-100 characters long.',
    email: 'Required. Must be a valid email format (user@example.com).',
    password: 'Required. Must be at least 6 characters long.',
    phone: 'Required. Use formats: 5551234567, +1 555 123 4567, (555) 123-4567',
    mobileNumber: 'Optional. Use formats: 5551234567, +1 555 123 4567, (555) 123-4567',
    address: 'Optional. Maximum 500 characters.',
    organizationId: 'Required. Must be a valid organization ID.',
    role: 'Required. Must be one of: admin, inspector, approver, custom',
    customRole: 'Required when role is custom. Must be 2-50 characters long.',
    industry: 'Optional. Describe your organization\'s industry.',
    size: 'Optional. Must be one of: small, medium, large, enterprise',
    workflowId: 'Required. Must be a valid workflow ID.',
    inspectionId: 'Required. Must be a valid inspection ID.',
    workflowName: 'Required. Must be 2-200 characters long.',
    category: 'Required. Must be 2-100 characters long.',
    description: 'Required. Must be 10-1000 characters long.',
    steps: 'Required. Must contain at least 1 step.',
    inspectionDate: 'Required. Must be a valid date.',
    filledSteps: 'Required. Must contain at least 1 completed step.',
    meterReading: 'Optional. Must be zero or greater.',
    remarks: 'Optional. Maximum 1000 characters.',
    startDate: 'Required. Must be a valid date.',
    endDate: 'Required. Must be a valid date.',
    orgName: 'Required. Must be 2-200 characters long.',
    orgAddress: 'Required. Must be 5-500 characters long.',
    orgPhone: 'Required. Use formats: 5551234567, +1 555 123 4567, (555) 123-4567',
    orgEmail: 'Required. Must be a valid email format (contact@company.com).'
  };
  
  return requirements[field] || 'Please provide a valid value for this field.';
}
