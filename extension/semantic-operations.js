// Semantic Operations (v2 - Enhanced Local Heuristics)
// Rule-based semantic filtering using domain lists, keywords, intent detection, and heuristics

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

// Stop words to filter out from queries
const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'you', 'your', 'yours', 'he', 'she', 'it', 'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'now', 'about', 'kind', 'type', 'types', 'kinds', 'content', 'stuff', 'things', 'thing', 'site', 'sites', 'website', 'websites', 'page', 'pages', 'link', 'links', 'visit', 'visited', 'browse', 'browsed', 'browsing', 'look', 'looked', 'looking', 'find', 'found', 'show', 'get', 'see', 'seen']);

/**
 * Extract keywords from query string
 * @param {string} query - User query
 * @returns {Array} Array of keywords
 */
function extractKeywords(query) {
  if (!query) return [];

  // Convert to lowercase and split by non-word characters
  const words = query.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));

  return words;
}

/**
 * Check if text contains keywords (case-insensitive)
 * @param {string} text - Text to search
 * @param {Array} keywords - Keywords to find
 * @returns {boolean} True if any keyword is found
 */
function containsKeywords(text, keywords) {
  if (!text || !keywords || keywords.length === 0) return false;

  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword));
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

  for (const { pattern, intent, categories } of INTENT_PATTERNS) {
    if (pattern.test(lowerQuery)) {
      return { intent, categories };
    }
  }

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

  // Check multi-word concepts first (like "social media", "wasting time")
  for (const [concept, cats] of Object.entries(SEMANTIC_CONCEPTS)) {
    if (concept.includes(' ')) {
      if (lowerQuery.includes(concept)) {
        cats.forEach(c => categories.add(c));
      }
    }
  }

  // Check single-word concepts
  const words = lowerQuery.split(/\s+/);
  for (const word of words) {
    // Check direct concept match
    if (SEMANTIC_CONCEPTS[word]) {
      SEMANTIC_CONCEPTS[word].forEach(c => categories.add(c));
    }

    // Check partial matches for stemming (e.g., "distracts" -> "distract")
    for (const [concept, cats] of Object.entries(SEMANTIC_CONCEPTS)) {
      if (!concept.includes(' ') && (word.startsWith(concept) || concept.startsWith(word))) {
        if (word.length >= 4 && concept.length >= 4) { // Avoid false positives
          cats.forEach(c => categories.add(c));
        }
      }
    }
  }

  return Array.from(categories);
}

/**
 * Expand keywords using synonyms
 * @param {Array} keywords - Original keywords
 * @returns {Array} Expanded keywords
 */
function expandKeywords(keywords) {
  const expanded = new Set(keywords);

  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    if (SYNONYMS[lowerKeyword]) {
      SYNONYMS[lowerKeyword].forEach(syn => expanded.add(syn));
    }
  }

  return Array.from(expanded);
}

/**
 * Semantic filter operation (contract-based)
 * Filters visits based on semantic query using heuristics, intent detection, and concept mapping
 */
function semanticFilter(ctx, params) {
  const data = ctx.data;
  const query = params.query || '';

  if (!query) {
    return data; // No filter if no query
  }

  const lowerQuery = query.toLowerCase();

  // 1. Detect query intent (highest priority)
  const { intent, categories: intentCategories } = detectQueryIntent(query);

  // 2. Get categories from semantic concepts
  const conceptCategories = getCategoriesFromConcepts(query);

  // 3. Check for direct category mentions
  const mentionedCategories = [];
  for (const category of Object.keys(DOMAIN_CATEGORIES)) {
    if (lowerQuery.includes(category)) {
      mentionedCategories.push(category);
    }
  }

  // 4. Combine all relevant categories
  const allRelevantCategories = new Set([
    ...intentCategories,
    ...conceptCategories,
    ...mentionedCategories
  ]);

  // 5. Extract and expand keywords
  const keywords = extractKeywords(query);
  const expandedKeywords = expandKeywords(keywords);

  // If we have relevant categories from intent/concepts, prioritize category-based filtering
  const hasCategoryContext = allRelevantCategories.size > 0;

  // Filter visits
  const filtered = data.filter(v => {
    const domain = getDomain(v.url);
    const domainCats = getDomainCategories(domain);
    const title = (v.title || '').toLowerCase();
    const url = v.url.toLowerCase();

    // Priority 1: Match by detected categories (from intent or concepts)
    if (hasCategoryContext) {
      if (domainCats.some(cat => allRelevantCategories.has(cat))) {
        return true;
      }
    }

    // Priority 2: Match keywords in title
    if (containsKeywords(title, expandedKeywords)) {
      return true;
    }

    // Priority 3: Match keywords in URL
    if (containsKeywords(url, expandedKeywords)) {
      return true;
    }

    // Priority 4: Match domain against keywords
    for (const keyword of expandedKeywords) {
      if (domain && domain.toLowerCase().includes(keyword)) {
        return true;
      }
    }

    // Priority 5: Match domain categories against keywords
    for (const keyword of expandedKeywords) {
      if (domainCats.some(cat => cat.includes(keyword) || keyword.includes(cat))) {
        return true;
      }
    }

    return false;
  });

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



