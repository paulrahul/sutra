// Semantic Operations (v2 - Enhanced Local Heuristics + LLM Expansion)
// Rule-based semantic filtering using domain lists, keywords, intent detection, and heuristics
// Now includes LLM-based semantic expansion for unmapped keywords to improve query matching

// Domain category mappings for semantic filtering
const DOMAIN_CATEGORIES = {
  'news': ['cnn.com', 'bbc.com', 'nytimes.com', 'theguardian.com', 'reuters.com', 'wsj.com', 'npr.org', 'ap.org', 'bloomberg.com', 'economist.com', 'washingtonpost.com', 'foxnews.com', 'nbcnews.com', 'abcnews.go.com', 'usatoday.com'],
  'shopping': ['amazon.com', 'ebay.com', 'etsy.com', 'shopify.com', 'target.com', 'walmart.com', 'aliexpress.com', 'bestbuy.com', 'costco.com', 'homedepot.com', 'lowes.com', 'wayfair.com', 'ikea.com'],
  'social': ['facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'linkedin.com', 'reddit.com', 'tiktok.com', 'pinterest.com', 'snapchat.com', 'tumblr.com', 'discord.com', 'threads.net', 'mastodon.social'],
  'entertainment': ['netflix.com', 'hulu.com', 'disney.com', 'disneyplus.com', 'spotify.com', 'twitch.tv', 'youtube.com', 'hbomax.com', 'max.com', 'peacocktv.com', 'primevideo.com', 'crunchyroll.com', 'soundcloud.com', 'vimeo.com'],
  'video': ['youtube.com', 'vimeo.com', 'twitch.tv', 'dailymotion.com', 'tiktok.com', 'netflix.com', 'hulu.com', 'primevideo.com'],
  'music': ['spotify.com', 'soundcloud.com', 'pandora.com', 'apple.com/music', 'music.youtube.com', 'bandcamp.com', 'last.fm'],
  'gaming': ['twitch.tv', 'steam.com', 'steampowered.com', 'epicgames.com', 'ign.com', 'gamespot.com', 'kotaku.com', 'polygon.com', 'xbox.com', 'playstation.com', 'nintendo.com'],
  'clothing': ['etsy.com', 'zara.com', 'hm.com', 'nike.com', 'adidas.com', 'asos.com', 'gap.com', 'uniqlo.com', 'nordstrom.com', 'macys.com', 'fashion', 'clothing', 'apparel'],
  'food': ['allrecipes.com', 'foodnetwork.com', 'epicurious.com', 'bonappetit.com', 'tasty.co', 'seriouseats.com', 'food52.com', 'delish.com', 'recipe', 'cooking', 'doordash.com', 'ubereats.com', 'grubhub.com', 'yelp.com'],
  'italian': ['italian', 'italy', 'pasta', 'pizza', 'risotto', 'tiramisu', 'lasagna', 'gelato'],
  'politics': ['politico.com', 'fivethirtyeight.com', 'realclearpolitics.com', 'politico', 'election', 'vote', 'senate', 'congress', 'thehill.com', 'rollcall.com'],
  'tech': ['techcrunch.com', 'theverge.com', 'wired.com', 'arstechnica.com', 'engadget.com', 'gizmodo.com', 'cnet.com', 'zdnet.com', 'mashable.com', 'hackernews', 'news.ycombinator.com'],
  'programming': ['github.com', 'stackoverflow.com', 'gitlab.com', 'bitbucket.org', 'dev.to', 'medium.com', 'hashnode.com', 'codepen.io', 'jsfiddle.net', 'replit.com'],
  'learning': ['coursera.org', 'udemy.com', 'edx.org', 'khanacademy.org', 'skillshare.com', 'linkedin.com/learning', 'pluralsight.com', 'codecademy.com', 'freecodecamp.org', 'udacity.com'],
  'productivity': ['notion.so', 'trello.com', 'asana.com', 'monday.com', 'clickup.com', 'todoist.com', 'evernote.com', 'airtable.com', 'miro.com', 'figma.com', 'docs.google.com', 'drive.google.com', 'dropbox.com'],
  'finance': ['mint.com', 'personalcapital.com', 'robinhood.com', 'coinbase.com', 'yahoo.com/finance', 'marketwatch.com', 'investopedia.com', 'nerdwallet.com', 'creditkarma.com'],
  'health': ['webmd.com', 'mayoclinic.org', 'healthline.com', 'nih.gov', 'cdc.gov', 'medlineplus.gov', 'myfitnesspal.com', 'strava.com', 'fitbit.com'],
  'travel': ['booking.com', 'airbnb.com', 'expedia.com', 'tripadvisor.com', 'kayak.com', 'hotels.com', 'vrbo.com', 'google.com/travel', 'skyscanner.com'],
  'reference': ['wikipedia.org', 'wikihow.com', 'quora.com', 'answers.com', 'britannica.com', 'dictionary.com', 'thesaurus.com'],
  'email': ['gmail.com', 'mail.google.com', 'outlook.com', 'mail.yahoo.com', 'protonmail.com', 'icloud.com/mail']
};

// Semantic concept mappings - map abstract concepts to categories
const SEMANTIC_CONCEPTS = {
  // Distraction-related concepts
  'distraction': ['social', 'entertainment', 'gaming', 'video'],
  'distracting': ['social', 'entertainment', 'gaming', 'video'],
  'distract': ['social', 'entertainment', 'gaming', 'video'],
  'procrastination': ['social', 'entertainment', 'gaming', 'video'],
  'procrastinating': ['social', 'entertainment', 'gaming', 'video'],
  'wasting time': ['social', 'entertainment', 'gaming', 'video'],
  'time waster': ['social', 'entertainment', 'gaming', 'video'],
  'timewaster': ['social', 'entertainment', 'gaming', 'video'],
  'unproductive': ['social', 'entertainment', 'gaming', 'video'],

  // Productivity-related concepts
  'productive': ['productivity', 'programming', 'learning', 'reference'],
  'productivity': ['productivity', 'programming', 'learning', 'reference'],
  'work': ['productivity', 'programming', 'email', 'reference'],
  'working': ['productivity', 'programming', 'email', 'reference'],
  'focus': ['productivity', 'programming', 'learning'],
  'focused': ['productivity', 'programming', 'learning'],
  'useful': ['productivity', 'programming', 'learning', 'reference'],

  // Learning-related concepts
  'learn': ['learning', 'reference', 'tech', 'programming'],
  'learning': ['learning', 'reference', 'tech', 'programming'],
  'education': ['learning', 'reference'],
  'educational': ['learning', 'reference'],
  'study': ['learning', 'reference', 'programming'],
  'studying': ['learning', 'reference', 'programming'],
  'tutorial': ['learning', 'programming', 'tech'],
  'course': ['learning'],

  // Entertainment concepts
  'fun': ['entertainment', 'gaming', 'social', 'video'],
  'relax': ['entertainment', 'music', 'video'],
  'relaxing': ['entertainment', 'music', 'video'],
  'leisure': ['entertainment', 'gaming', 'social', 'video'],
  'hobby': ['entertainment', 'gaming'],
  'hobbies': ['entertainment', 'gaming'],

  // Reading/content concepts
  'read': ['news', 'reference', 'tech'],
  'reading': ['news', 'reference', 'tech'],
  'article': ['news', 'tech', 'reference'],
  'articles': ['news', 'tech', 'reference'],
  'blog': ['tech', 'news'],
  'blogs': ['tech', 'news'],

  // Social concepts
  'friends': ['social', 'email'],
  'social media': ['social'],
  'networking': ['social'],

  // Video concepts
  'watch': ['video', 'entertainment'],
  'watching': ['video', 'entertainment'],
  'stream': ['video', 'entertainment', 'gaming'],
  'streaming': ['video', 'entertainment', 'gaming'],

  // Shopping concepts
  'buy': ['shopping'],
  'buying': ['shopping'],
  'purchase': ['shopping'],
  'shop': ['shopping'],
  'order': ['shopping', 'food']
};

// Query intent patterns - detect what the user is asking about
const INTENT_PATTERNS = [
  { pattern: /distract|procrastinat|wast(e|ing)\s*time|unproductive/i, intent: 'distraction', categories: ['social', 'entertainment', 'gaming', 'video'] },
  { pattern: /productive|productiv|useful|work\s*related|for\s*work/i, intent: 'productivity', categories: ['productivity', 'programming', 'learning', 'reference', 'email'] },
  { pattern: /learn|study|educat|tutorial|course|skill/i, intent: 'learning', categories: ['learning', 'reference', 'programming', 'tech'] },
  { pattern: /news|current\s*events|headlines|journalism/i, intent: 'news', categories: ['news', 'politics'] },
  { pattern: /shop|buy|purchas|order|deal|sale/i, intent: 'shopping', categories: ['shopping'] },
  { pattern: /social\s*media|friends|network|connect/i, intent: 'social', categories: ['social'] },
  { pattern: /video|watch|stream|movie|show|series/i, intent: 'video', categories: ['video', 'entertainment'] },
  { pattern: /music|song|playlist|listen/i, intent: 'music', categories: ['music', 'entertainment'] },
  { pattern: /game|gaming|play/i, intent: 'gaming', categories: ['gaming', 'entertainment'] },
  { pattern: /code|program|develop|software|github/i, intent: 'programming', categories: ['programming', 'tech'] },
  { pattern: /recipe|cook|food|eat|restaurant|dinner|lunch|breakfast/i, intent: 'food', categories: ['food'] },
  { pattern: /health|fitness|exercise|workout|medical|doctor/i, intent: 'health', categories: ['health'] },
  { pattern: /travel|trip|vacation|hotel|flight|book/i, intent: 'travel', categories: ['travel'] },
  { pattern: /money|financ|invest|stock|crypto|budget|bank/i, intent: 'finance', categories: ['finance'] },
  { pattern: /email|mail|inbox|message/i, intent: 'email', categories: ['email'] }
];

// Synonym expansions for common terms
const SYNONYMS = {
  'youtube': ['youtube.com', 'video', 'watch'],
  'google': ['google.com', 'search', 'gmail'],
  'facebook': ['facebook.com', 'fb', 'meta'],
  'twitter': ['twitter.com', 'x.com', 'tweet'],
  'instagram': ['instagram.com', 'insta', 'ig'],
  'reddit': ['reddit.com', 'subreddit'],
  'amazon': ['amazon.com', 'amzn', 'aws'],
  'netflix': ['netflix.com', 'stream', 'watch'],
  'github': ['github.com', 'git', 'repo', 'repository'],
  'stackoverflow': ['stackoverflow.com', 'stack overflow', 'coding help']
};

// Cache for LLM-generated expansions (to avoid repeated calls)
const LLM_EXPANSION_CACHE = new Map();

// Pending LLM expansion requests (to avoid duplicate concurrent requests)
const PENDING_LLM_REQUESTS = new Map();

// Stop words to filter out from queries
const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'you', 'your', 'yours', 'he', 'she', 'it', 'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'now', 'about', 'kind', 'type', 'types', 'kinds', 'content', 'stuff', 'things', 'thing', 'site', 'sites', 'website', 'websites', 'page', 'pages', 'link', 'links', 'visit', 'visited', 'browse', 'browsed', 'browsing', 'look', 'looked', 'looking', 'find', 'found', 'show', 'get', 'see', 'seen']);

// Cache for LLM-based significance checks for short words
const SHORT_WORD_SIGNIFICANCE_CACHE = new Map();

// Pending LLM significance requests (to avoid duplicate concurrent requests)
const PENDING_SIGNIFICANCE_REQUESTS = new Map();

/**
 * Check if a short word is significant (not a stop word) using LLM
 * @param {string} word - Word to check (should be lowercase)
 * @param {string} originalWord - Original word from query (to check case)
 * @returns {Promise<boolean>} True if word is significant and should be kept
 */
async function isShortWordSignificant(word, originalWord) {
  const lowerWord = word.toLowerCase();

  // Always filter out stop words
  if (STOP_WORDS.has(lowerWord)) {
    return false;
  }

  // If word is longer than 2 characters, keep it (unless it's a stop word, already checked)
  if (word.length > 2) {
    return true;
  }

  // For very short words (1-2 chars), check cache first
  if (SHORT_WORD_SIGNIFICANCE_CACHE.has(lowerWord)) {
    const cached = SHORT_WORD_SIGNIFICANCE_CACHE.get(lowerWord);
    console.log(`[IsShortWordSignificant] Cache hit for "${word}": ${cached}`);
    return cached;
  }

  // Check if there's already a pending request
  if (PENDING_SIGNIFICANCE_REQUESTS.has(lowerWord)) {
    const result = await PENDING_SIGNIFICANCE_REQUESTS.get(lowerWord);
    return result;
  }

  // If original word was all uppercase, it's likely an acronym - keep it
  if (originalWord && originalWord === originalWord.toUpperCase() && originalWord.length >= 2) {
    console.log(`[IsShortWordSignificant] "${word}" is uppercase acronym, keeping`);
    SHORT_WORD_SIGNIFICANCE_CACHE.set(lowerWord, true);
    return true;
  }

  // Check if LLM is available
  if (typeof callLLM === 'undefined' || typeof getLLMConfig === 'undefined') {
    // LLM not available, default to keeping short words that aren't stop words
    // (conservative approach - better to include than exclude)
    console.log(`[IsShortWordSignificant] LLM not available, defaulting to keep "${word}"`);
    SHORT_WORD_SIGNIFICANCE_CACHE.set(lowerWord, true);
    return true;
  }

  // Create a promise for this request
  const significancePromise = (async () => {
    try {
      // Build a concise prompt asking if the word is significant
      const prompt = `Is "${word}" a significant searchable term (like an acronym, abbreviation, or important keyword)? Examples: "AI"=yes, "it"=no, "ML"=yes, "to"=no. Answer with ONLY "yes" or "no", no explanation.`;

      // Get LLM config with a short timeout
      const config = await getLLMConfig();
      config.timeout = 3000; // 3 second timeout for quick response

      const response = await callLLM(prompt, config);

      // Parse response - look for "yes" or "no"
      const lowerResponse = response.toLowerCase().trim();
      const isSignificant = lowerResponse.includes('yes') && !lowerResponse.includes('no');

      console.log(`[IsShortWordSignificant] LLM response for "${word}": "${response}" → ${isSignificant}`);

      // Cache the result
      SHORT_WORD_SIGNIFICANCE_CACHE.set(lowerWord, isSignificant);

      return isSignificant;
    } catch (error) {
      console.warn(`[IsShortWordSignificant] LLM check failed for "${word}":`, error.message);
      // On error, default to keeping it (conservative approach)
      const defaultKeep = true;
      SHORT_WORD_SIGNIFICANCE_CACHE.set(lowerWord, defaultKeep);
      return defaultKeep;
    } finally {
      // Remove from pending requests
      PENDING_SIGNIFICANCE_REQUESTS.delete(lowerWord);
    }
  })();

  // Store the promise in pending requests
  PENDING_SIGNIFICANCE_REQUESTS.set(lowerWord, significancePromise);

  return significancePromise;
}

/**
 * Extract keywords from query string
 * Now uses LLM to determine if short words are significant
 * Preserves original case for uppercase acronyms for case-sensitive matching
 * @param {string} query - User query
 * @returns {Promise<Array>} Array of keywords (preserving case for uppercase acronyms)
 */
async function extractKeywords(query) {
  if (!query) return [];

  // Keep original query to check for uppercase acronyms
  const originalWords = query.replace(/[^\w\s]/g, ' ').split(/\s+/);

  // Convert to lowercase and split by non-word characters
  const allWords = query.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/);

  // Check significance for all words in parallel
  const significanceChecks = allWords.map((word, index) =>
    isShortWordSignificant(word, originalWords[index])
  );

  const significanceResults = await Promise.allSettled(significanceChecks);

  // Filter words based on significance results, preserving case for uppercase acronyms
  const words = [];
  for (let i = 0; i < allWords.length; i++) {
    const word = allWords[i];
    const result = significanceResults[i];
    let shouldKeep = false;

    if (result.status === 'fulfilled') {
      shouldKeep = result.value;
    } else {
      // On error, default to keeping words > 2 chars
      shouldKeep = word.length > 2 && !STOP_WORDS.has(word);
    }

    if (shouldKeep) {
      const origWord = originalWords[i];
      // If original word was all uppercase and >= 2 chars, preserve case for case-sensitive matching
      if (origWord && origWord === origWord.toUpperCase() && origWord.length >= 2 && /^[A-Z]+$/.test(origWord)) {
        console.log(`[ExtractKeywords] Preserving uppercase case for acronym: "${word}" → "${origWord}"`);
        words.push(origWord);
      } else {
        words.push(word);
      }
    }
  }

  const filteredOut = allWords.filter((word, index) => {
    const result = significanceResults[index];
    if (result.status === 'fulfilled') {
      return !result.value;
    }
    return word.length <= 2 || STOP_WORDS.has(word);
  });

  if (filteredOut.length > 0) {
    console.log('[ExtractKeywords] Filtered out (stop words or not significant):', filteredOut);
  }
  console.log('[ExtractKeywords] Extracted keywords:', words);

  return words;
}

