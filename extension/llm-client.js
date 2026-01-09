// LLM Client
// Unified interface for calling local and cloud LLMs

/**
 * Get LLM configuration from storage
 * @returns {Promise<Object>} LLM configuration
 */
async function getLLMConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['llmProvider', 'localLLMEndpoint', 'cloudProvider', 'apiKey', 'model'], (result) => {
      resolve({
        provider: result.llmProvider || 'local',
        localEndpoint: result.localLLMEndpoint || 'http://localhost:11434/api/chat',
        cloudProvider: result.cloudProvider || 'openai',
        apiKey: result.apiKey || '',
        model: result.model || 'llama3'
      });
    });
  });
}

/**
 * Call local LLM (e.g., Ollama)
 * @param {string} prompt - Prompt to send
 * @param {Object} config - LLM configuration
 * @returns {Promise<string>} LLM response
 */
/**
 * Add timeout to a promise
 * @param {Promise} promise - Promise to add timeout to
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise} Promise that rejects on timeout
 */
function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

async function callLocalLLM(prompt, config) {
    const endpoint = config.localEndpoint || 'http://localhost:11434/api/chat';
    const model = config.model || 'llama3';
    const timeout = config.timeout || 60000; // 1 minute default timeout

    const returnText = await callLocalLLMStreaming(endpoint, model, prompt, timeout);

    // returnText is already a string from streaming, don't stringify it again
    return returnText.trim();
}

// async function callLocalLLM(prompt, config) {
//   const endpoint = config.localEndpoint || 'http://localhost:11434/api/chat';
//   const model = config.model || 'llama3';
//   const timeout = config.timeout || 60000; // 1 minute default timeout

//   try {
//     const fetchPromise = fetch(endpoint, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         model: model,
//         prompt: prompt,
//         stream: false
//       })
//     });

//     console.log('Awaiting response from local LLM');
//     const response = await withTimeout(fetchPromise, timeout);

//     console.log('Local LLM response:', response);
//     if (!response.ok) {
//       // Try to get error details from response body
//       let errorDetails = '';
//       try {
//         const errorText = await response.text();
//         if (errorText) {
//           try {
//             const errorJson = JSON.parse(errorText);
//             errorDetails = errorJson.error ? ` Error: ${errorJson.error}` : ` Details: ${errorText.substring(0, 200)}`;
//           } catch (e) {
//             errorDetails = ` Details: ${errorText.substring(0, 200)}`;
//           }
//         }
//       } catch (e) {
//         // Ignore errors reading error response
//       }

//       if (response.status === 500) {
//         throw new Error(`Ollama server error (500). Check Ollama logs for details. Possible causes: model not found, out of memory, or invalid request format.${errorDetails}`);
//       }

//       throw new Error(`LLM request failed: ${response.status} ${response.statusText}${errorDetails}`);
//     }

//     const data = await withTimeout(response.json(), 10000); // 10 second timeout for JSON parsing

//     // Ollama returns response in 'response' field
//     if (data.response) {
//       return data.response.trim();
//     }

//     // Some local LLMs might return differently
//     return JSON.stringify(data).trim();
//   } catch (error) {
//     if (error.message.includes('timeout')) {
//       throw new Error(`LLM request timed out. The model might be taking too long to respond. Try a smaller prompt or check Ollama logs.`);
//     }
//     if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
//       throw new Error('Cannot connect to local LLM. Make sure it is running and the endpoint is correct.');
//     }
//     throw error;
//   }
// }

async function callLocalLLMStreaming(
    endpoint = 'http://localhost:11434/api/chat',
    model,
    prompt,
    timeout = 300000 // 5 min safety timeout
    ) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: `You are a planner.

Output ONLY a single JSON object that matches the schema below.
Do NOT explain.
Do NOT reason.
Do NOT add text before or after the JSON.
Stop immediately after the closing brace.

If you cannot produce valid JSON, output {} and stop.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          stream: true
        })
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`LLM error ${response.status}: ${text}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let fullText = '';
      let buffer = '';
      let seenDoneFlag = false;
      let readCount = 0;
      let lastChunkTime = Date.now();

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        if (!value || value.length === 0) {
          continue;
        }

        lastChunkTime = Date.now();
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) {
            continue;
          }

          let parsed;
          try {
            parsed = JSON.parse(line);
          } catch (err) {
            continue;
          }


          if (parsed.message?.content) {
            fullText += parsed.message.content;
          }

          if (parsed.done === true) {
            seenDoneFlag = true;
          }
        }

        // 🔴 IMPORTANT EXIT CONDITION
        if (seenDoneFlag) {
          break;
        }

        // Safety guard: no chunks for too long
        if (Date.now() - lastChunkTime > 60_000) {
          break;
        }
      }

      if (!seenDoneFlag) {
        console.warn('[LLM] WARNING: Stream ended without done:true');
      }

      return fullText.trim();
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error(
          'LLM request timed out while streaming. Model may be too slow or overloaded.'
        );
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
}


/**
 * Call cloud LLM (OpenAI, Anthropic, etc.)
 * @param {string} prompt - Prompt to send
 * @param {Object} config - LLM configuration
 * @returns {Promise<string>} LLM response
 */
async function callCloudLLM(prompt, config) {
  const provider = config.cloudProvider || 'openai';
  const apiKey = config.apiKey;
  const model = config.model || (provider === 'openai' ? 'gpt-4' : 'claude-3-sonnet-20240229');

  if (!apiKey) {
    throw new Error('API key is required for cloud LLM');
  }

  if (provider === 'openai') {
    return callOpenAI(prompt, apiKey, model);
  } else if (provider === 'anthropic') {
    return callAnthropic(prompt, apiKey, model);
  } else {
    throw new Error(`Unsupported cloud provider: ${provider}`);
  }
}

/**
 * Call OpenAI API
 * @param {string} prompt - Prompt to send
 * @param {string} apiKey - OpenAI API key
 * @param {string} model - Model name
 * @returns {Promise<string>} LLM response
 */
async function callOpenAI(prompt, apiKey, model) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that generates execution plans in JSON format.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

/**
 * Call Anthropic API
 * @param {string} prompt - Prompt to send
 * @param {string} apiKey - Anthropic API key
 * @param {string} model - Model name
 * @returns {Promise<string>} LLM response
 */
async function callAnthropic(prompt, apiKey, model) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        { role: 'user', content: prompt }
      ],
      system: 'You are a helpful assistant that generates execution plans in JSON format.'
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text.trim();
}

/**
 * Call LLM with unified interface
 * @param {string} prompt - Prompt to send
 * @param {Object} config - Optional LLM configuration (if not provided, loads from storage)
 * @returns {Promise<string>} LLM response
 */
async function callLLM(prompt, config = null) {
  if (!config) {
    config = await getLLMConfig();
  }

  if (config.provider === 'local') {
    return callLocalLLM(prompt, config);
  } else if (config.provider === 'cloud') {
    return callCloudLLM(prompt, config);
  } else {
    throw new Error(`Unknown LLM provider: ${config.provider}`);
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    callLLM,
    getLLMConfig,
    callLocalLLM,
    callCloudLLM
  };
}

