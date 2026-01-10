// Plan Generator
// Generates execution plans from user queries using LLM

/**
 * Build system prompt for LLM with operation metadata
 * @param {Array} operations - Array of operation metadata
 * @returns {string} System prompt
 */
function buildSystemPrompt(operations) {
  const operationsList = operations.map(op => {
    const paramsDesc = Object.entries(op.params || {}).map(([key, param]) => {
      const type = param.type || 'string';
      const required = param.required ? ' (required)' : '';
      const defaultVal = param.default !== undefined ? ` (default: ${param.default})` : '';
      const desc = param.description ? ` - ${param.description}` : '';
      return `    - ${key}: ${type}${required}${defaultVal}${desc}`;
    }).join('\n');

    return `- ${op.name}: ${op.description}\n  Parameters:\n${paramsDesc || '    (none)'}`;
  }).join('\n\n');

  return `You are an execution plan generator for a browser history analysis tool.

Your task is to convert user queries into structured execution plans.

Available Operations:
${operationsList}

Execution Plan Format:
{
  "steps": [
    { "op": "operation_name", "params": { "param1": "value1", "param2": "value2" } }
  ]
}

Rules:
1. Always start with "get_history" operation if time filtering is needed
2. Use "semantic_filter" for topic/keyword-based queries
3. Use "filter_by_domain" for specific domain queries
4. Use "group_by" to aggregate results by domain, url, or date
5. Use "top_links" or "top_domains" to get most visited items
6. Use "neighbor_visits" to find visits near a specific URL
7. Use "sessionize" to group visits into sessions
8. Use "find_pending_links" for queries about unread/old links
9. Use "find_distracting_content" for queries about distracting content
10. Use "find_stopped_caring" for queries about abandoned domains
11. Do not use "top_domains" or "top_links" unless explicitly asked for by the user.
12. If "top_domains" or "top_links" has not been used, then always use "group_by" to aggregate the urls in the results by domain, url, or date based on what suits the query best.

Time values for get_history:
- "yesterday" - visits from yesterday
- "last_week" - visits from last 7 days
- "last_30_days" - visits from last 30 days
- "lately" or "recently" - visits from last 7 days
- "all" - all visits (no time filter)

Return ONLY valid JSON, no markdown, no explanation, just the execution plan object.`;
}

/**
 * Build user prompt from query
 * @param {string} query - User query
 * @returns {string} User prompt
 */
function buildUserPrompt(query) {
  return `Generate an execution plan for this query: "${query}"`;
}

/**
 * Parse LLM response to extract JSON
 * @param {string} response - LLM response
 * @returns {Object} Parsed execution plan
 */
function parseLLMResponse(response) {
  // Handle empty response
  if (!response || !response.trim()) {
    throw new Error('EMPTY_LLM_RESPONSE');
  }

  // Try to extract JSON from response (might be wrapped in markdown code blocks)
  let jsonStr = response.trim();

  // Remove markdown code blocks if present
  jsonStr = jsonStr.replace(/^```json\s*/i, '');
  jsonStr = jsonStr.replace(/^```\s*/, '');
  jsonStr = jsonStr.replace(/\s*```$/, '');
  jsonStr = jsonStr.trim();

  try {
    const plan = JSON.parse(jsonStr);

    // Validate plan structure
    if (!plan.steps || !Array.isArray(plan.steps)) {
      throw new Error('INVALID_PLAN_STRUCTURE');
    }

    return plan;
  } catch (error) {
    // Try to find JSON object in the response
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const plan = JSON.parse(jsonMatch[0]);
        if (!plan.steps || !Array.isArray(plan.steps)) {
          throw new Error('INVALID_PLAN_STRUCTURE');
        }
        return plan;
      } catch (e) {
        throw new Error('PARSE_ERROR');
      }
    }
    throw new Error('PARSE_ERROR');
  }
}

/**
 * Convert error codes/messages to user-friendly messages
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
function getUserFriendlyError(error) {
  const message = error.message || '';

  // Error code mappings
  const errorMessages = {
    'EMPTY_LLM_RESPONSE': 'The AI did not return a response. Please try again or check your AI configuration in Settings.',
    'INVALID_PLAN_STRUCTURE': 'The AI returned an invalid response. Please try rephrasing your question.',
    'PARSE_ERROR': 'Could not understand the AI response. Please try a simpler question or check your AI configuration.',
    'Query cannot be empty': 'Please enter a question about your browsing history.',
  };

  // Check for exact matches first
  if (errorMessages[message]) {
    return errorMessages[message];
  }

  // Check for partial matches (connection/network errors)
  if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('net::ERR')) {
    return 'Cannot connect to the AI service. Please check that your AI provider is running and properly configured in Settings.';
  }

  if (message.includes('timeout') || message.includes('timed out')) {
    return 'The AI is taking too long to respond. Please try again or use a faster model.';
  }

  if (message.includes('API key') || message.includes('api key') || message.includes('Unauthorized') || message.includes('401')) {
    return 'Invalid or missing API key. Please check your API key in Settings.';
  }

  if (message.includes('rate limit') || message.includes('429')) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  if (message.includes('model') && (message.includes('not found') || message.includes('does not exist'))) {
    return 'The configured AI model was not found. Please check your model name in Settings.';
  }

  if (message.includes('LLM error 5') || message.includes('500') || message.includes('502') || message.includes('503')) {
    return 'The AI service encountered an error. Please try again in a moment.';
  }

  // For any other errors, provide a generic but helpful message
  return 'Something went wrong while processing your question. Please try again or check your AI configuration in Settings.';
}

/**
 * Generate execution plan from user query
 * @param {string} query - User query
 * @returns {Promise<Object>} Execution plan
 */
async function generatePlan(query) {
  if (!query || !query.trim()) {
    throw new Error('Please enter a question about your browsing history.');
  }

  // Get operation metadata
  if (typeof getOperationMetadata === 'undefined') {
    throw new Error('AI Search is not properly initialized. Please reload the extension.');
  }

  const operations = getOperationMetadata();
  if (operations.length === 0) {
    throw new Error('AI Search is not properly initialized. Please reload the extension.');
  }

  // Build prompts
  const systemPrompt = buildSystemPrompt(operations);
  const userPrompt = buildUserPrompt(query);

  // Combine into full prompt (for LLMs that don't support system/user separation)
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}\n\nExecution Plan (JSON only):`;

  // Call LLM
  if (typeof callLLM === 'undefined') {
    throw new Error('AI Search is not properly initialized. Please reload the extension.');
  }

  try {
    const response = await callLLM(fullPrompt);
    const plan = parseLLMResponse(response);

    // Additional validation
    if (plan.steps.length === 0) {
      throw new Error('The AI could not determine how to answer your question. Please try rephrasing it.');
    }

    return plan;
  } catch (error) {
    // Convert to user-friendly message
    throw new Error(getUserFriendlyError(error));
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generatePlan,
    buildSystemPrompt,
    buildUserPrompt,
    parseLLMResponse
  };
}