/**
 * Check if text contains keywords
 * Case-sensitive for uppercase acronyms, case-insensitive for others
 * @param {string} text - Text to search
 * @param {Array} keywords - Keywords to find
 * @returns {boolean} True if any keyword is found
 */
function containsKeywords(text, keywords) {
  if (!text || !keywords || keywords.length === 0) return false;

  return keywords.some(keyword => {
    // If keyword is all uppercase and >= 2 chars, do case-sensitive matching
    // This helps match acronyms like "AI", "ML", "API" in their proper case
    if (keyword === keyword.toUpperCase() && keyword.length >= 2 && /^[A-Z]+$/.test(keyword)) {
      // Case-sensitive match for uppercase acronyms
      return text.includes(keyword);
    } else {
      // Case-insensitive match for regular keywords
      const lowerText = text.toLowerCase();
      const lowerKeyword = keyword.toLowerCase();
      return lowerText.includes(lowerKeyword);
    }
  });
}

/**
 * Get domain category for a domain
 * @param {string} domain - Domain name
 * @returns {Array} Array of matching categories
 */
function getDomainCategories(domain) {
  if (!domain) return [];

  const lowerDomain = domain.toLowerCase();
  const categories = [];

  for (const [category, domains] of Object.entries(DOMAIN_CATEGORIES)) {
    if (domains.some(d => lowerDomain.includes(d.toLowerCase()))) {
      categories.push(category);
    }
  }

  return categories;
}

