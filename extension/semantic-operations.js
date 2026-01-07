// Semantic Operations (v1 - Local Heuristics)
// Rule-based semantic filtering using domain lists, keywords, and heuristics

// Domain category mappings for semantic filtering
const DOMAIN_CATEGORIES = {
  'news': ['cnn.com', 'bbc.com', 'nytimes.com', 'theguardian.com', 'reuters.com', 'wsj.com', 'npr.org', 'ap.org', 'bloomberg.com', 'economist.com'],
  'shopping': ['amazon.com', 'ebay.com', 'etsy.com', 'shopify.com', 'target.com', 'walmart.com', 'aliexpress.com'],
  'social': ['facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'linkedin.com', 'reddit.com', 'tiktok.com', 'pinterest.com'],
  'entertainment': ['netflix.com', 'hulu.com', 'disney.com', 'spotify.com', 'twitch.tv', 'youtube.com'],
  'clothing': ['etsy.com', 'zara.com', 'h&m', 'nike.com', 'adidas.com', 'asos.com', 'fashion', 'clothing', 'apparel'],
  'food': ['allrecipes.com', 'foodnetwork.com', 'epicurious.com', 'bonappetit.com', 'tasty.co', 'recipe'],
  'italian': ['italian', 'italy', 'pasta', 'pizza', 'risotto', 'tiramisu'],
  'politics': ['politico.com', 'fivethirtyeight.com', 'realclearpolitics.com', 'politico', 'election', 'vote', 'senate', 'congress']
};

// Stop words to filter out from queries
const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'you', 'your', 'yours', 'he', 'she', 'it', 'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'now']);

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
 * Semantic filter operation (contract-based)
 * Filters visits based on semantic query using heuristics
 */
function semanticFilter(ctx, params) {
  const data = ctx.data;
  const query = params.query || '';

  if (!query) {
    return data; // No filter if no query
  }

  const keywords = extractKeywords(query);
  const lowerQuery = query.toLowerCase();

  // Check for category mentions
  const mentionedCategories = [];
  for (const [category, domains] of Object.entries(DOMAIN_CATEGORIES)) {
    if (lowerQuery.includes(category)) {
      mentionedCategories.push(category);
    }
  }

  // Filter visits
  const filtered = data.filter(v => {
    const domain = getDomain(v.url);
    const title = (v.title || '').toLowerCase();
    const url = v.url.toLowerCase();

    // Check domain categories
    if (mentionedCategories.length > 0) {
      const domainCats = getDomainCategories(domain);
      if (domainCats.some(cat => mentionedCategories.includes(cat))) {
        return true;
      }
    }

    // Check keywords in title
    if (containsKeywords(title, keywords)) {
      return true;
    }

    // Check keywords in URL
    if (containsKeywords(url, keywords)) {
      return true;
    }

    // Check domain categories based on keywords
    for (const keyword of keywords) {
      const domainCats = getDomainCategories(domain);
      if (domainCats.some(cat => cat.includes(keyword) || keyword.includes(cat))) {
        return true;
      }
    }

    return false;
  });

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
    getDomainCategories
  };
}


