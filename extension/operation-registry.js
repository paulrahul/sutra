// Operation Registry
// Central registry for all operations with metadata and execution functions
// Operations follow the contract: operation(ctx, params) → result

const OPERATION_REGISTRY = {};

/**
 * Register an operation
 * @param {Object} operation - Operation definition
 * @param {string} operation.name - Operation name (e.g., "top_links")
 * @param {string} operation.description - Human-readable description
 * @param {Object} operation.params - Parameter schema
 * @param {Function} operation.execute - Execution function (ctx, params) → result
 */
function registerOperation(operation) {
  if (!operation.name || !operation.execute) {
    throw new Error('Operation must have name and execute function');
  }
  OPERATION_REGISTRY[operation.name] = {
    name: operation.name,
    description: operation.description || '',
    params: operation.params || {},
    execute: operation.execute
  };
}

/**
 * Get operation by name
 * @param {string} name - Operation name
 * @returns {Object|null} Operation definition or null if not found
 */
function getOperation(name) {
  return OPERATION_REGISTRY[name] || null;
}

/**
 * Get all registered operations
 * @returns {Object} All operations
 */
function getAllOperations() {
  return OPERATION_REGISTRY;
}

/**
 * Get operation metadata (for LLM, excludes execute functions)
 * @returns {Array} Array of operation metadata
 */
function getOperationMetadata() {
  return Object.values(OPERATION_REGISTRY).map(op => ({
    name: op.name,
    description: op.description,
    params: op.params
  }));
}

/**
 * Validate operation parameters against schema
 * @param {string} operationName - Operation name
 * @param {Object} params - Parameters to validate
 * @returns {Object} Validated parameters with defaults applied
 */
function validateParams(operationName, params) {
  const operation = getOperation(operationName);
  if (!operation) {
    throw new Error(`Operation ${operationName} not found`);
  }

  const validated = {};
  const schema = operation.params || {};

  for (const [key, paramDef] of Object.entries(schema)) {
    if (params.hasOwnProperty(key)) {
      // Type validation
      const value = params[key];
      const expectedType = paramDef.type;

      if (expectedType === 'number' && typeof value !== 'number') {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          throw new Error(`Parameter ${key} must be a number`);
        }
        validated[key] = numValue;
      } else if (expectedType === 'string' && typeof value !== 'string') {
        validated[key] = String(value);
      } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
        validated[key] = Boolean(value);
      } else {
        validated[key] = value;
      }
    } else if (paramDef.default !== undefined) {
      // Apply default
      validated[key] = paramDef.default;
    } else if (paramDef.required) {
      throw new Error(`Required parameter ${key} is missing`);
    }
  }

  return validated;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    registerOperation,
    getOperation,
    getAllOperations,
    getOperationMetadata,
    validateParams
  };
}



