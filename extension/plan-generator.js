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
11. Always use "group_by" to aggregate the urls in the results by domain, url, or date based on what suits the query best.
12. Do not use "top_domains" unless explicitly asked for by the user.

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
      throw new Error(`Execution plan must have "steps" array: ${jsonStr}`);
    }

    return plan;
  } catch (error) {
    // Try to find JSON object in the response
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        throw new Error(`Failed to parse LLM response as JSON: ${error.message}`);
      }
    }
    throw new Error(`Failed to parse LLM response as JSON: ${error.message}`);
  }
}

/**
 * Generate execution plan from user query
 * @param {string} query - User query
 * @returns {Promise<Object>} Execution plan
 */
async function generatePlan(query) {
  if (!query || !query.trim()) {
    throw new Error('Query cannot be empty');
  }

  // Get operation metadata
  if (typeof getOperationMetadata === 'undefined') {
    throw new Error('Operation registry not loaded');
  }

  const operations = getOperationMetadata();
  if (operations.length === 0) {
    throw new Error('No operations registered');
  }

  // Build prompts
  const systemPrompt = buildSystemPrompt(operations);
  const userPrompt = buildUserPrompt(query);

  // Combine into full prompt (for LLMs that don't support system/user separation)
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}\n\nExecution Plan (JSON only):`;

  // Call LLM
  if (typeof callLLM === 'undefined') {
    throw new Error('LLM client not loaded');
  }

  try {
    const response = await callLLM(fullPrompt);
    const plan = parseLLMResponse(response);

    // Additional validation
    if (plan.steps.length === 0) {
      throw new Error('Execution plan must have at least one step');
    }

    return plan;
  } catch (error) {
    if (error.message.includes('Cannot connect') || error.message.includes('API key')) {
      throw error; // Re-throw configuration errors
    }
    throw new Error(`Failed to generate execution plan: ${error.message}`);
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