/**
 * Detect query intent using pattern matching
 * @param {string} query - User query
 * @returns {Object} Detected intent with categories
 */
function detectQueryIntent(query) {
  if (!query) return { intent: null, categories: [] };

  const lowerQuery = query.toLowerCase();
  console.log('[DetectQueryIntent] Checking query:', lowerQuery);

  for (const { pattern, intent, categories } of INTENT_PATTERNS) {
    if (pattern.test(lowerQuery)) {
      console.log('[DetectQueryIntent] Matched pattern:', pattern.toString(), '→ intent:', intent, 'categories:', categories);
      return { intent, categories };
    }
  }

  console.log('[DetectQueryIntent] No intent pattern matched');
  return { intent: null, categories: [] };
}

/**
 * Get categories from semantic concepts in query
 * @param {string} query - User query
 * @returns {Array} Array of category names
 */
function getCategoriesFromConcepts(query) {
  if (!query) return [];

  const lowerQuery = query.toLowerCase();
  const categories = new Set();
  const matchedConcepts = [];

  // Check multi-word concepts first (like "social media", "wasting time")
  for (const [concept, cats] of Object.entries(SEMANTIC_CONCEPTS)) {
    if (concept.includes(' ')) {
      if (lowerQuery.includes(concept)) {
        cats.forEach(c => categories.add(c));
        matchedConcepts.push({ concept, categories: cats });
      }
    }
  }

  // Check single-word concepts
  const words = lowerQuery.split(/\s+/);
  for (const word of words) {
    // Check direct concept match
    if (SEMANTIC_CONCEPTS[word]) {
      SEMANTIC_CONCEPTS[word].forEach(c => categories.add(c));
      matchedConcepts.push({ concept: word, categories: SEMANTIC_CONCEPTS[word] });
    }

    // Check partial matches for stemming (e.g., "distracts" -> "distract")
    for (const [concept, cats] of Object.entries(SEMANTIC_CONCEPTS)) {
      if (!concept.includes(' ') && (word.startsWith(concept) || concept.startsWith(word))) {
        if (word.length >= 4 && concept.length >= 4) { // Avoid false positives
          cats.forEach(c => categories.add(c));
          matchedConcepts.push({ concept, categories: cats, matchedWord: word });
        }
      }
    }
  }

  if (matchedConcepts.length > 0) {
    console.log('[GetCategoriesFromConcepts] Matched concepts:', matchedConcepts);
  } else {
    console.log('[GetCategoriesFromConcepts] No concepts matched');
  }

  const result = Array.from(categories);
  console.log('[GetCategoriesFromConcepts] Result categories:', result);
  return result;
}

