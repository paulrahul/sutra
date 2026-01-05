// Query Executor
// Executes structured execution plans from LLM
// Operations follow the contract: operation(ctx, params) → result

/**
 * Parse time string to date range
 * @param {string} timeStr - Time string like "yesterday", "last_week", "last_30_days", "all"
 * @returns {Object|null} { startTime, endTime } or null for "all"
 */
function parseTimeRange(timeStr) {
  if (!timeStr || timeStr === 'all') {
    return null; // No time filter
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let startTime, endTime;

  switch (timeStr) {
    case 'yesterday':
      startTime = new Date(today);
      startTime.setDate(startTime.getDate() - 1);
      endTime = new Date(today);
      break;

    case 'last_week':
      startTime = new Date(today);
      startTime.setDate(startTime.getDate() - 7);
      endTime = new Date(now);
      break;

    case 'last_30_days':
      startTime = new Date(today);
      startTime.setDate(startTime.getDate() - 30);
      endTime = new Date(now);
      break;

    case 'last_7_days':
    case 'lately':
    case 'recently':
      startTime = new Date(today);
      startTime.setDate(startTime.getDate() - 7);
      endTime = new Date(now);
      break;

    default:
      // Try to parse as ISO date string
      const parsed = new Date(timeStr);
      if (!isNaN(parsed.getTime())) {
        startTime = new Date(parsed);
        startTime.setHours(0, 0, 0, 0);
        endTime = new Date(parsed);
        endTime.setHours(23, 59, 59, 999);
      } else {
        return null; // Unknown format, return all
      }
  }

  return { startTime, endTime };
}

/**
 * Filter visits by time range
 * @param {Array} visits - Array of visit objects
 * @param {Object} timeRange - { startTime, endTime }
 * @returns {Array} Filtered visits
 */
function filterVisitsByTimeRange(visits, timeRange) {
  if (!timeRange) {
    return visits;
  }

  const { startTime, endTime } = timeRange;
  return visits.filter(v => {
    const visitTime = new Date(v.visited_at);
    return visitTime >= startTime && visitTime <= endTime;
  });
}

/**
 * Execute a single operation step
 * @param {Object} step - Execution step { op, params }
 * @param {Object} ctx - Current context { data, metadata }
 * @returns {*} Operation result
 */
function executeStep(step, ctx) {
  if (!step.op) {
    throw new Error('Step must have an "op" field');
  }

  // Check if registry functions are available
  if (typeof getOperation === 'undefined' || typeof validateParams === 'undefined') {
    throw new Error('Operation registry not loaded. Make sure operation-registry.js is loaded before query-executor.js');
  }

  const operation = getOperation(step.op);
  if (!operation) {
    throw new Error(`Operation "${step.op}" not found in registry`);
  }

  // Validate and apply defaults to parameters
  const params = validateParams(step.op, step.params || {});

  // Execute operation
  const result = operation.execute(ctx, params);

  return result;
}

/**
 * Execute an execution plan
 * @param {Object} plan - Execution plan { steps: [...] }
 * @param {Array} initialData - Initial history data
 * @returns {*} Final result
 */
function executePlan(plan, initialData) {
  if (!plan || !plan.steps || !Array.isArray(plan.steps)) {
    throw new Error('Invalid execution plan: must have "steps" array');
  }

  if (plan.steps.length === 0) {
    throw new Error('Execution plan must have at least one step');
  }

  // Initialize context
  let ctx = {
    data: initialData || [],
    metadata: {
      originalDataCount: initialData ? initialData.length : 0
    }
  };

  // Handle get_history as first step (if present) - apply time filtering
  if (plan.steps.length > 0 && plan.steps[0].op === 'get_history') {
    const firstStep = plan.steps[0];
    const timeRange = parseTimeRange(firstStep.params?.time);

    if (timeRange) {
      ctx.data = filterVisitsByTimeRange(ctx.data, timeRange);
      ctx.metadata.timeRange = timeRange;
    }

    // Remove get_history step as it's handled
    plan.steps = plan.steps.slice(1);
  }

  // Execute remaining steps
  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i];

    try {
      const result = executeStep(step, ctx);

      // Update context for next step
      // If result is an array, it becomes the new data
      // If result is an object with error, throw it
      // Otherwise, result becomes the new data
      if (Array.isArray(result)) {
        ctx.data = result;
      } else if (result && result.error) {
        throw new Error(result.error || result.message || 'Operation failed');
      } else {
        // For non-array results (like sessions, grouped data), store in data
        // This allows subsequent operations to work with it
        ctx.data = result;
      }

      // Store step result in metadata for debugging
      ctx.metadata[`step_${i}`] = {
        operation: step.op,
        resultType: Array.isArray(result) ? 'array' : typeof result,
        resultLength: Array.isArray(result) ? result.length : null
      };

    } catch (error) {
      throw new Error(`Step ${i + 1} (${step.op}) failed: ${error.message}`);
    }
  }

  return ctx.data;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    executePlan,
    parseTimeRange,
    filterVisitsByTimeRange
  };
}