/**
 * Get LLM-based expansions for a keyword that's not in hardcoded mappings
 * @param {string} keyword - Keyword to expand
 * @returns {Promise<Array>} Array of expanded terms/synonyms
 */
async function getLLMExpansions(keyword) {
  const lowerKeyword = keyword.toLowerCase();

  // Check cache first
  if (LLM_EXPANSION_CACHE.has(lowerKeyword)) {
    return LLM_EXPANSION_CACHE.get(lowerKeyword);
  }

  // Check if there's already a pending request for this keyword
  if (PENDING_LLM_REQUESTS.has(lowerKeyword)) {
    return PENDING_LLM_REQUESTS.get(lowerKeyword);
  }

  // Check if LLM is available
  if (typeof callLLM === 'undefined') {
    // LLM not available, return empty array
    return [];
  }

  // Create a promise for this request
  const expansionPromise = (async () => {
    try {
      // Check if LLM functions are available
      if (typeof getLLMConfig === 'undefined') {
        return [];
      }

      // Build a concise prompt that asks for quick expansions only
      const prompt = `Generate 3-5 synonyms, related terms, or expansions for the keyword "${keyword}" that would help find relevant web content. Return ONLY a JSON array of strings, no explanation. Example: ["term1", "term2", "term3"]`;

      // Get LLM config with a short timeout for fast response
      const config = await getLLMConfig();
      config.timeout = 5000; // 5 second timeout for quick response

      const response = await callLLM(prompt, config);

      // Try to parse JSON array from response
      let expansions = [];
      try {
        // Remove markdown code blocks if present
        let jsonStr = response.trim();
        jsonStr = jsonStr.replace(/^```json\s*/i, '');
        jsonStr = jsonStr.replace(/^```\s*/, '');
        jsonStr = jsonStr.replace(/\s*```$/, '');
        jsonStr = jsonStr.trim();

        // Try to find JSON array in response
        const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          expansions = JSON.parse(arrayMatch[0]);
        } else {
          // If not an array, try parsing as single JSON
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed)) {
            expansions = parsed;
          } else if (typeof parsed === 'object' && parsed.expansions) {
            expansions = parsed.expansions;
          } else if (typeof parsed === 'object' && parsed.synonyms) {
            expansions = parsed.synonyms;
          }
        }
      } catch (parseError) {
        // If JSON parsing fails, try to extract terms from plain text
        // Split by common delimiters and clean up
        const terms = response
          .split(/[,\n]/)
          .map(t => t.trim().replace(/^["']|["']$/g, ''))
          .filter(t => t.length > 0 && t.length < 50) // Reasonable length
          .slice(0, 5); // Max 5 terms
        expansions = terms;
      }

      // Validate and clean expansions
      if (!Array.isArray(expansions)) {
        expansions = [];
      }

      // Filter out the original keyword and ensure all are strings
      expansions = expansions
        .filter(term => typeof term === 'string' && term.toLowerCase() !== lowerKeyword)
        .map(term => term.toLowerCase().trim())
        .filter(term => term.length > 0)
        .slice(0, 5); // Limit to 5 expansions

      // Cache the result
      LLM_EXPANSION_CACHE.set(lowerKeyword, expansions);

      return expansions;
    } catch (error) {
      console.warn(`[Semantic Expansion] LLM expansion failed for "${keyword}":`, error.message);
      // Cache empty result to avoid repeated failures
      LLM_EXPANSION_CACHE.set(lowerKeyword, []);
      return [];
    } finally {
      // Remove from pending requests
      PENDING_LLM_REQUESTS.delete(lowerKeyword);
    }
  })();

  // Store the promise in pending requests
  PENDING_LLM_REQUESTS.set(lowerKeyword, expansionPromise);

  return expansionPromise;
}

/**
 * Parse LLM response for batched expansion
 * @param {string} response - LLM response string
 * @returns {Object} Parsed object mapping keywords to expansion arrays
 */
function parseExpansionResponse(response) {
  if (!response) return {};

  let jsonStr = response.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    // Try to find JSON object in response
    const objMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objMatch) {
      const parsed = JSON.parse(objMatch[0]);
      // Validate and clean the result
      const result = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (Array.isArray(value)) {
          result[key.toLowerCase()] = value
            .filter(v => typeof v === 'string' && v.length > 0)
            .map(v => v.toLowerCase().trim())
            .slice(0, 5); // Limit to 5 expansions per keyword
        }
      }
      return result;
    }
  } catch (e) {
    console.warn('[ParseExpansion] JSON parse failed:', e.message);
  }
  return {};
}

/**
 * Get batched LLM expansions for multiple keywords in a single call
 * More efficient than calling getLLMExpansions for each keyword separately
 * @param {Array} keywords - Array of keywords to expand
 * @returns {Promise<Object>} Object mapping keywords to expansion arrays
 */
async function getBatchedLLMExpansions(keywords) {
  if (!keywords || keywords.length === 0) return {};

  // Check if LLM is available
  if (typeof callLLM === 'undefined' || typeof getLLMConfig === 'undefined') {
    return {};
  }

  // Check cache for all keywords first
  const uncachedKeywords = [];
  const result = {};

  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    if (LLM_EXPANSION_CACHE.has(lowerKeyword)) {
      result[keyword] = LLM_EXPANSION_CACHE.get(lowerKeyword);
      console.log(`[BatchedExpansion] Cache hit for "${keyword}":`, result[keyword]);
    } else {
      uncachedKeywords.push(keyword);
    }
  }

  // If all cached, return immediately
  if (uncachedKeywords.length === 0) {
    console.log('[BatchedExpansion] All keywords cached, skipping LLM call');
    return result;
  }

  console.log('[BatchedExpansion] Uncached keywords:', uncachedKeywords);

  // Single LLM call for all uncached keywords
  const prompt = `Generate 3 synonyms or related terms for each keyword that would help find relevant web content. Return ONLY a JSON object, no explanation.
Keywords: ${uncachedKeywords.join(', ')}
Format: {"keyword1": ["term1", "term2", "term3"], "keyword2": ["term1", "term2", "term3"]}`;

  try {
    const config = await getLLMConfig();
    config.timeout = 5000; // 5 second timeout

    console.log('[BatchedExpansion] Calling LLM for', uncachedKeywords.length, 'keywords');
    const startTime = Date.now();
    const response = await callLLM(prompt, config);
    const elapsed = Date.now() - startTime;
    console.log(`[BatchedExpansion] LLM response received in ${elapsed}ms`);

    const parsed = parseExpansionResponse(response);
    console.log('[BatchedExpansion] Parsed expansions:', parsed);

    // Cache and add to result
    for (const keyword of uncachedKeywords) {
      const lowerKeyword = keyword.toLowerCase();
      // Try exact match (response keys are lowercased by parseExpansionResponse)
      const expansions = parsed[lowerKeyword] || [];
      LLM_EXPANSION_CACHE.set(lowerKeyword, expansions);
      result[keyword] = expansions;
    }
  } catch (error) {
    console.warn('[BatchedExpansion] LLM call failed:', error.message);
    // Cache empty results to avoid repeated failures
    for (const keyword of uncachedKeywords) {
      LLM_EXPANSION_CACHE.set(keyword.toLowerCase(), []);
      result[keyword] = [];
    }
  }

  return result;
}

/**
 * Expand keywords using synonyms (hardcoded) and LLM (for unmapped keywords)
 * Uses batched LLM call for efficiency when multiple keywords need expansion
 * @param {Array} keywords - Original keywords
 * @param {boolean} useLLM - Whether to use LLM for unmapped keywords (default: true)
 * @returns {Promise<Array>} Expanded keywords
 */
async function expandKeywords(keywords, useLLM = true) {
  console.log('[ExpandKeywords] Starting expansion for keywords:', keywords);
  const expanded = new Set(keywords);
  const unmappedKeywords = [];
  const hardcodedExpansions = {};

  // First, expand using hardcoded synonyms
  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    if (SYNONYMS[lowerKeyword]) {
      const synonyms = SYNONYMS[lowerKeyword];
      synonyms.forEach(syn => expanded.add(syn));
      hardcodedExpansions[keyword] = synonyms;
      console.log(`[ExpandKeywords] Found hardcoded synonyms for "${keyword}":`, synonyms);
    } else if (useLLM && keyword.length >= 3) {
      // Only use LLM for keywords that are at least 3 characters
      unmappedKeywords.push(keyword);
    }
  }

  if (Object.keys(hardcodedExpansions).length > 0) {
    console.log('[ExpandKeywords] Hardcoded expansions:', hardcodedExpansions);
  }

  // If LLM is enabled and we have unmapped keywords, get batched LLM expansions
  if (useLLM && unmappedKeywords.length > 0 && typeof callLLM !== 'undefined') {
    console.log('[ExpandKeywords] Unmapped keywords (using batched LLM):', unmappedKeywords);

    // Single batched LLM call for all unmapped keywords
    const batchedExpansions = await getBatchedLLMExpansions(unmappedKeywords);

    // Add expansions to the set
    for (const [keyword, expansions] of Object.entries(batchedExpansions)) {
      if (expansions && expansions.length > 0) {
        console.log(`[ExpandKeywords] LLM expansions for "${keyword}":`, expansions);
        expansions.forEach(term => expanded.add(term.toLowerCase()));
      } else {
        console.log(`[ExpandKeywords] No LLM expansions for "${keyword}"`);
      }
    }
  } else if (unmappedKeywords.length > 0) {
    console.log('[ExpandKeywords] LLM not available, skipping expansion for:', unmappedKeywords);
  }

  const finalExpanded = Array.from(expanded);
  console.log('[ExpandKeywords] Final expanded keywords:', finalExpanded);
  return finalExpanded;
}

/**
 * Semantic filter operation (contract-based)
 * Filters visits based on semantic query using heuristics, intent detection, and concept mapping
 * Now supports LLM-based expansion for unmapped keywords
 */
async function semanticFilter(ctx, params) {
  const data = ctx.data;
  const query = params.query || '';

  console.log('[SemanticFilter] ========================================');
  console.log('[SemanticFilter] Starting semantic filter');
  console.log('[SemanticFilter] Query:', query);
  console.log('[SemanticFilter] Input data count:', data.length);

  if (!query) {
    console.log('[SemanticFilter] No query provided, returning all data');
    return data; // No filter if no query
  }

  const lowerQuery = query.toLowerCase();

  // 1. Detect query intent (highest priority)
  const { intent, categories: intentCategories } = detectQueryIntent(query);
  console.log('[SemanticFilter] Intent detection:', { intent, categories: intentCategories });

  // 2. Get categories from semantic concepts
  const conceptCategories = getCategoriesFromConcepts(query);
  console.log('[SemanticFilter] Concept categories:', conceptCategories);

  // 3. Check for direct category mentions
  const mentionedCategories = [];
  for (const category of Object.keys(DOMAIN_CATEGORIES)) {
    if (lowerQuery.includes(category)) {
      mentionedCategories.push(category);
    }
  }
  console.log('[SemanticFilter] Mentioned categories:', mentionedCategories);

  // 4. Combine all relevant categories
  const allRelevantCategories = new Set([
    ...intentCategories,
    ...conceptCategories,
    ...mentionedCategories
  ]);
  console.log('[SemanticFilter] All relevant categories:', Array.from(allRelevantCategories));

  // 5. Extract and expand keywords (now async with LLM support)
  const keywords = await extractKeywords(query);
  console.log('[SemanticFilter] Extracted keywords:', keywords);

  const expandedKeywords = await expandKeywords(keywords, true); // Enable LLM expansion
  console.log('[SemanticFilter] Expanded keywords:', expandedKeywords);
  console.log('[SemanticFilter] Expansion added:', expandedKeywords.length - keywords.length, 'new terms');

  // If we have relevant categories from intent/concepts, prioritize category-based filtering
  const hasCategoryContext = allRelevantCategories.size > 0;
  console.log('[SemanticFilter] Has category context:', hasCategoryContext);

  // Track matches by priority for debugging
  const matchStats = {
    categoryMatch: 0,
    titleMatch: 0,
    urlMatch: 0,
    domainMatch: 0,
    domainCategoryMatch: 0,
    noMatch: 0
  };

  // Filter visits
  const filtered = data.filter(v => {
    const domain = getDomain(v.url);
    const domainCats = getDomainCategories(domain);
    const title = v.title || '';
    const titleLower = title.toLowerCase();
    const url = v.url || '';
    const urlLower = url.toLowerCase();

    let matched = false;
    let matchReason = '';

    // Priority 1: Match by detected categories (from intent or concepts)
    if (hasCategoryContext) {
      if (domainCats.some(cat => allRelevantCategories.has(cat))) {
        matched = true;
        matchReason = `category:${domainCats.find(cat => allRelevantCategories.has(cat))}`;
        matchStats.categoryMatch++;
      }
    }

    // Priority 2: Match keywords in title (case-sensitive for uppercase acronyms)
    if (!matched && containsKeywords(title, expandedKeywords)) {
      // Find which keywords matched (for logging)
      const matchedKeywords = expandedKeywords.filter(kw => {
        if (kw === kw.toUpperCase() && kw.length >= 2 && /^[A-Z]+$/.test(kw)) {
          return title.includes(kw);
        } else {
          return titleLower.includes(kw.toLowerCase());
        }
      });
      matched = true;
      matchReason = `title:${matchedKeywords.join(',')}`;
      matchStats.titleMatch++;
    }

    // Priority 3: Match keywords in URL (case-sensitive for uppercase acronyms)
    if (!matched && containsKeywords(url, expandedKeywords)) {
      // Find which keywords matched (for logging)
      const matchedKeywords = expandedKeywords.filter(kw => {
        if (kw === kw.toUpperCase() && kw.length >= 2 && /^[A-Z]+$/.test(kw)) {
          return url.includes(kw);
        } else {
          return urlLower.includes(kw.toLowerCase());
        }
      });
      matched = true;
      matchReason = `url:${matchedKeywords.join(',')}`;
      matchStats.urlMatch++;
    }

    // Priority 4: Match domain against keywords
    if (!matched) {
      for (const keyword of expandedKeywords) {
        // Case-sensitive for uppercase acronyms, case-insensitive for others
        let domainMatches = false;
        if (keyword === keyword.toUpperCase() && keyword.length >= 2 && /^[A-Z]+$/.test(keyword)) {
          domainMatches = domain && domain.includes(keyword);
        } else {
          domainMatches = domain && domain.toLowerCase().includes(keyword.toLowerCase());
        }
        if (domainMatches) {
          matched = true;
          matchReason = `domain:${keyword}`;
          matchStats.domainMatch++;
          break;
        }
      }
    }

    // Priority 5: Match domain categories against keywords
    if (!matched) {
      for (const keyword of expandedKeywords) {
        if (domainCats.some(cat => cat.includes(keyword) || keyword.includes(cat))) {
          matched = true;
          matchReason = `domainCategory:${keyword}`;
          matchStats.domainCategoryMatch++;
          break;
        }
      }
    }

    if (!matched) {
      matchStats.noMatch++;
    } else {
      // Log first few matches for debugging
      if (matchStats.categoryMatch + matchStats.titleMatch + matchStats.urlMatch +
          matchStats.domainMatch + matchStats.domainCategoryMatch <= 5) {
        console.log(`[SemanticFilter] Match: ${domain} | ${title.substring(0, 60)} | Reason: ${matchReason}`);
      }
    }

    return matched;
  });

  console.log('[SemanticFilter] Match statistics:', matchStats);
  console.log('[SemanticFilter] Filtered results count:', filtered.length);
  console.log('[SemanticFilter] ========================================');

  // If no results and we had category context, this is expected behavior
  // (user asked about something not in their history)
  return filtered;
}

/**
 * Filter by keywords operation (contract-based)
 */
function filterByKeywords(ctx, params) {
  const data = ctx.data;
  const keywords = params.keywords || [];
  const fields = params.fields || ['title', 'url'];

  if (!Array.isArray(keywords) || keywords.length === 0) {
    return data;
  }

  const lowerKeywords = keywords.map(k => k.toLowerCase());

  return data.filter(v => {
    for (const field of fields) {
      const value = v[field] || '';
      if (containsKeywords(value, lowerKeywords)) {
        return true;
      }
    }
    return false;
  });
}

/**
 * Find pending links operation (contract-based)
 * Finds links that were visited once and are old (long pending to read)
 */
function findPendingLinks(ctx, params) {
  const data = ctx.data;
  const daysOld = params.days_old || 7; // Default: older than 7 days

  // Group by URL to find single-visit URLs
  const urlCounts = {};
  data.forEach(v => {
    const normalizedUrl = normalizeUrl(v.url);
    if (!urlCounts[normalizedUrl]) {
      urlCounts[normalizedUrl] = [];
    }
    urlCounts[normalizedUrl].push(v);
  });

  // Find URLs visited only once
  const singleVisitUrls = Object.entries(urlCounts)
    .filter(([url, visits]) => visits.length === 1)
    .map(([url, visits]) => visits[0]);

  // Filter by age
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const pending = singleVisitUrls.filter(v => {
    const visitDate = new Date(v.visited_at);
    return visitDate < cutoffDate;
  });

  // Sort by age (oldest first)
  return pending.sort((a, b) =>
    new Date(a.visited_at) - new Date(b.visited_at)
  );
}

/**
 * Find distracting content operation (contract-based)
 * Identifies content from distracting domains (social media, entertainment)
 */
function findDistractingContent(ctx, params) {
  const data = ctx.data;
  const distractingCategories = ['social', 'entertainment'];

  return data.filter(v => {
    const domain = getDomain(v.url);
    const categories = getDomainCategories(domain);
    return categories.some(cat => distractingCategories.includes(cat));
  });
}

/**
 * Find stopped caring operation (contract-based)
 * Finds domains that were visited before but not recently
 */
function findStoppedCaring(ctx, params) {
  const data = ctx.data;
  const recentDays = params.recent_days || 30;

  // Get all unique domains
  const domainVisits = {};
  data.forEach(v => {
    const domain = getDomain(v.url);
    if (domain) {
      if (!domainVisits[domain]) {
        domainVisits[domain] = [];
      }
      domainVisits[domain].push(v);
    }
  });

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - recentDays);

  // Find domains with no recent visits
  const stoppedCaring = [];
  for (const [domain, visits] of Object.entries(domainVisits)) {
    const hasRecentVisit = visits.some(v => new Date(v.visited_at) >= cutoffDate);
    if (!hasRecentVisit && visits.length > 0) {
      // Get the last visit date
      const lastVisit = visits.sort((a, b) =>
        new Date(b.visited_at) - new Date(a.visited_at)
      )[0];

      stoppedCaring.push({
        domain: domain,
        last_visit: lastVisit.visited_at,
        total_visits: visits.length,
        days_since_last_visit: Math.floor((new Date() - new Date(lastVisit.visited_at)) / (1000 * 60 * 60 * 24))
      });
    }
  }

  // Sort by days since last visit (most abandoned first)
  return stoppedCaring.sort((a, b) => b.days_since_last_visit - a.days_since_last_visit);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    semanticFilter,
    filterByKeywords,
    findPendingLinks,
    findDistractingContent,
    findStoppedCaring,
    extractKeywords,
    getDomainCategories,
    detectQueryIntent,
    getCategoriesFromConcepts,
    expandKeywords
  };
}




