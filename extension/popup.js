// System categories with predefined domains
const SYSTEM_CATEGORIES = {
  'Social Media': [
    'facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'linkedin.com',
    'reddit.com', 'tiktok.com', 'youtube.com', 'pinterest.com', 'snapchat.com'
  ],
  'News': [
    'cnn.com', 'bbc.com', 'nytimes.com', 'theguardian.com', 'reuters.com',
    'wsj.com', 'npr.org'
  ],
  'Shopping': [
    'amazon.com', 'ebay.com', 'etsy.com', 'shopify.com', 'target.com', 'walmart.com'
  ],
  'Productivity': [
    'github.com', 'stackoverflow.com', 'google.com', 'docs.google.com',
    'drive.google.com', 'notion.so', 'trello.com', 'slack.com', 'zoom.us'
  ],
  'Entertainment': [
    'netflix.com', 'hulu.com', 'disney.com', 'spotify.com', 'twitch.tv'
  ],
  'Education': [
    'coursera.org', 'edx.org', 'khanacademy.org', 'udemy.com'
  ]
};

// Category structure for local mode navigation (Stats before Trends)
const OPERATION_CATEGORIES = {
  history: {
    title: 'Navigation & History',
    subtitle: 'Tracing the browsing paths you\'ve taken',
    operations: [
      {
        id: 'neighbor_visits',
        name: 'Neighbor visits',
        icon: '🔗',
        help: 'Show pages visited near the same time as a given page.'
      },
      {
        id: 'before_after_navigation',
        name: 'Before/after navigation',
        icon: '🧭',
        help: 'Show pages visited before or after a specific page.'
      },
      {
        id: 'sessions',
        name: 'Sessions',
        icon: '📅',
        help: 'Group browsing activity into sessions based on time gaps.'
      }
    ]
  },
  stats: {
    title: 'Stats',
    subtitle: 'Quantifying your browsing behavior',
    operations: [
      {
        id: 'top_links',
        name: 'Top visited links',
        icon: '🔗',
        help: 'Most frequently visited URLs.'
      },
      {
        id: 'top_domains',
        name: 'Top domains',
        icon: '🌐',
        help: 'Most frequently visited domains.'
      },
      // {
      //   id: 'top_domains_by_day',
      //   name: 'Top domains by day',
      //   icon: '📅',
      //   help: 'Most visited domains per day.'
      // },
      // {
      //   id: 'domain_frequency',
      //   name: 'Domain frequency',
      //   icon: '📊',
      //   help: 'Frequency distribution of domain visits.'
      // },
      // {
      //   id: 'visits_by_time_of_day',
      //   name: 'Visits by time of day',
      //   icon: '⏰',
      //   help: 'Browsing volume grouped by time of day.'
      // },
      {
        id: 'domain_time_distribution',
        name: 'Domain time distribution',
        icon: '⏱️',
        help: 'Time-of-day distribution per domain.'
      },
      {
        id: 'browser_usage_timeline',
        name: 'Browser usage timeline',
        icon: '📈',
        help: 'Timeline view of browsing activity.'
      }
    ]
  },
  trends: {
    title: 'Trends',
    subtitle: 'Patterns that emerge over time',
    operations: [
      {
        id: 'navigation_paths',
        name: 'Most common navigation paths',
        icon: '🛤️',
        help: 'Identify commonly repeated navigation paths.'
      },
      {
        id: 'repeated_patterns',
        name: 'Repeated patterns',
        icon: '🔄',
        help: 'Detect recurring browsing sequences or behaviors.'
      },
      {
        id: 'daily_summary',
        name: 'Daily browsing summary',
        icon: '📊',
        help: 'Summarize browsing activity for a given day.'
      },
      // {
      //   id: 'repeated_daily_habits',
      //   name: 'Repeated daily habits',
      //   icon: '📅',
      //   help: 'Identify behaviors that repeat daily or regularly.'
      // },
      {
        id: 'emerging_interests',
        name: 'Emerging interests',
        icon: '📈',
        help: 'Detect new or increasing areas of interest.'
      },
      {
        id: 'category_inference',
        name: 'Category interests',
        icon: '🏷️',
        help: 'Infer category interests based on browsing behavior and domains.'
      },
      {
        id: 'productivity_vs_distraction',
        name: 'Productivity vs distraction',
        icon: '⚖️',
        help: 'Classify browsing as productive or distracting.'
      }
    ]
  }
};

// Navigation state
let currentView = 'categories'; // 'categories', 'operations', 'operationForm', 'settings'
let currentCategory = null;
let currentOperation = null;

// User-defined categories (loaded from storage)
let userCategories = {};
// System category overrides (user modifications to system categories)
let systemCategoryOverrides = {};

// Load user-defined categories from storage
async function loadUserCategories() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['userCategories', 'systemCategoryOverrides'], (result) => {
      userCategories = result.userCategories || {};
      systemCategoryOverrides = result.systemCategoryOverrides || {};
      resolve(userCategories);
    });
  });
}

// Save user-defined categories to storage
function saveUserCategories() {
  chrome.storage.local.set({ userCategories, systemCategoryOverrides });
}

// Get system category with user overrides applied
function getSystemCategoryWithOverrides(categoryName) {
  const baseDomains = [...(SYSTEM_CATEGORIES[categoryName] || [])];
  const overrides = systemCategoryOverrides[categoryName] || {};
  const added = overrides.added || [];
  const removed = overrides.removed || [];

  // Start with base domains, add user-added, remove user-removed
  const domains = [...new Set([...baseDomains, ...added].filter(d => !removed.includes(d)))];
  return domains;
}

// Update category mapping after loading user categories
function updateCategoryMapping() {
  // This will be called after userCategories is loaded
}

// Update category navigation links based on current category
function updateCategoryNavLinks() {
  const links = document.querySelectorAll('.category-nav-link[data-category]');
  links.forEach(link => {
    const categoryId = link.dataset.category;
    if (categoryId === 'settings') {
      // Settings link is always clickable (not active unless we're in settings)
      if (currentView === 'settings') {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
      return;
    }
    if (categoryId === currentCategory) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Utility functions
function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (e) {
    return null;
  }
}

// Extract main domain from a domain (handles subdomains)
// Examples: accounts.instagram.com -> instagram.com, old.reddit.com -> reddit.com
// Handles special cases like co.uk, com.au, etc.
function getMainDomain(domain) {
  if (!domain) return null;

  // Remove www. prefix if present
  domain = domain.replace(/^www\./, '');

  const parts = domain.split('.');

  // If domain has 2 or fewer parts, return as is (e.g., example.com, localhost)
  if (parts.length <= 2) return domain;

  // Handle special two-part TLDs (e.g., co.uk, com.au, org.uk)
  const twoPartTLDs = ['co.uk', 'com.au', 'org.uk', 'net.au', 'gov.uk', 'ac.uk', 'edu.au', 'gov.au'];
  const lastTwoParts = parts.slice(-2).join('.');

  if (twoPartTLDs.includes(lastTwoParts)) {
    // For two-part TLDs, we need the last 3 parts (e.g., example.co.uk)
    if (parts.length >= 3) {
      return parts.slice(-3).join('.');
    }
    return domain;
  }

  // For regular domains, return last 2 parts (e.g., accounts.instagram.com -> instagram.com)
  return parts.slice(-2).join('.');
}

function getUrlDisplayLabel(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, '');
    const path = urlObj.pathname;
    const search = urlObj.search;

    // If it's just the root path, show only domain
    if (path === '/' && !search) {
      return domain;
    }

    // Combine path and query params, truncate if too long
    const pathAndQuery = path + search;
    const fullLabel = domain + pathAndQuery;

    // Truncate if longer than 60 characters, but try to keep it meaningful
    if (fullLabel.length > 60) {
      // Try to truncate at a reasonable point (e.g., before query params if they're very long)
      if (search && fullLabel.length > 60) {
        const pathOnly = domain + path;
        if (pathOnly.length <= 60) {
          return pathOnly + '...';
        }
      }
      return fullLabel.substring(0, 57) + '...';
    }

    return fullLabel;
  } catch (e) {
    // If parsing fails, return truncated original URL
    return url.length > 60 ? url.substring(0, 57) + '...' : url;
  }
}

// Get all categories (system + user, with user taking priority)
function getAllCategories() {
  // Merge system and user categories, user categories override system
  const allCategories = { ...SYSTEM_CATEGORIES };
  Object.keys(userCategories).forEach(catName => {
    allCategories[catName] = [...(allCategories[catName] || []), ...userCategories[catName]];
    // Remove duplicates
    allCategories[catName] = [...new Set(allCategories[catName])];
  });
  return allCategories;
}

function getCategory(domain) {
  if (!domain) return 'Other';

  // Extract main domain from subdomain (e.g., accounts.instagram.com -> instagram.com)
  const mainDomain = getMainDomain(domain);

  // First check user-defined categories (exact match first, then main domain match)
  for (const [categoryName, domains] of Object.entries(userCategories)) {
    if (domains && Array.isArray(domains)) {
      // Check exact match first
      if (domains.includes(domain)) {
        return categoryName;
      }
      // Check if main domain matches
      if (mainDomain && domains.includes(mainDomain)) {
        return categoryName;
      }
      // Then check partial matches (for backwards compatibility)
      for (const catDomain of domains) {
        const catMainDomain = getMainDomain(catDomain);
        // Check if main domains match
        if (mainDomain && catMainDomain && mainDomain === catMainDomain) {
          return categoryName;
        }
        // Also check if domain includes category domain or vice versa
        if (domain.includes(catDomain) || catDomain.includes(domain)) {
          return categoryName;
        }
      }
    }
  }

  // Then check system categories (with user overrides applied)
  for (const categoryName of Object.keys(SYSTEM_CATEGORIES)) {
    const domains = getSystemCategoryWithOverrides(categoryName);
    if (domains && Array.isArray(domains)) {
      // Check exact match first
      if (domains.includes(domain)) {
        return categoryName;
      }
      // Check if main domain matches
      if (mainDomain && domains.includes(mainDomain)) {
        return categoryName;
      }
      // Then check partial matches (for backwards compatibility)
      for (const catDomain of domains) {
        const catMainDomain = getMainDomain(catDomain);
        // Check if main domains match
        if (mainDomain && catMainDomain && mainDomain === catMainDomain) {
          return categoryName;
        }
        // Also check if domain includes category domain or vice versa
        if (domain.includes(catDomain) || catDomain.includes(domain)) {
          return categoryName;
        }
      }
    }
  }

  return 'Other';
}

function isProductive(domain) {
  const productiveCategories = ['Productivity', 'Education'];
  return productiveCategories.includes(getCategory(domain));
}

function isDistracting(domain) {
  const distractingCategories = ['Social Media', 'Entertainment'];
  return distractingCategories.includes(getCategory(domain));
}

// Local operation implementations
function normalizeUrl(url) {
  try {
    const urlObj = new URL(url);
    // Normalize scheme to lowercase
    let scheme = urlObj.protocol.toLowerCase();
    // Remove trailing colon from scheme (e.g., "https:" -> "https")
    if (scheme.endsWith(':')) {
      scheme = scheme.slice(0, -1);
    }
    // Normalize hostname to lowercase and remove www. prefix
    let hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '');
    // Remove trailing slash from path (except for root path)
    let pathname = urlObj.pathname;
    if (pathname !== '/' && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    // Remove query string and fragment to group URLs that differ only by these
    // This prevents the same page from appearing multiple times with different query params
    const normalized = `${scheme}://${hostname}${pathname}`;
    return normalized;
  } catch (e) {
    // If parsing fails, return original URL
    return url;
  }
}

function runLocalTopLinks(data, limit) {
  const counter = {};
  data.forEach(v => {
    // Normalize URLs before counting to prevent duplicates
    const normalizedUrl = normalizeUrl(v.url);
    counter[normalizedUrl] = (counter[normalizedUrl] || 0) + 1;
  });

  return Object.entries(counter)
    .map(([url, count]) => ({ url, visit_count: count }))
    .sort((a, b) => b.visit_count - a.visit_count)
    .slice(0, limit);
}

function runLocalTopDomains(data, limit) {
  const counts = {};
  data.forEach(v => {
    const domain = getDomain(v.url);
    if (domain) {
      counts[domain] = (counts[domain] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .map(([domain, visit_count]) => ({ domain, visit_count }))
    .sort((a, b) => b.visit_count - a.visit_count)
    .slice(0, limit || Infinity);
}

function runLocalTopDomainsByDay(data, date) {
  const counts = {};
  data.forEach(v => {
    const ts = new Date(v.visited_at);
    // Extract local date string (YYYY-MM-DD) to match user's timezone
    const year = ts.getFullYear();
    const month = String(ts.getMonth() + 1).padStart(2, '0');
    const day = String(ts.getDate()).padStart(2, '0');
    const visitDateStr = `${year}-${month}-${day}`;

    if (visitDateStr !== date) {
      return;
    }
    const domain = getDomain(v.url);
    if (domain) {
      counts[domain] = (counts[domain] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .map(([domain, visit_count]) => ({ domain, visit_count }))
    .sort((a, b) => b.visit_count - a.visit_count);
}

function runLocalVisitsByTimeOfDay(data) {
  const timeSlots = {
    'Morning (6-12)': [],
    'Afternoon (12-17)': [],
    'Evening (17-21)': [],
    'Night (21-6)': []
  };

  data.forEach(v => {
    const hour = new Date(v.visited_at).getHours();
    const domain = getDomain(v.url);
    if (!domain) return;

    let slot;
    if (hour >= 6 && hour < 12) slot = 'Morning (6-12)';
    else if (hour >= 12 && hour < 17) slot = 'Afternoon (12-17)';
    else if (hour >= 17 && hour < 21) slot = 'Evening (17-21)';
    else slot = 'Night (21-6)';

    if (!timeSlots[slot].find(d => d.domain === domain)) {
      timeSlots[slot].push({ domain, visit_count: 0 });
    }
    timeSlots[slot].find(d => d.domain === domain).visit_count++;
  });

  return Object.entries(timeSlots).map(([time, domains]) => ({
    time_slot: time,
    domains: domains.sort((a, b) => b.visit_count - a.visit_count)
  }));
}

function runLocalSessions(data, sessionGapMinutes = 30) {
  if (data.length === 0) return [];

  const sorted = [...data].sort((a, b) =>
    new Date(a.visited_at) - new Date(b.visited_at)
  );

  const sessions = [];
  let currentSession = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prevTime = new Date(sorted[i - 1].visited_at);
    const currTime = new Date(sorted[i].visited_at);
    const gapMinutes = (currTime - prevTime) / (1000 * 60);

    if (gapMinutes <= sessionGapMinutes) {
      currentSession.push(sorted[i]);
    } else {
      sessions.push({
        start: currentSession[0].visited_at,
        end: currentSession[currentSession.length - 1].visited_at,
        duration_minutes: Math.round(
          (new Date(currentSession[currentSession.length - 1].visited_at) -
           new Date(currentSession[0].visited_at)) / (1000 * 60)
        ),
        visit_count: currentSession.length,
        visits: currentSession
      });
      currentSession = [sorted[i]];
    }
  }

  if (currentSession.length > 0) {
    sessions.push({
      start: currentSession[0].visited_at,
      end: currentSession[currentSession.length - 1].visited_at,
      duration_minutes: Math.round(
        (new Date(currentSession[currentSession.length - 1].visited_at) -
         new Date(currentSession[0].visited_at)) / (1000 * 60)
      ),
      visit_count: currentSession.length,
      visits: currentSession
    });
  }

  return sessions;
}

function runLocalBeforeAfterNavigation(data, anchorDomain, direction = 'after') {
  const anchorVisits = data.filter(v => {
    const domain = getDomain(v.url);
    return domain && domain.includes(anchorDomain);
  });

  if (anchorVisits.length === 0) {
    return { error: "ANCHOR_NOT_FOUND", anchorDomain: anchorDomain };
  }

  const navigationDomains = new Set();
  const sorted = [...data].sort((a, b) =>
    new Date(a.visited_at) - new Date(b.visited_at)
  );

  anchorVisits.forEach(anchor => {
    const anchorTime = new Date(anchor.visited_at);
    const anchorIdx = sorted.findIndex(v =>
      v.url === anchor.url && v.visited_at === anchor.visited_at
    );

    if (direction === 'after') {
      // Find visits after this anchor
      for (let i = anchorIdx + 1; i < sorted.length && i < anchorIdx + 10; i++) {
        const nextVisit = sorted[i];
        const nextDomain = getDomain(nextVisit.url);
        if (nextDomain && nextDomain !== anchorDomain) {
          navigationDomains.add(nextDomain);
          break; // Only get first navigation after
        }
      }
    } else {
      // Find visits before this anchor
      for (let i = anchorIdx - 1; i >= 0 && i > anchorIdx - 10; i--) {
        const prevVisit = sorted[i];
        const prevDomain = getDomain(prevVisit.url);
        if (prevDomain && prevDomain !== anchorDomain) {
          navigationDomains.add(prevDomain);
          break; // Only get first navigation before
        }
      }
    }
  });

  // Count frequency of each unique domain
  const domainCounts = {};
  anchorVisits.forEach(anchor => {
    const anchorTime = new Date(anchor.visited_at);
    const anchorIdx = sorted.findIndex(v =>
      v.url === anchor.url && v.visited_at === anchor.visited_at
    );

    if (direction === 'after') {
      for (let i = anchorIdx + 1; i < sorted.length && i < anchorIdx + 10; i++) {
        const nextVisit = sorted[i];
        const nextDomain = getDomain(nextVisit.url);
        if (nextDomain && nextDomain !== anchorDomain) {
          domainCounts[nextDomain] = (domainCounts[nextDomain] || 0) + 1;
          break;
        }
      }
    } else {
      for (let i = anchorIdx - 1; i >= 0 && i > anchorIdx - 10; i--) {
        const prevVisit = sorted[i];
        const prevDomain = getDomain(prevVisit.url);
        if (prevDomain && prevDomain !== anchorDomain) {
          domainCounts[prevDomain] = (domainCounts[prevDomain] || 0) + 1;
          break;
        }
      }
    }
  });

  return {
    anchor_domain: anchorDomain,
    direction,
    unique_domains: Array.from(navigationDomains).sort(),
    most_common: Object.entries(domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
  };
}

function runLocalDailySummary(data, startDate = null, endDate = null) {
  const dailyData = {};

  // Convert date strings to date keys (YYYY-MM-DD format) for comparison
  const startDateKey = startDate || null;
  const endDateKey = endDate || null;

  data.forEach(v => {
    const visitDate = new Date(v.visited_at);
    // Extract date in local timezone, not UTC, to avoid timezone issues
    const year = visitDate.getFullYear();
    const month = String(visitDate.getMonth() + 1).padStart(2, '0');
    const day = String(visitDate.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    // If date range is specified, only process dates within range (compare date keys, not datetime)
    if (startDateKey && dateKey < startDateKey) return;
    if (endDateKey && dateKey > endDateKey) return;
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        total_visits: 0,
        unique_domains: new Set(),
        top_domains: {},
        categories: {}
      };
    }

    dailyData[dateKey].total_visits++;
    const domain = getDomain(v.url);
    if (domain) {
      dailyData[dateKey].unique_domains.add(domain);
      dailyData[dateKey].top_domains[domain] =
        (dailyData[dateKey].top_domains[domain] || 0) + 1;

      const category = getCategory(domain);
      dailyData[dateKey].categories[category] =
        (dailyData[dateKey].categories[category] || 0) + 1;
    }
  });

  return Object.values(dailyData)
    .map(day => ({
      date: day.date,
      total_visits: day.total_visits,
      unique_domains: day.unique_domains.size,
      top_domains: Object.entries(day.top_domains)
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      categories: Object.entries(day.categories)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
    }))
    .sort((a, b) => b.date.localeCompare(a.date)); // Sort by date descending (newest first)
}

function runLocalNewVsFamiliar(data, days = 7) {
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const firstVisitMap = {};
  const recentVisits = data.filter(v => new Date(v.visited_at) >= cutoffDate);

  // Find first visit date for each domain
  const sorted = [...data].sort((a, b) =>
    new Date(a.visited_at) - new Date(b.visited_at)
  );

  sorted.forEach(v => {
    const domain = getDomain(v.url);
    if (domain && !firstVisitMap[domain]) {
      firstVisitMap[domain] = v.visited_at;
    }
  });

  const newSites = [];
  const familiarSites = [];
  const domainCounts = {};

  recentVisits.forEach(v => {
    const domain = getDomain(v.url);
    if (!domain) return;

    domainCounts[domain] = (domainCounts[domain] || 0) + 1;

    const firstVisit = firstVisitMap[domain];
    if (firstVisit && new Date(firstVisit) >= cutoffDate) {
      if (!newSites.find(s => s.domain === domain)) {
        newSites.push({
          domain,
          first_visit: firstVisit,
          recent_visit_count: 0
        });
      }
      newSites.find(s => s.domain === domain).recent_visit_count++;
    } else {
      if (!familiarSites.find(s => s.domain === domain)) {
        familiarSites.push({
          domain,
          first_visit: firstVisit,
          recent_visit_count: 0
        });
      }
      familiarSites.find(s => s.domain === domain).recent_visit_count++;
    }
  });

  return {
    period_days: days,
    new_sites: newSites
      .sort((a, b) => b.recent_visit_count - a.recent_visit_count),
    familiar_sites: familiarSites
      .sort((a, b) => b.recent_visit_count - a.recent_visit_count)
      .slice(0, 20),
    new_site_count: newSites.length,
    familiar_site_count: familiarSites.length
  };
}

function runLocalCategoryTagging(data, date = null) {
  const filtered = date
    ? data.filter(v => new Date(v.visited_at).toISOString().split('T')[0] === date)
    : data;

  const categoryCounts = {};
  const categoryDomains = {};

  filtered.forEach(v => {
    const domain = getDomain(v.url);
    if (!domain) return;

    const category = getCategory(domain);
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;

    if (!categoryDomains[category]) {
      categoryDomains[category] = {};
    }
    categoryDomains[category][domain] =
      (categoryDomains[category][domain] || 0) + 1;
  });

  return {
    date: date || 'all_time',
    categories: Object.entries(categoryCounts)
      .map(([category, count]) => ({
        category,
        visit_count: count,
        top_domains: Object.entries(categoryDomains[category] || {})
          .map(([domain, count]) => ({ domain, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      }))
      .sort((a, b) => b.visit_count - a.visit_count)
  };
}

function runLocalHistorySearch(data, query) {
  const lowerQuery = query.toLowerCase();
  const matches = data.filter(v => {
    const urlMatch = v.url.toLowerCase().includes(lowerQuery);
    const titleMatch = (v.title || '').toLowerCase().includes(lowerQuery);
    return urlMatch || titleMatch;
  });

  return {
    query,
    match_count: matches.length,
    matches: matches
      .sort((a, b) => new Date(b.visited_at) - new Date(a.visited_at))
      .slice(0, 50)
      .map(v => ({
        url: v.url,
        title: v.title || '',
        visited_at: v.visited_at,
        domain: getDomain(v.url)
      }))
  };
}

function runLocalExportData(data, format = 'json') {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }
  return data;
}

// Extract base domain (remove subdomains like old.reddit.com -> reddit.com)
function getBaseDomain(domain) {
  if (!domain) return null;
  const parts = domain.split('.');
  // If domain has 2 or fewer parts, return as is
  if (parts.length <= 2) return domain;
  // Otherwise, return last 2 parts (e.g., old.reddit.com -> reddit.com)
  return parts.slice(-2).join('.');
}

function runLocalNavigationPaths(data, limit = 10) {
  const sorted = [...data].sort((a, b) =>
    new Date(a.visited_at) - new Date(b.visited_at)
  );

  const pathCounts = {};
  for (let i = 0; i < sorted.length - 1; i++) {
    const fromDomain = getDomain(sorted[i].url);
    const toDomain = getDomain(sorted[i + 1].url);

    // Get base domains (without subdomains)
    const from = getBaseDomain(fromDomain);
    const to = getBaseDomain(toDomain);

    if (from && to && from !== to) {
      const pathKey = `${from} -> ${to}`;
      pathCounts[pathKey] = (pathCounts[pathKey] || 0) + 1;
    }
  }

  // Get unique domains from all paths
  const uniqueDomains = new Set();
  Object.keys(pathCounts).forEach(pathKey => {
    const [from, to] = pathKey.split(' -> ');
    uniqueDomains.add(from);
    uniqueDomains.add(to);
  });

  return {
    unique_domains: Array.from(uniqueDomains).sort(),
    most_common_paths: Object.entries(pathCounts)
      .map(([path, count]) => {
        const [from, to] = path.split(' -> ');
        return { path, from, to, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  };
}

function runLocalRepeatedPatterns(data, days = 7) {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const recent = data.filter(v => new Date(v.visited_at) >= startDate);

  // Collect all unique domains
  const allDomains = new Set();

  // Group by hour of day
  const hourPatterns = {};
  recent.forEach(v => {
    const hour = new Date(v.visited_at).getHours();
    const domain = getDomain(v.url);
    if (!domain) return;

    allDomains.add(domain);

    if (!hourPatterns[hour]) {
      hourPatterns[hour] = {};
    }
    hourPatterns[hour][domain] = (hourPatterns[hour][domain] || 0) + 1;
  });

  // Group by day of week
  const dayPatterns = {};
  recent.forEach(v => {
    const day = new Date(v.visited_at).getDay();
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
    const domain = getDomain(v.url);
    if (!domain) return;

    allDomains.add(domain);

    if (!dayPatterns[dayName]) {
      dayPatterns[dayName] = {};
    }
    dayPatterns[dayName][domain] = (dayPatterns[dayName][domain] || 0) + 1;
  });

  return {
    period_days: days,
    unique_domains: Array.from(allDomains).sort(),
    by_hour: Object.entries(hourPatterns).map(([hour, domains]) => ({
      hour: parseInt(hour),
      top_domains: Object.entries(domains)
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    })),
    by_day_of_week: Object.entries(dayPatterns).map(([day, domains]) => ({
      day,
      top_domains: Object.entries(domains)
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    }))
  };
}

function runLocalDomainFrequency(data) {
  const counts = {};
  data.forEach(v => {
    const domain = getDomain(v.url);
    if (domain) {
      counts[domain] = (counts[domain] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .map(([domain, count]) => ({ domain, visit_count: count }))
    .sort((a, b) => b.visit_count - a.visit_count);
}

function runLocalDomainTimeDistribution(data, domainFilter = null) {
  const hourDistribution = {};

  data.forEach(v => {
    const domain = getDomain(v.url);
    if (!domain) return;
    if (domainFilter && !domain.includes(domainFilter)) return;

    const hour = new Date(v.visited_at).getHours();
    if (!hourDistribution[domain]) {
      hourDistribution[domain] = {};
    }
    hourDistribution[domain][hour] = (hourDistribution[domain][hour] || 0) + 1;
  });

  return Object.entries(hourDistribution).map(([domain, hours]) => ({
    domain,
    hourly_distribution: Object.entries(hours)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => a.hour - b.hour),
    peak_hour: Object.entries(hours)
      .sort((a, b) => b[1] - a[1])[0][0]
  }));
}

function runLocalCategoryInference(data) {
  const categoryCounts = {};
  const categoryDomains = {};

  data.forEach(v => {
    const domain = getDomain(v.url);
    if (!domain) return;

    const category = getCategory(domain);
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;

    if (!categoryDomains[category]) {
      categoryDomains[category] = new Set();
    }
    categoryDomains[category].add(domain);
  });

  return {
    categories: Object.entries(categoryCounts)
      .map(([category, count]) => ({
        category,
        visit_count: count,
        unique_domains: categoryDomains[category].size,
        unique_domains_list: Array.from(categoryDomains[category]).sort(),
        percentage: ((count / data.length) * 100).toFixed(2) + '%'
      }))
      .sort((a, b) => b.visit_count - a.visit_count)
  };
}

function runLocalProductivityVsDistraction(data, date = null) {
  const filtered = date
    ? data.filter(v => new Date(v.visited_at).toISOString().split('T')[0] === date)
    : data;

  let productive = 0;
  let distracting = 0;
  let neutral = 0;
  const productiveDomains = {};
  const distractingDomains = {};

  filtered.forEach(v => {
    const domain = getDomain(v.url);
    if (!domain) {
      neutral++;
      return;
    }

    if (isProductive(domain)) {
      productive++;
      productiveDomains[domain] = (productiveDomains[domain] || 0) + 1;
    } else if (isDistracting(domain)) {
      distracting++;
      distractingDomains[domain] = (distractingDomains[domain] || 0) + 1;
    } else {
      neutral++;
    }
  });

  const total = filtered.length;
  return {
    date: date || 'all_time',
    total_visits: total,
    productive: {
      count: productive,
      percentage: ((productive / total) * 100).toFixed(2) + '%',
      top_domains: Object.entries(productiveDomains)
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    },
    distracting: {
      count: distracting,
      percentage: ((distracting / total) * 100).toFixed(2) + '%',
      top_domains: Object.entries(distractingDomains)
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    },
    neutral: {
      count: neutral,
      percentage: ((neutral / total) * 100).toFixed(2) + '%'
    }
  };
}

function runLocalRepeatedDailyHabits(data, days = 30) {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const recent = data.filter(v => new Date(v.visited_at) >= startDate);

  const domainDays = {};
  recent.forEach(v => {
    const domain = getDomain(v.url);
    if (!domain) return;

    const dateKey = new Date(v.visited_at).toISOString().split('T')[0];
    if (!domainDays[domain]) {
      domainDays[domain] = new Set();
    }
    domainDays[domain].add(dateKey);
  });

  const dailyHabits = Object.entries(domainDays)
    .map(([domain, daysSet]) => ({
      domain,
      days_visited: daysSet.size,
      visit_frequency: ((daysSet.size / days) * 100).toFixed(1) + '%',
      category: getCategory(domain)
    }))
    .filter(h => h.days_visited >= days * 0.3) // Visited at least 30% of days
    .sort((a, b) => b.days_visited - a.days_visited);

  return {
    period_days: days,
    daily_habits: dailyHabits
  };
}

function runLocalEmergingInterests(data, days = 7) {
  const now = new Date();
  const recentCutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const historicalCutoff = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000);

  const recent = data.filter(v => new Date(v.visited_at) >= recentCutoff);
  const historical = data.filter(v => {
    const visitDate = new Date(v.visited_at);
    return visitDate >= historicalCutoff && visitDate < recentCutoff;
  });

  const recentDomains = {};
  const historicalDomains = {};

  recent.forEach(v => {
    const domain = getDomain(v.url);
    if (domain) recentDomains[domain] = (recentDomains[domain] || 0) + 1;
  });

  historical.forEach(v => {
    const domain = getDomain(v.url);
    if (domain) historicalDomains[domain] = (historicalDomains[domain] || 0) + 1;
  });

  const emerging = [];
  Object.entries(recentDomains).forEach(([domain, recentCount]) => {
    const historicalCount = historicalDomains[domain] || 0;
    if (recentCount > historicalCount * 1.5 && recentCount >= 3) {
      emerging.push({
        domain,
        recent_visits: recentCount,
        previous_visits: historicalCount,
        growth: ((recentCount / (historicalCount || 1) - 1) * 100).toFixed(1) + '%',
        category: getCategory(domain)
      });
    }
  });

  return {
    period_days: days,
    emerging_interests: emerging
      .sort((a, b) => b.recent_visits - a.recent_visits)
      .slice(0, 20)
  };
}

function runLocalBrowserUsageTimeline(data, hours = 24) {
  const now = new Date();
  const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
  const filtered = data.filter(v => new Date(v.visited_at) >= startTime);

  const timeline = [];
  const sorted = [...filtered].sort((a, b) =>
    new Date(a.visited_at) - new Date(b.visited_at)
  );

  sorted.forEach(v => {
    timeline.push({
      timestamp: v.visited_at,
      url: v.url,
      domain: getDomain(v.url),
      category: getCategory(getDomain(v.url)),
      hour: new Date(v.visited_at).getHours()
    });
  });

  // Group by hour for summary
  const hourlyActivity = {};
  timeline.forEach(entry => {
    const hour = entry.hour;
    if (!hourlyActivity[hour]) {
      hourlyActivity[hour] = { hour, visit_count: 0, domains: new Set() };
    }
    hourlyActivity[hour].visit_count++;
    if (entry.domain) hourlyActivity[hour].domains.add(entry.domain);
  });

  return {
    period_hours: hours,
    timeline: timeline,
    hourly_summary: Object.values(hourlyActivity).map(h => ({
      hour: h.hour,
      visit_count: h.visit_count,
      unique_domains: h.domains.size
    })).sort((a, b) => a.hour - b.hour)
  };
}

function runLocalNeighborVisits(data, anchor, radiusMinutes, anchorDateTime = null) {
  let anchorMatches = data.filter(v => v.url.includes(anchor));

  if (anchorMatches.length === 0) {
    return { error: "ANCHOR_NOT_FOUND", anchorUrl: anchor };
  }

  // If datetime is provided, find the nearest anchor visit to that time
  let anchorVisit;
  if (anchorDateTime) {
    const targetTime = new Date(anchorDateTime);
    // Find the anchor visit closest to the specified datetime
    anchorVisit = anchorMatches.reduce((closest, current) => {
      const currentTime = new Date(current.visited_at);
      const closestTime = new Date(closest.visited_at);
      const currentDiff = Math.abs(currentTime - targetTime);
      const closestDiff = Math.abs(closestTime - targetTime);
      return currentDiff < closestDiff ? current : closest;
    });
  } else {
    anchorVisit = anchorMatches[0];
  }

  const anchorDomain = getDomain(anchorVisit.url);
  const anchorTime = new Date(anchorVisit.visited_at);
  const start = new Date(anchorTime.getTime() - radiusMinutes * 60 * 1000);
  const end = new Date(anchorTime.getTime() + radiusMinutes * 60 * 1000);

  const neighborDomains = new Set();
  const domainCounts = {};

  data.forEach(v => {
    const visitTime = new Date(v.visited_at);
    if (visitTime >= start && visitTime <= end &&
        !(v.url === anchorVisit.url && v.visited_at === anchorVisit.visited_at)) {
      const domain = getDomain(v.url);
      if (domain && domain !== anchorDomain) {
        neighborDomains.add(domain);
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      }
    }
  });

  return {
    anchor_domain: anchorDomain,
    anchor_time: anchorVisit.visited_at,
    radius_minutes: radiusMinutes,
    unique_domains: Array.from(neighborDomains).sort(),
    domain_counts: Object.entries(domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
  };
}

// Visualization functions
function showLoading() {
  const output = document.getElementById("output");
  output.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <div>Analyzing your browsing history...</div>
    </div>
  `;
}

function hideLoading() {
  // Loading state is cleared when results are rendered
  // This function exists for consistency and can be used to clear loading state if needed
  // In most cases, results are rendered directly, so this is a no-op
}

// Convert error codes to human-readable messages
function getHumanReadableError(error, context = {}) {
  if (typeof error !== 'string') {
    return 'An unexpected error occurred. Please try again.';
  }

  const errorMessages = {
    'ANCHOR_NOT_FOUND': context.anchorDomain
      ? `The domain "${context.anchorDomain}" was not found in your browsing history. Please check the spelling and try again.`
      : context.anchorUrl
      ? `The URL containing "${context.anchorUrl}" was not found in your browsing history. Please check the spelling and try again.`
      : 'The specified anchor was not found in your browsing history. Please check your input and try again.',
    'UNKNOWN_OPERATION': 'An unknown operation was requested. Please try selecting a different operation.',
    'INVALID_DATE': context.date
      ? `The date "${context.date}" is not valid or has no browsing history data. Please select a different date.`
      : 'The selected date is not valid. Please try again.',
    'MISSING_REQUIRED_FIELD': context.field
      ? `The field "${context.field}" is required. Please fill it in and try again.`
      : 'A required field is missing. Please fill in all required fields and try again.',
    'NO_DATA_AVAILABLE': 'No browsing history data is available for the selected time period. Please try a different date range.',
    'INVALID_INPUT': context.field
      ? `The input for "${context.field}" is not valid. Please check your input and try again.`
      : 'The provided input is not valid. Please check your input and try again.'
  };

  // If it's a known error code, return the human-readable message
  if (errorMessages[error]) {
    return errorMessages[error];
  }

  // If it's already a human-readable message (doesn't match any error code), return as-is
  // Otherwise, return a generic error message
  return error.includes('_') && error === error.toUpperCase()
    ? 'An error occurred while processing your request. Please try again.'
    : error;
}

function showError(message, context = {}) {
  const output = document.getElementById("output");
  const humanReadableMessage = getHumanReadableError(message, context);
  output.innerHTML = `<div class="error">${humanReadableMessage}</div>`;
}

function clearOutput() {
  const output = document.getElementById("output");
  if (output) {
    output.innerHTML = '';
  }
}

// Create SVG line/area chart for time distributions
function createTimeChart(data, width = 450, height = 200, options = {}) {
  const {
    showArea = true,
    showPoints = true,
    color = '#667eea',
    labelX = 'Time',
    labelY = 'Count'
  } = options;

  if (!data || data.length === 0) return '';

  const padding = { top: 20, right: 20, bottom: 60, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Extract values and find max
  const values = data.map(d => d.value || d.count || 0);
  const labels = data.map(d => d.label || d.hour || d.time || '');
  const maxValue = Math.max(...values, 1);

  // Calculate points
  const points = values.map((value, index) => {
    const divisor = values.length > 1 ? values.length - 1 : 1;
    const x = (index / divisor) * chartWidth + padding.left;
    const y = chartHeight + padding.top - (value / maxValue) * chartHeight;
    return { x, y, value, label: labels[index] };
  });

  // Create grid lines and labels
  const gridLines = [];
  const yLabels = [];
  const numGridLines = 5;

  for (let i = 0; i <= numGridLines; i++) {
    const y = padding.top + (chartHeight / numGridLines) * (numGridLines - i);
    const value = Math.round((maxValue / numGridLines) * i);
    gridLines.push(`<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e9ecef" stroke-width="1"/>`);
    yLabels.push(`<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6c757d">${value}</text>`);
  }

  // X-axis labels
  const xLabels = [];
  const labelStep = Math.max(1, Math.floor(labels.length / 6));
  points.forEach((point, index) => {
    if (index % labelStep === 0 || index === points.length - 1) {
      xLabels.push(`<text x="${point.x}" y="${height - padding.bottom + 15}" text-anchor="middle" font-size="10" fill="#495057" font-weight="500">${point.label}</text>`);
    }
  });

  // Create dots for data points
  const dots = showPoints ? points.map(p =>
    `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${color}" stroke="white" stroke-width="2"/>`
  ).join('') : '';

  // Create path for line
  const linePath = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ');

  // Create path for area (line + bottom)
  // For single point, create a small rectangle
  let areaPath;
  if (points.length === 1) {
    const p = points[0];
    areaPath = `M ${p.x - 5} ${chartHeight + padding.top} L ${p.x + 5} ${chartHeight + padding.top} L ${p.x + 5} ${p.y} L ${p.x - 5} ${p.y} Z`;
  } else {
    areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight + padding.top} L ${points[0].x} ${chartHeight + padding.top} Z`;
  }

  return `
    <div class="time-chart-container">
      <svg width="${width}" height="${height}" class="time-chart">
        ${gridLines.join('')}
        ${yLabels.join('')}
        ${showArea ? `<path d="${areaPath}" fill="${color}" opacity="0.2"/>` : ''}
        <path d="${linePath}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${dots}
        ${xLabels.join('')}
        <text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-size="11" fill="#495057" font-weight="600">${labelX}</text>
        <text x="15" y="${height / 2}" text-anchor="middle" font-size="11" fill="#495057" font-weight="600" transform="rotate(-90, 15, ${height / 2})">${labelY}</text>
      </svg>
    </div>
  `;
}

// Helper function to generate dot density visualization
// Dynamically scales dots based on min/max counts, ensuring min gets at least 1 dot
function generateDotDensity(count, minCount, maxCount, maxDots = 20) {
  if (minCount === maxCount) {
    return '●'; // If all counts are the same, show 1 dot
  }

  // Scale: minCount gets 1 dot, maxCount gets maxDots dots
  // Formula: dots = 1 + (count - minCount) / (maxCount - minCount) * (maxDots - 1)
  const normalized = (count - minCount) / (maxCount - minCount);
  const dotCount = Math.max(1, Math.round(1 + normalized * (maxDots - 1)));
  return '●'.repeat(dotCount);
}

// Helper function to calculate color intensity based on count
// Returns a color string interpolated along the gradient based on normalized count
// Uses the gradient colors from the Fetch button: #667eea to #764ba2
// Intensity decreases proportionately with count (lower counts = lighter color via opacity)
function getColorIntensity(count, minCount, maxCount) {
  if (minCount === maxCount) {
    return 'rgba(102, 126, 234, 0.8)'; // Default color if all counts are the same
  }

  // Normalize count to 0-1 range
  const normalized = (count - minCount) / (maxCount - minCount);

  // Interpolate between the two gradient colors based on normalized value
  // Color 1: #667eea (rgb(102, 126, 234)) - start of gradient
  // Color 2: #764ba2 (rgb(118, 75, 162)) - end of gradient
  const r1 = 102, g1 = 126, b1 = 234;
  const r2 = 118, g2 = 75, b2 = 162;

  // Interpolate RGB values along the gradient
  const r = Math.round(r1 + (r2 - r1) * normalized);
  const g = Math.round(g1 + (g2 - g1) * normalized);
  const b = Math.round(b1 + (b2 - b1) * normalized);

  // Intensity decreases with lower counts (use opacity for intensity)
  // Higher counts get more opacity (more intense), lower counts get less (less intense)
  // Opacity range: 0.4 to 1.0 for better visibility
  const opacity = 0.4 + (normalized * 0.6); // Range from 0.4 to 1.0

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function renderTopLinks(data, timeRangeInfo = null) {
  if (!Array.isArray(data) || data.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No data found</div></div>';
  }

  const counts = data.map(item => item.visit_count || 0);
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);

  // Calculate max URL display length to determine column width
  const urlLengths = data.map(item => {
    const url = item.url || '';
    const displayLabel = getUrlDisplayLabel(url) || 'Unknown';
    return displayLabel.length;
  });
  const maxUrlLength = Math.max(...urlLengths);
  // Set a reasonable max width: most URLs should show fully, only very long ones get ellipsized
  // Increased width to give more space for URLs
  const urlColumnWidth = Math.min(250, Math.max(180, maxUrlLength * 7)); // ~7px per character

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">Top Visited Links ' + formatTimeRangeForHeader(timeRangeInfo) + '</div>';
  html += '<div class="bar-chart">';

  data.forEach((item, index) => {
    const url = item.url || '';
    const displayLabel = getUrlDisplayLabel(url) || 'Unknown';
    const percentage = maxCount > 0 ? (item.visit_count / maxCount) * 100 : 0;
    const color = getColorIntensity(item.visit_count, minCount, maxCount);
    const countText = index === 0 ? `${item.visit_count} visits` : item.visit_count;
    html += `
      <div class="bar-item">
        <div class="bar-label" style="width: ${urlColumnWidth}px;" title="${url}">
          ${displayLabel}
        </div>
        <div class="bar-container">
          <div class="bar-fill" style="width: ${percentage}%; background: ${color};">
            <span class="bar-count">${countText}</span>
          </div>
        </div>
      </div>
    `;
  });

  html += '</div></div></div>';
  return html;
}

function renderTopDomains(data, timeRangeInfo = null) {
  if (!Array.isArray(data) || data.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No data found</div></div>';
  }

  const counts = data.map(item => item.visit_count || 0);
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);

  // Calculate max domain display length (including category badge)
  const domainLengths = data.map(item => {
    const category = getCategory(item.domain);
    const domainText = item.domain + (category ? ` ${category}` : '');
    return domainText.length;
  });
  const maxDomainLength = Math.max(...domainLengths);
  const domainColumnWidth = Math.min(250, Math.max(180, maxDomainLength * 7));

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">Top Domains ' + formatTimeRangeForHeader(timeRangeInfo) + '</div>';
  html += '<div class="bar-chart">';

  data.forEach((item, index) => {
    const category = getCategory(item.domain);
    const percentage = maxCount > 0 ? (item.visit_count / maxCount) * 100 : 0;
    const color = getColorIntensity(item.visit_count, minCount, maxCount);
    const countText = index === 0 ? `${item.visit_count} visits` : item.visit_count;
    html += `
      <div class="bar-item">
        <div class="bar-label" style="width: ${domainColumnWidth}px;">
          ${item.domain}
          <span class="category-badge category-${category.toLowerCase().replace(' ', '-')}">${category}</span>
        </div>
        <div class="bar-container">
          <div class="bar-fill" style="width: ${percentage}%; background: ${color};">
            <span class="bar-count">${countText}</span>
          </div>
        </div>
      </div>
    `;
  });

  html += '</div></div></div>';
  return html;
}

function renderVisitsByTimeOfDay(data, timeRangeInfo = null) {
  if (!Array.isArray(data) || data.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No data found</div></div>';
  }

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">Visits by Time of Day ' + formatTimeRangeForHeader(timeRangeInfo) + '</div>';

  // Create chart data for each time slot
  const chartData = data.map(slot => {
    const totalVisits = slot.domains.reduce((sum, d) => sum + (d.visit_count || 0), 0);
    return {
      label: slot.time_slot.split(' ')[0], // "Morning", "Afternoon", etc.
      value: totalVisits,
      time_slot: slot.time_slot
    };
  });

  html += createTimeChart(chartData, 450, 200, {
    labelX: 'Time of Day',
    labelY: 'Total Visits',
    color: '#667eea'
  });

  // Show top domains for each slot below the chart
  html += '<div style="margin-top: 20px;">';
  data.forEach(slot => {
    html += `<div class="time-slot" style="margin-bottom: 16px;">`;
    html += `<div class="time-slot-header">${slot.time_slot}</div>`;
    html += '<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">';

    slot.domains.slice(0, 5).forEach(domain => {
      html += `<span class="category-badge category-other">${domain.domain} (${domain.visit_count})</span>`;
    });

    html += '</div></div>';
  });
  html += '</div>';

  html += '</div></div>';
  return html;
}

function renderSessions(data, timeRangeInfo = null) {
  if (!Array.isArray(data) || data.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No sessions found</div></div>';
  }

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">Browsing Sessions ' + formatTimeRangeForHeader(timeRangeInfo) + '</div>';

  data.slice(0, 10).forEach((session, index) => {
    const start = new Date(session.start);
    const end = new Date(session.end);
    html += `
      <div class="session-card">
        <div class="session-time">
          <strong>Session</strong> • ${start.toLocaleString()} → ${end.toLocaleString()}
        </div>
        <div class="session-stats">
          <div class="session-stat">⏱️ ${session.duration_minutes} min</div>
          <div class="session-stat">🔗 ${session.visit_count} visits</div>
        </div>
      </div>
    `;
  });

  html += '</div></div>';
  return html;
}

function renderDailySummary(data, timeRangeInfo = null) {
  if (!Array.isArray(data) || data.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No data found</div></div>';
  }

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">Daily Browsing Summary ' + formatTimeRangeForHeader(timeRangeInfo) + '</div><div style="padding: 16px;">';

  data.forEach(day => {
    html += '<div class="card" style="margin-bottom: 16px;">';
    html += `<div class="card-header">${day.date}</div>`;
    html += '<div class="stats-grid">';
    html += `<div class="stat-card"><div class="stat-value">${day.total_visits}</div><div class="stat-label">Total Visits</div></div>`;
    html += `<div class="stat-card"><div class="stat-value">${day.unique_domains}</div><div class="stat-label">Unique Domains</div></div>`;
    html += '</div>';

    if (day.top_domains && day.top_domains.length > 0) {
      html += '<div style="margin-top: 16px;"><strong>Top Domains:</strong></div>';
      html += '<div class="bar-chart">';
      const domainCounts = day.top_domains.map(d => d.count || 0);
      const minCount = Math.min(...domainCounts);
      const maxCount = Math.max(...domainCounts);
      const domainLengths = day.top_domains.map(d => d.domain.length);
      const maxDomainLength = Math.max(...domainLengths);
      const domainColumnWidth = Math.min(250, Math.max(180, maxDomainLength * 7));
      day.top_domains.forEach((domain, domainIndex) => {
        const percentage = maxCount > 0 ? (domain.count / maxCount) * 100 : 0;
        const color = getColorIntensity(domain.count, minCount, maxCount);
        const countText = domainIndex === 0 ? `${domain.count} visits` : domain.count;
        html += `
          <div class="bar-item">
            <div class="bar-label" style="width: ${domainColumnWidth}px;">${domain.domain}</div>
            <div class="bar-container">
              <div class="bar-fill" style="width: ${percentage}%; background: ${color};">
                <span class="bar-count">${countText}</span>
              </div>
            </div>
          </div>
        `;
      });
      html += '</div>';
    }

    html += '</div>';
  });

  html += '</div></div></div>';
  return html;
}

function renderCategoryTagging(data, timeRangeInfo = null) {
  if (!data.categories || data.categories.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No data found</div></div>';
  }

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">Category Tagging ' + formatTimeRangeForHeader(timeRangeInfo) + '</div>';

  const counts = data.categories.map(c => c.visit_count || 0);
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);

  data.categories.forEach((category, index) => {
    const percentage = maxCount > 0 ? (category.visit_count / maxCount) * 100 : 0;
    const color = getColorIntensity(category.visit_count, minCount, maxCount);
    const countText = index === 0 ? `${category.visit_count} visits` : category.visit_count;
    html += `
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <strong>${category.category}</strong>
          <span style="font-weight: 600;">${category.visit_count} visits</span>
        </div>
        <div class="bar-container">
          <div class="bar-fill" style="width: ${percentage}%; background: ${color};">
            <span class="bar-count">${countText}</span>
          </div>
        </div>
        ${category.top_domains && category.top_domains.length > 0 ? `
          <div style="margin-top: 8px; font-size: 12px; color: #6c757d;">
            ${category.top_domains.map(d => d.domain).join(', ')}
          </div>
        ` : ''}
      </div>
    `;
  });

  html += '</div></div>';
  return html;
}

function renderProductivityVsDistraction(data, timeRangeInfo = null) {
  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">Productivity vs Distraction ' + formatTimeRangeForHeader(timeRangeInfo) + '</div>';
  html += '<div class="stats-grid">';
  html += `<div class="stat-card" style="background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);">
    <div class="stat-value">${data.productive.count}</div>
    <div class="stat-label">Productive (${data.productive.percentage})</div>
  </div>`;
  html += `<div class="stat-card" style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);">
    <div class="stat-value">${data.distracting.count}</div>
    <div class="stat-label">Distracting (${data.distracting.percentage})</div>
  </div>`;
  html += '</div>';

  if (data.productive.top_domains && data.productive.top_domains.length > 0) {
    html += '<div style="margin-top: 16px;"><strong>Top Productive Sites:</strong></div>';
    data.productive.top_domains.forEach(domain => {
      html += `<div class="list-item"><div class="list-item-content"><div class="list-item-title">${domain.domain}</div></div><div class="list-item-value">${domain.count}</div></div>`;
    });
  }

  if (data.distracting.top_domains && data.distracting.top_domains.length > 0) {
    html += '<div style="margin-top: 16px;"><strong>Top Distracting Sites:</strong></div>';
    data.distracting.top_domains.forEach(domain => {
      html += `<div class="list-item"><div class="list-item-content"><div class="list-item-title">${domain.domain}</div></div><div class="list-item-value">${domain.count}</div></div>`;
    });
  }

  html += '</div></div>';
  return html;
}

function renderHistorySearch(data, timeRangeInfo = null) {
  if (!data.matches || data.matches.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">🔍</div><div>No matches found for "' + data.query + '"</div></div>';
  }

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">Search Results: "' + data.query + '" ' + formatTimeRangeForHeader(timeRangeInfo) + '</div>';
  html += `<div style="margin-bottom: 12px; color: #6c757d;">Found ${data.match_count} matches</div>`;

  data.matches.forEach(match => {
    const domain = match.domain || getDomain(match.url);
    html += `
      <div class="list-item">
        <div class="list-item-content">
          <div class="list-item-title">${match.title || match.url}</div>
          <div class="list-item-subtitle">${domain} • ${new Date(match.visited_at).toLocaleString()}</div>
        </div>
      </div>
    `;
  });

  html += '</div></div>';
  return html;
}

function renderNavigationPaths(data, timeRangeInfo = null) {
  if (!data.most_common_paths || data.most_common_paths.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No navigation paths found</div></div>';
  }

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">Most Common Navigation Paths ' + formatTimeRangeForHeader(timeRangeInfo) + '</div>';

  const pathCounts = data.most_common_paths.map(p => p.count || 0);
  const minCount = Math.min(...pathCounts);
  const maxCount = Math.max(...pathCounts);

  // Calculate max path text length for fixed width
  const pathLengths = data.most_common_paths.map(p => (p.from + ' → ' + p.to).length);
  const maxPathLength = Math.max(...pathLengths);
  const pathColumnWidth = Math.min(250, Math.max(180, maxPathLength * 7));

  data.most_common_paths.forEach((path, index) => {
    const percentage = maxCount > 0 ? (path.count / maxCount) * 100 : 0;
    const color = getColorIntensity(path.count, minCount, maxCount);
    const countText = index === 0 ? `${path.count} visits` : path.count;
    html += `
      <div class="path-item">
        <div style="flex: 1; width: ${pathColumnWidth}px;">
          <strong>${path.from}</strong>
          <span class="path-arrow"> → </span>
          <strong>${path.to}</strong>
        </div>
        <div class="bar-container" style="width: 150px;">
          <div class="bar-fill" style="width: ${percentage}%; background: ${color};">
            <span class="bar-count">${countText}</span>
          </div>
        </div>
      </div>
    `;
  });

  html += '</div></div>';
  return html;
}

function renderNewVsFamiliar(data, timeRangeInfo = null) {
  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">New vs Familiar Sites ' + formatTimeRangeForHeader(timeRangeInfo) + '</div>';
  html += '<div class="stats-grid">';
  html += `<div class="stat-card"><div class="stat-value">${data.new_site_count}</div><div class="stat-label">New Sites</div></div>`;
  html += `<div class="stat-card"><div class="stat-value">${data.familiar_site_count}</div><div class="stat-label">Familiar Sites</div></div>`;
  html += '</div>';

  if (data.new_sites && data.new_sites.length > 0) {
    html += '<div style="margin-top: 16px;"><strong>New Sites:</strong></div>';
    data.new_sites.slice(0, 10).forEach(site => {
      html += `<div class="list-item"><div class="list-item-content"><div class="list-item-title">${site.domain}</div><div class="list-item-subtitle">First visit: ${new Date(site.first_visit).toLocaleDateString()}</div></div><div class="list-item-value">${site.recent_visit_count}</div></div>`;
    });
  }

  html += '</div></div>';
  return html;
}

function renderBeforeAfterNavigation(data, timeRangeInfo = null) {
  if (data.error) {
    const context = {
      anchorDomain: data.anchor_domain,
      anchorUrl: data.anchor_url
    };
    const errorMessage = getHumanReadableError(data.error, context);
    return `<div class="error">${errorMessage}</div>`;
  }

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">Navigation ' + (data.direction === 'after' ? 'After' : 'Before') + ' ' + data.anchor_domain + ' ' + formatTimeRangeForHeader(timeRangeInfo) + '</div>';

  if (data.most_common && data.most_common.length > 0) {
    const counts = data.most_common.map(d => d.count || 0);
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);
    const domainLengths = data.most_common.map(d => d.domain.length);
    const maxDomainLength = Math.max(...domainLengths);
    const domainColumnWidth = Math.min(250, Math.max(180, maxDomainLength * 7));
    html += '<div class="bar-chart">';
    data.most_common.forEach((item, index) => {
      const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
      const color = getColorIntensity(item.count, minCount, maxCount);
      const countText = index === 0 ? `${item.count} visits` : item.count;
      html += `
        <div class="bar-item">
          <div class="bar-label" style="width: ${domainColumnWidth}px;">${item.domain}</div>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${percentage}%; background: ${color};">
              <span class="bar-count">${countText}</span>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  html += '</div></div>';
  return html;
}

function renderNeighborVisits(data, timeRangeInfo = null) {
  if (data.error) {
    const context = {
      anchorDomain: data.anchor_domain,
      anchorUrl: data.anchor_url || (data.anchor ? data.anchor.url_contains : null)
    };
    const errorMessage = getHumanReadableError(data.error, context);
    return `<div class="error">${errorMessage}</div>`;
  }

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">Neighbor Visits ' + formatTimeRangeForHeader(timeRangeInfo) + '</div>';
  // Format date as DD-MMM-YYYY, HH:MM:SS
  const anchorDate = new Date(data.anchor_time);
  const day = String(anchorDate.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[anchorDate.getMonth()];
  const year = anchorDate.getFullYear();
  const hours = String(anchorDate.getHours()).padStart(2, '0');
  const minutes = String(anchorDate.getMinutes()).padStart(2, '0');
  const seconds = String(anchorDate.getSeconds()).padStart(2, '0');
  const formattedDate = `${day}-${month}-${year}, ${hours}:${minutes}:${seconds}`;
  html += `<div style="margin-bottom: 12px; color: #6c757d;">Around ${data.anchor_domain} on ${formattedDate}</div>`;

  if (data.domain_counts && data.domain_counts.length > 0) {
    const counts = data.domain_counts.map(d => d.count || 0);
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);
    const domainLengths = data.domain_counts.map(d => d.domain.length);
    const maxDomainLength = Math.max(...domainLengths);
    const domainColumnWidth = Math.min(250, Math.max(180, maxDomainLength * 7));
    html += '<div class="bar-chart">';
    data.domain_counts.forEach((item, index) => {
      const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
      const color = getColorIntensity(item.count, minCount, maxCount);
      const countText = index === 0 ? `${item.count} visits` : item.count;
      html += `
        <div class="bar-item">
          <div class="bar-label" style="width: ${domainColumnWidth}px;">${item.domain}</div>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${percentage}%; background: ${color};">
              <span class="bar-count">${countText}</span>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  html += '</div></div>';
  return html;
}

function renderCategoryInference(data, timeRangeInfo = null) {
  if (!data.categories || data.categories.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No data found</div></div>';
  }

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">Top categories ' + formatTimeRangeForHeader(timeRangeInfo) + '</div>';

  const counts = data.categories.map(c => c.visit_count || 0);
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);

  data.categories.forEach((category, index) => {
    const percentage = maxCount > 0 ? (category.visit_count / maxCount) * 100 : 0;
    const color = getColorIntensity(category.visit_count, minCount, maxCount);
    const countText = index === 0 ? `${category.visit_count} visits` : category.visit_count;
    const domainsList = category.unique_domains_list || [];
    const domainsListText = domainsList.length > 0 ? domainsList.join(', ') : 'No domains';

    html += `
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <strong>${category.category}</strong>
          <span style="font-weight: 600;">${category.visit_count} visits (${category.percentage})</span>
        </div>
        <div class="bar-container">
          <div class="bar-fill" style="width: ${percentage}%; background: ${color};">
            <span class="bar-count">${countText}</span>
          </div>
        </div>
        <div style="margin-top: 4px; font-size: 12px; color: #6c757d; position: relative; display: inline-block;">
          <span class="unique-domains-hover" data-category-index="${index}" style="cursor: pointer; text-decoration: underline; text-decoration-style: dotted;">
            ${category.unique_domains} unique domains
          </span>
        </div>
        <div class="domain-tooltip" id="tooltip-${index}" style="display: none;">
          <button class="domain-tooltip-close" data-tooltip-id="${index}">×</button>
          <div class="domain-tooltip-content">
            ${domainsListText}
          </div>
        </div>
      </div>
    `;
  });

  html += '</div></div>';
  return html;
}

// Setup tooltip handlers for category inference unique domains
function setupCategoryInferenceTooltips() {
  const output = document.getElementById('output');
  if (!output) return;

  output.querySelectorAll('.unique-domains-hover').forEach(hoverElement => {
    const tooltipId = hoverElement.dataset.categoryIndex;
    const tooltip = output.querySelector(`#tooltip-${tooltipId}`);

    if (!tooltip) return;

    // Move tooltip to be a sibling of the hover element's parent for better positioning
    const parentContainer = hoverElement.closest('.card');
    if (parentContainer && !parentContainer.contains(tooltip)) {
      parentContainer.appendChild(tooltip);
    }

    let hideTimeout;

    hoverElement.addEventListener('mouseenter', () => {
      clearTimeout(hideTimeout);

      // Show tooltip first to get its dimensions
      tooltip.style.display = 'block';
      tooltip.style.visibility = 'hidden';

      // Position tooltip relative to viewport
      const rect = hoverElement.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();

      // Calculate position - center above the hover element
      const left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
      const top = rect.top - tooltipRect.height - 12;

      // Ensure tooltip stays within viewport bounds
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const finalLeft = Math.max(10, Math.min(left, viewportWidth - tooltipRect.width - 10));
      const finalTop = Math.max(10, Math.min(top, viewportHeight - tooltipRect.height - 10));

      tooltip.style.left = `${finalLeft}px`;
      tooltip.style.top = `${finalTop}px`;
      tooltip.style.visibility = 'visible';
    });

    hoverElement.addEventListener('mouseleave', () => {
      hideTimeout = setTimeout(() => {
        tooltip.style.display = 'none';
      }, 100);
    });

    tooltip.addEventListener('mouseenter', () => {
      clearTimeout(hideTimeout);
    });

    tooltip.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });

    // Setup close button handler
    const closeButton = tooltip.querySelector('.domain-tooltip-close');
    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        tooltip.style.display = 'none';
      });
    }
  });
}

function renderRepeatedPatterns(data, timeRangeInfo = null) {
  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">Repeated Patterns ' + formatTimeRangeForHeader(timeRangeInfo) + '</div>';

  if (data.by_hour && data.by_hour.length > 0) {
    // Sort by hour
    const sortedHours = [...data.by_hour].sort((a, b) => a.hour - b.hour);

    // Create chart data - sum up all domain visits per hour
    const chartData = sortedHours.map(hourData => {
      const totalVisits = hourData.top_domains ?
        hourData.top_domains.reduce((sum, d) => sum + d.count, 0) : 0;
      return {
        label: hourData.hour + ':00',
        value: totalVisits,
        hour: hourData.hour
      };
    });

    html += '<div style="margin-bottom: 20px;"><strong>By Hour of Day:</strong></div>';
    html += createTimeChart(chartData, 450, 200, {
      labelX: 'Hour',
      labelY: 'Total Visits',
      color: '#667eea'
    });

    // Show top domains for peak hours
    const peakHours = sortedHours
      .map(h => ({ hour: h.hour, total: h.top_domains ? h.top_domains.reduce((sum, d) => sum + d.count, 0) : 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    html += '<div style="margin-top: 16px; font-size: 12px; color: #6c757d;">Peak hours: ';
    html += peakHours.map(h => `${h.hour}:00`).join(', ');
    html += '</div>';
  }

  if (data.by_day_of_week && data.by_day_of_week.length > 0) {
    const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const sortedDays = [...data.by_day_of_week].sort((a, b) =>
      dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
    );

    // Create chart data for days
    const chartData = sortedDays.map(dayData => {
      const totalVisits = dayData.top_domains ?
        dayData.top_domains.reduce((sum, d) => sum + d.count, 0) : 0;
      return {
        label: dayData.day.substring(0, 3), // "Mon", "Tue", etc.
        value: totalVisits,
        day: dayData.day
      };
    });

    html += '<div style="margin-top: 30px; margin-bottom: 20px;"><strong>By Day of Week:</strong></div>';
    html += createTimeChart(chartData, 450, 200, {
      labelX: 'Day',
      labelY: 'Total Visits',
      color: '#764ba2'
    });
  }

  html += '</div></div>';
  return html;
}

function renderRepeatedDailyHabits(data, timeRangeInfo = null) {
  if (!data.daily_habits || data.daily_habits.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No daily habits found</div></div>';
  }

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">Repeated Daily Habits ' + formatTimeRangeForHeader(timeRangeInfo) + '</div>';

  data.daily_habits.forEach(habit => {
    html += `
      <div class="list-item">
        <div class="list-item-content">
          <div class="list-item-title">${habit.domain}</div>
          <div class="list-item-subtitle">${habit.days_visited} days visited • ${habit.visit_frequency} frequency</div>
        </div>
        <span class="category-badge category-${habit.category.toLowerCase().replace(' ', '-')}">${habit.category}</span>
      </div>
    `;
  });

  html += '</div></div>';
  return html;
}

function renderEmergingInterests(data, timeRangeInfo = null) {
  if (!data.emerging_interests || data.emerging_interests.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No emerging interests found</div></div>';
  }

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">Emerging Interests ' + formatTimeRangeForHeader(timeRangeInfo) + '</div>';

  data.emerging_interests.forEach(interest => {
    html += `
      <div class="list-item">
        <div class="list-item-content">
          <div class="list-item-title">${interest.domain}</div>
          <div class="list-item-subtitle">${interest.recent_visits} recent visits (was ${interest.previous_visits}) • ${interest.growth} growth</div>
        </div>
        <span class="category-badge category-${interest.category.toLowerCase().replace(' ', '-')}">${interest.category}</span>
      </div>
    `;
  });

  html += '</div></div>';
  return html;
}

function renderBrowserUsageTimeline(data, timeRangeInfo = null) {
  if (!data.timeline || data.timeline.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No timeline data found</div></div>';
  }

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">Browser Usage Timeline ' + formatTimeRangeForHeader(timeRangeInfo) + '</div>';

  if (data.hourly_summary && data.hourly_summary.length > 0) {
    // Create chart data
    const chartData = data.hourly_summary.map(hour => ({
      label: hour.hour + ':00',
      value: hour.visit_count,
      hour: hour.hour,
      unique_domains: hour.unique_domains
    }));

    html += createTimeChart(chartData, 450, 200, {
      labelX: 'Hour',
      labelY: 'Visits',
      color: '#667eea'
    });

    // Show summary stats below chart
    const totalVisits = data.hourly_summary.reduce((sum, h) => sum + h.visit_count, 0);
    const avgVisits = Math.round(totalVisits / data.hourly_summary.length);
    const peakHour = data.hourly_summary.reduce((max, h) => h.visit_count > max.visit_count ? h : max, data.hourly_summary[0]);

    html += '<div class="stats-grid" style="margin-top: 20px;">';
    html += `<div class="stat-card"><div class="stat-value">${totalVisits}</div><div class="stat-label">Total Visits</div></div>`;
    html += `<div class="stat-card"><div class="stat-value">${avgVisits}</div><div class="stat-label">Avg/Hour</div></div>`;
    html += `<div class="stat-card"><div class="stat-value">${peakHour.hour}:00</div><div class="stat-label">Peak Hour</div></div>`;
    html += '</div>';
  }

  html += '</div></div>';
  return html;
}

function renderDomainTimeDistribution(data, timeRangeInfo = null) {
  if (!Array.isArray(data) || data.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No data found</div></div>';
  }

  let html = '<div class="result-container">';

  // Use different colors for multiple domains
  const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe'];

  data.forEach((domainData, index) => {
    html += '<div class="card">';
    const timeRangeHeader = index === 0 ? ' ' + formatTimeRangeForHeader(timeRangeInfo) : '';
    html += `<div class="card-header">${domainData.domain}${timeRangeHeader}</div>`;
    html += `<div style="margin-bottom: 12px; color: #6c757d;">Peak hour: ${domainData.peak_hour}:00</div>`;

    if (domainData.hourly_distribution && domainData.hourly_distribution.length > 0) {
      // Sort by hour to ensure proper ordering
      const sortedHours = [...domainData.hourly_distribution].sort((a, b) => a.hour - b.hour);

      // Create chart data
      const chartData = sortedHours.map(hour => ({
        label: hour.hour + ':00',
        value: hour.count,
        hour: hour.hour
      }));

      const color = colors[index % colors.length];
      html += createTimeChart(chartData, 450, 200, {
        labelX: 'Hour of Day',
        labelY: 'Visits',
        color: color
      });

      // Show total visits
      const totalVisits = sortedHours.reduce((sum, h) => sum + h.count, 0);
      html += `<div style="margin-top: 12px; text-align: center; color: #6c757d; font-size: 13px;">Total: <strong>${totalVisits}</strong> visits</div>`;
    }

    html += '</div>';
  });

  html += '</div>';
  return html;
}

// Helper function to format time range display
function formatTimeRange(timeRangeInfo) {
  if (!timeRangeInfo) return '';

  const { type, value, startDate, endDate, date } = timeRangeInfo;

  if (type === 'exact_date') {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  } else if (type === 'date_range') {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  } else if (type === 'days') {
    if (value === 1) return 'Last 24 hours';
    if (value <= 7) return `Last ${value} days`;
    if (value <= 30) return `Last ${value} days`;
    return `Last ${value} days`;
  } else if (type === 'hours') {
    if (value === 1) return 'Last hour';
    if (value === 24) return 'Last 24 hours';
    if (value < 24) return `Last ${value} hours`;
    const days = Math.floor(value / 24);
    const hours = value % 24;
    if (hours === 0) return `Last ${days} ${days === 1 ? 'day' : 'days'}`;
    return `Last ${days} ${days === 1 ? 'day' : 'days'} and ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  } else if (type === 'all_time') {
    return 'All time';
  } else if (type === 'default_range') {
    // For operations that use default 7 days
    return 'Last 7 days';
  }
  return '';
}

// Helper function to format time range for display in headers
function formatTimeRangeForHeader(timeRangeInfo) {
  console.log(timeRangeInfo);
  const rangeText = formatTimeRange(timeRangeInfo);
  if (!rangeText) return '';
  return `<span style="font-weight: 400; color: #667eea; font-size: 0.9em;">(${rangeText})</span>`;
}

/**
 * Render AI search results
 * @param {string} query - Original user query
 * @param {Object} plan - Execution plan
 * @param {*} result - Execution result
 * @param {Object} metadata - Additional metadata
 */
function renderAIResult(query, plan, result, metadata = {}) {
  const output = document.getElementById("output");
  if (!output) return;

  let html = '<div class="result-container">';
  html += '<div class="card">';
  html += `<div class="card-header">AI Search Results</div>`;
  html += '<div class="card-content" style="padding: 16px;">';

  // Show query
  html += `<div style="margin-bottom: 16px;">`;
  html += `<div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">Query:</div>`;
  html += `<div style="font-weight: 600; color: #1f2937;">"${query}"</div>`;
  html += `</div>`;

  // Show execution plan (collapsible)
  if (plan && plan.steps) {
    html += `<details style="margin-bottom: 16px;">`;
    html += `<summary style="cursor: pointer; font-size: 13px; color: #667eea; font-weight: 600; margin-bottom: 8px;">Execution Plan (${plan.steps.length} step${plan.steps.length !== 1 ? 's' : ''})</summary>`;
    html += `<div style="background: #f9fafb; padding: 12px; border-radius: 8px; margin-top: 8px; font-size: 12px; font-family: monospace;">`;
    html += `<pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word;">${JSON.stringify(plan, null, 2)}</pre>`;
    html += `</div>`;
    html += `</details>`;
  }

  // Handle error results
  if (result && result.error) {
    html += `<div style="color: #dc2626; padding: 12px; background: #fef2f2; border-radius: 8px; margin-top: 12px;">`;
    html += `<strong>Error:</strong> ${result.error}`;
    if (result.message) {
      html += `<br><span style="font-size: 12px;">${result.message}</span>`;
    }
    html += `</div>`;
    html += '</div></div></div>';
    output.innerHTML = html;
    return;
  }

  // Handle empty results
  if (!result || (Array.isArray(result) && result.length === 0)) {
    html += `<div class="empty-state" style="margin-top: 12px;">`;
    html += `<div class="empty-state-icon">📭</div>`;
    html += `<div>No results found</div>`;
    html += `</div>`;
    html += '</div></div></div>';
    output.innerHTML = html;
    return;
  }

  // Render results based on type
  if (Array.isArray(result)) {
    // Array of visits
    if (result.length > 0 && result[0].url) {
      html += `<div style="margin-top: 12px;">`;
      html += `<div style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">Found ${result.length} result${result.length !== 1 ? 's' : ''}</div>`;
      html += `<div style="max-height: 400px; overflow-y: auto;">`;

      result.slice(0, 50).forEach((visit, index) => {
        const date = new Date(visit.visited_at);
        html += `<div style="padding: 12px; border-bottom: 1px solid #e5e7eb; ${index === 0 ? 'border-top: 1px solid #e5e7eb;' : ''}">`;
        html += `<div style="font-weight: 600; margin-bottom: 4px;">`;
        html += `<a href="${visit.url}" target="_blank" style="color: #667eea; text-decoration: none;">${visit.title || visit.url}</a>`;
        html += `</div>`;
        html += `<div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${visit.url}</div>`;
        html += `<div style="font-size: 11px; color: #9ca3af;">${date.toLocaleString()}</div>`;
        html += `</div>`;
      });

      if (result.length > 50) {
        html += `<div style="padding: 12px; text-align: center; color: #6b7280; font-size: 12px;">... and ${result.length - 50} more results</div>`;
      }

      html += `</div>`;
      html += `</div>`;
    }
    // Array of grouped results
    else if (result.length > 0 && result[0].domain) {
      html += `<div style="margin-top: 12px;">`;
      html += `<div style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">Found ${result.length} domain${result.length !== 1 ? 's' : ''}</div>`;
      html += `<div style="max-height: 400px; overflow-y: auto;">`;

      result.forEach((item, index) => {
        const domainId = `domain-${index}`;
        const visitCount = item.visit_count || item.count || 0;
        const visits = item.visits || [];

        // Group visits by normalized URL to get unique links with counts
        const urlCounts = {};
        visits.forEach(v => {
          const normalizedUrl = normalizeUrl(v.url);
          if (!urlCounts[normalizedUrl]) {
            urlCounts[normalizedUrl] = {
              url: normalizedUrl,
              originalUrl: v.url, // Keep first original URL for display
              title: v.title || normalizedUrl,
              count: 0
            };
          }
          urlCounts[normalizedUrl].count++;
        });

        const uniqueLinks = Object.values(urlCounts).sort((a, b) => b.count - a.count);

        html += `<div class="expandable-domain-item" style="padding: 12px; border-bottom: 1px solid #e5e7eb; ${index === 0 ? 'border-top: 1px solid #e5e7eb;' : ''}">`;
        html += `<div class="domain-header" style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none;" data-domain-id="${domainId}">`;
        html += `<div style="flex: 1;">`;
        html += `<div style="font-weight: 600; margin-bottom: 4px;">${item.domain}</div>`;
        html += `<div style="font-size: 12px; color: #6b7280;">${visitCount} visit${visitCount !== 1 ? 's' : ''}</div>`;
        html += `</div>`;
        html += `<div class="expand-icon" style="font-size: 18px; color: #667eea; margin-left: 12px; transition: transform 0.2s;">+</div>`;
        html += `</div>`;

        // Collapsible links section
        html += `<div class="domain-links" id="${domainId}" style="display: none; margin-top: 12px; padding-left: 8px; border-left: 3px solid #e5e7eb;">`;
        if (uniqueLinks.length > 0) {
          uniqueLinks.forEach(link => {
            html += `<div style="padding: 8px 12px; margin-bottom: 6px; background: #f9fafb; border-radius: 6px;">`;
            html += `<div style="display: flex; align-items: center; justify-content: space-between;">`;
            html += `<div style="flex: 1; min-width: 0;">`;
            html += `<a href="${link.originalUrl}" target="_blank" style="color: #667eea; text-decoration: none; font-weight: 600; font-size: 13px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${link.originalUrl}">${link.title || getUrlDisplayLabel(link.originalUrl)}</a>`;
            html += `<div style="font-size: 11px; color: #9ca3af; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${link.originalUrl}</div>`;
            html += `</div>`;
            html += `<div style="font-weight: 700; color: #374151; font-size: 13px; margin-left: 12px; flex-shrink: 0;">${link.count}</div>`;
            html += `</div>`;
            html += `</div>`;
          });
        } else {
          html += `<div style="padding: 8px; color: #9ca3af; font-size: 12px;">No links available</div>`;
        }
        html += `</div>`;
        html += `</div>`;
      });

      html += `</div>`;
      html += `</div>`;
    }
    // Array of sessions
    else if (result.length > 0 && result[0].start) {
      html += `<div style="margin-top: 12px;">`;
      html += `<div style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">Found ${result.length} session${result.length !== 1 ? 's' : ''}</div>`;
      html += `<div style="max-height: 400px; overflow-y: auto;">`;

      result.forEach((session, index) => {
        const startDate = new Date(session.start);
        const endDate = new Date(session.end);
        html += `<div style="padding: 12px; border-bottom: 1px solid #e5e7eb; ${index === 0 ? 'border-top: 1px solid #e5e7eb;' : ''}">`;
        html += `<div style="font-weight: 600; margin-bottom: 4px;">Session ${index + 1}</div>`;
        html += `<div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">`;
        html += `${startDate.toLocaleString()} - ${endDate.toLocaleString()}`;
        html += `</div>`;
        html += `<div style="font-size: 11px; color: #9ca3af;">`;
        html += `${session.visit_count} visits • ${session.duration_minutes} minutes`;
        html += `</div>`;
        html += `</div>`;
      });

      html += `</div>`;
      html += `</div>`;
    }
    // Generic array
    else {
      html += `<div style="margin-top: 12px;">`;
      html += `<pre style="background: #f9fafb; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 12px;">${JSON.stringify(result, null, 2)}</pre>`;
      html += `</div>`;
    }
  }
  // Object result
  else if (typeof result === 'object') {
    html += `<div style="margin-top: 12px;">`;
    html += `<pre style="background: #f9fafb; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 12px;">${JSON.stringify(result, null, 2)}</pre>`;
    html += `</div>`;
  }
  // Primitive result
  else {
    html += `<div style="margin-top: 12px; font-size: 14px;">${result}</div>`;
  }

  html += '</div></div></div>';
  output.innerHTML = html;

  // Setup expand/collapse handlers for domain items
  setupExpandableDomains();

  // Persist state for restoration
  saveAIResultState(query, plan, result, metadata);
}

function setupExpandableDomains() {
  const domainHeaders = document.querySelectorAll('.domain-header');
  domainHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const domainId = this.getAttribute('data-domain-id');
      const linksContainer = document.getElementById(domainId);
      const domainItem = this.closest('.expandable-domain-item');

      if (linksContainer && domainItem) {
        const isExpanded = domainItem.classList.contains('expanded');

        if (isExpanded) {
          // Collapse
          linksContainer.style.display = 'none';
          domainItem.classList.remove('expanded');
        } else {
          // Expand
          linksContainer.style.display = 'block';
          domainItem.classList.add('expanded');
        }
      }
    });
  });
}

function renderResult(operation, result, timeRangeInfo = null) {
  const output = document.getElementById("output");

  if (result && result.error) {
    // Extract context from result for better error messages
    const context = {
      anchorDomain: result.anchor_domain,
      anchorUrl: result.anchor_url || (result.anchor ? result.anchor.url_contains : null),
      date: result.date,
      field: result.field
    };
    showError(result.error, context);
    // Don't persist error states
    return;
  }

  switch (operation) {
    case 'top_links':
      output.innerHTML = renderTopLinks(result, timeRangeInfo);
      break;
    case 'top_domains':
    case 'top_domains_by_day':
      output.innerHTML = renderTopDomains(result, timeRangeInfo);
      break;
    case 'domain_frequency':
      output.innerHTML = renderTopDomains(result, timeRangeInfo);
      break;
    case 'visits_by_time_of_day':
      output.innerHTML = renderVisitsByTimeOfDay(result, timeRangeInfo);
      break;
    case 'sessions':
      output.innerHTML = renderSessions(result, timeRangeInfo);
      break;
    case 'daily_summary':
      output.innerHTML = renderDailySummary(result, timeRangeInfo);
      break;
    case 'category_tagging':
      output.innerHTML = renderCategoryTagging(result, timeRangeInfo);
      break;
    case 'category_inference':
      output.innerHTML = renderCategoryInference(result, timeRangeInfo);
      setupCategoryInferenceTooltips();
      break;
    case 'productivity_vs_distraction':
      output.innerHTML = renderProductivityVsDistraction(result, timeRangeInfo);
      break;
    case 'history_search':
      output.innerHTML = renderHistorySearch(result, timeRangeInfo);
      break;
    case 'navigation_paths':
      output.innerHTML = renderNavigationPaths(result, timeRangeInfo);
      break;
    case 'new_vs_familiar':
      output.innerHTML = renderNewVsFamiliar(result, timeRangeInfo);
      break;
    case 'before_after_navigation':
      output.innerHTML = renderBeforeAfterNavigation(result, timeRangeInfo);
      break;
    case 'neighbor_visits':
      output.innerHTML = renderNeighborVisits(result, timeRangeInfo);
      break;
    case 'repeated_patterns':
      output.innerHTML = renderRepeatedPatterns(result, timeRangeInfo);
      break;
    case 'repeated_daily_habits':
      output.innerHTML = renderRepeatedDailyHabits(result, timeRangeInfo);
      break;
    case 'emerging_interests':
      output.innerHTML = renderEmergingInterests(result, timeRangeInfo);
      break;
    case 'browser_usage_timeline':
      output.innerHTML = renderBrowserUsageTimeline(result, timeRangeInfo);
      break;
    case 'domain_time_distribution':
      output.innerHTML = renderDomainTimeDistribution(result, timeRangeInfo);
      break;
    default:
      // Fallback to JSON for operations without specific renderers
      output.innerHTML = `<div class="card"><div class="card-header">Result ${formatTimeRangeForHeader(timeRangeInfo)}</div><pre style="background: #f8f9fa; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 12px;">${JSON.stringify(result, null, 2)}</pre></div>`;
  }

  // Persist state for restoration
  saveLocalResultState(operation, result, timeRangeInfo);
}


// Get current mode from radio buttons (defaults to 'local' if mode bar is hidden)
function getCurrentMode() {
  // Always return 'local' mode since MCP mode is removed
  return 'local';
}

// Validate required fields for the current operation
function validateRequiredFields() {
  const op = currentOperation;

  const sendButton = document.getElementById("send");

  // If no operation is selected, disable button
  if (!op || op === "" || op === "select") {
    sendButton.disabled = true;
    return;
  }

  // Check required fields based on operation
  let isValid = true;

  if (op === "top_domains_by_day") {
    const dateValue = getInputValue("date");
    isValid = dateValue != null && String(dateValue).trim() !== "";
  } else if (op === "neighbor_visits") {
    const anchorValue = getInputValue("anchor");
    isValid = anchorValue != null && String(anchorValue).trim() !== "";
  } else if (op === "before_after_navigation") {
    const anchorDomain = getInputValue("anchor_domain");
    isValid = anchorDomain != null && String(anchorDomain).trim() !== "";
  } else if (op === "history_search") {
    const searchQuery = getInputValue("search_query");
    isValid = searchQuery != null && String(searchQuery).trim() !== "";
  }

  sendButton.disabled = !isValid;
}

// Show/hide fields based on selected operation and enable/disable button
function updateFieldsVisibility() {
  // Use currentOperation from navigation state
  const op = currentOperation;

  const sections = document.querySelectorAll(".section[data-operation]");

  // Show/hide sections based on operation
  sections.forEach(section => {
    if (section.getAttribute("data-operation") === op) {
      section.classList.add("visible");
    } else {
      section.classList.remove("visible");
    }
  });

  // Validate required fields and update button state
  validateRequiredFields();
}

// Navigation functions for local mode
function showCategoriesView() {
  currentView = 'categories';
  currentCategory = null;
  currentOperation = null;

  document.getElementById('categoriesView').style.display = 'block';
  document.getElementById('operationsView').style.display = 'none';
  document.getElementById('operationFormView').style.display = 'none';
  document.getElementById('settingsView').style.display = 'none';

  updateCategoryNavLinks();

  // Clear any operation selection
  const operationSelect = document.getElementById('operation');
  if (operationSelect) {
    operationSelect.value = '';
  }

  // Clear all form inputs
  clearAllInputs();

  // Clear output
  const output = document.getElementById('output');
  if (output) {
    output.innerHTML = '';
  }

  // Hide the send button
  const sendButton = document.getElementById('send');
  if (sendButton) {
    sendButton.style.display = 'none';
    sendButton.disabled = true;
  }
}

function showOperationsView(categoryId) {
  currentView = 'operations';
  currentCategory = categoryId;
  currentOperation = null;

  const category = OPERATION_CATEGORIES[categoryId];
  if (!category) return;

  document.getElementById('categoriesView').style.display = 'none';
  document.getElementById('operationsView').style.display = 'block';
  document.getElementById('operationFormView').style.display = 'none';
  document.getElementById('settingsView').style.display = 'none';

  updateCategoryNavLinks();

  // Clear output when switching views
  clearOutput();

  // Update view title
  document.getElementById('operationsViewTitle').textContent = category.title;

  // Render operations list
  const operationsList = document.getElementById('operationsList');
  operationsList.innerHTML = '';

  category.operations.forEach(op => {
    const opCard = document.createElement('div');
    opCard.className = 'operation-card';
    opCard.dataset.operationId = op.id;
    opCard.innerHTML = `
      <div class="operation-name">
        <span class="operation-icon">${op.icon || '🔍'}</span>
        <span>${op.name}</span>
      </div>
      <div class="operation-help">${op.help}</div>
    `;
    opCard.addEventListener('click', () => showOperationFormView(op.id));
    operationsList.appendChild(opCard);
  });

  // Clear all form inputs
  clearAllInputs();

  // Clear output
  const output = document.getElementById('output');
  if (output) {
    output.innerHTML = '';
  }

  // Hide the send button
  const sendButton = document.getElementById('send');
  if (sendButton) {
    sendButton.style.display = 'none';
    sendButton.disabled = true;
  }
}

function showOperationFormView(operationId) {
  currentView = 'operationForm';
  currentOperation = operationId;

  document.getElementById('categoriesView').style.display = 'none';
  document.getElementById('operationsView').style.display = 'none';
  document.getElementById('operationFormView').style.display = 'block';
  document.getElementById('settingsView').style.display = 'none';

  // Clear output
  const output = document.getElementById('output');
  if (output) {
    output.innerHTML = '';
  }

  updateCategoryNavLinks();

  // Update view title and help text
  const category = OPERATION_CATEGORIES[currentCategory];
  const operation = category?.operations.find(op => op.id === operationId);
  document.getElementById('operationFormViewTitle').textContent = operation?.name || operationId;

  // Show help text if available
  const helpTextElement = document.getElementById('operationFormViewHelp');
  if (helpTextElement && operation?.help) {
    helpTextElement.textContent = operation.help;
    helpTextElement.style.display = 'block';
  } else if (helpTextElement) {
    helpTextElement.style.display = 'none';
  }

  // Set the operation select value (for compatibility with existing code)
  const operationSelect = document.getElementById('operation');
  if (operationSelect) {
    operationSelect.value = operationId;
  }

  // Clear form container and show the appropriate form section
  const formContainer = document.getElementById('operationFormContainer');
  formContainer.innerHTML = '';

  // Find and clone the section for this operation
  const sections = document.querySelectorAll(".section[data-operation]");
  let targetSection = null;

  sections.forEach(section => {
    if (section.getAttribute("data-operation") === operationId) {
      targetSection = section;
    }
  });

  if (targetSection) {
    // Clone the section
    const clonedSection = targetSection.cloneNode(true);
    clonedSection.classList.add("visible");
    clonedSection.style.display = "flex";

    // Set default values for cloned inputs
    setDefaultValuesForClonedSection(clonedSection, operationId);

    formContainer.appendChild(clonedSection);

    // Re-setup date inputs and toggles for the cloned section
    setTimeout(() => {
      setupDateInputs();
      setupDateInputClickHandlers();
      setupDateRangeToggles();

      // Set up validation listeners on cloned inputs
      setupValidationListenersForClonedSection(clonedSection, operationId);

      // Set up date input click handlers for cloned section
      setupDateInputClickHandlersForSection(clonedSection);

      // Set up customise widget toggle functionality
      setupCustomiseWidgets(clonedSection);

      validateRequiredFields();
    }, 0);
  }

  // Show the send button
  const sendButton = document.getElementById('send');
  if (sendButton) {
    sendButton.style.display = 'block';
  }
}

// Set default values for cloned section inputs
function setDefaultValuesForClonedSection(clonedSection, operationId) {
  // Set default values based on operation
  const defaults = {
    'limit': '10',
    'session_gap': '30',
    'radius': '30',
    'days': operationId === 'repeated_daily_habits' ? '30' : '7',
    'hours': '24'
  };

  // Set defaults for number inputs
  Object.entries(defaults).forEach(([id, value]) => {
    const input = clonedSection.querySelector(`#${id}`);
    if (input && !input.value) {
      input.value = value;
    }
  });

  // Set default date values (today for date inputs, 7 days ago for start_date, today for end_date)
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  clonedSection.querySelectorAll('input[type="date"]').forEach(input => {
    if (!input.value) {
      if (input.id === 'start_date') {
        input.value = sevenDaysAgo;
      } else if (input.id === 'end_date') {
        input.value = today;
      } else if (input.id === 'date') {
        input.value = today;
      }
    }
    // Add has-value class if input has a value (for styling)
    if (input.value) {
      input.classList.add('has-value');
    }
    // Add listener to update class when value changes
    input.addEventListener('input', function() {
      if (this.value) {
        this.classList.add('has-value');
      } else {
        this.classList.remove('has-value');
      }
    });
  });
}

// Set up validation listeners for cloned inputs in local mode
function setupValidationListenersForClonedSection(clonedSection, operationId) {
  const requiredFields = {
    "top_domains_by_day": ["date"],
    "neighbor_visits": ["anchor"],
    "before_after_navigation": ["anchor_domain"],
    "history_search": ["search_query"]
  };

  const fieldsForOperation = requiredFields[operationId] || [];

  fieldsForOperation.forEach(fieldId => {
    const field = clonedSection.querySelector(`#${fieldId}`);
    if (field) {
      // Remove any existing listeners by cloning the field (this removes old listeners)
      // Then add new listeners
      field.addEventListener("input", validateRequiredFields);
      field.addEventListener("change", validateRequiredFields);
      field.addEventListener("blur", validateRequiredFields);
    }
  });

  // Set up Enter key submission for all inputs in the cloned section
  const inputs = clonedSection.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]');
  inputs.forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const sendButton = document.getElementById("send");
        if (sendButton && !sendButton.disabled) {
          executeQuery();
        }
      }
    });
  });
}

function clearAllInputs() {
  // Clear all input fields
  const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]');
  inputs.forEach(input => {
    input.value = '';
  });

  // Clear all select fields
  const selects = document.querySelectorAll('select');
  selects.forEach(select => {
    if (select.id !== 'operation') { // Don't clear operation select
      select.value = '';
    }
  });

  // Hide all date range fields
  const dateRangeFields = document.querySelectorAll('.date-range-fields');
  dateRangeFields.forEach(fields => {
    fields.style.display = 'none';
  });

  // Reset date range toggles
  const toggles = document.querySelectorAll('.date-range-toggle');
  toggles.forEach(toggle => {
    toggle.textContent = '📅 Set custom date range';
  });

  // Hide all sections
  const sections = document.querySelectorAll('.section[data-operation]');
  sections.forEach(section => {
    section.classList.remove('visible');
  });
}

async function updateNavigationForMode(mode) {
  const localNav = document.getElementById('localModeNavigation');

  // Always show local navigation (MCP mode removed)
  localNav.style.display = 'block';
  showCategoriesView();
}

// Initialize mode radio buttons
// Initialize navigation and UI handlers
async function initializeNavigation() {
  // Always use local mode
  updateNavigationForMode('local');

  // Setup category card click handlers
  const categoryCards = document.querySelectorAll('.category-card');
  categoryCards.forEach(card => {
    card.addEventListener('click', () => {
      const categoryId = card.dataset.category;
      showOperationsView(categoryId);
    });
  });

  // Setup category navigation link handlers
  const categoryNavLinks = document.querySelectorAll('.category-nav-link[data-category]');
  categoryNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const categoryId = link.dataset.category;
      if (categoryId === 'settings') {
        showSettingsView();
      } else if (categoryId && categoryId !== currentCategory) {
        showOperationsView(categoryId);
      }
    });
  });

  // Setup back button handlers
  document.getElementById('backToCategories').addEventListener('click', () => {
    showCategoriesView();
  });

  document.getElementById('backToOperations').addEventListener('click', () => {
    if (currentCategory) {
      showOperationsView(currentCategory);
    } else {
      showCategoriesView();
    }
  });

  document.getElementById('backFromSettings').addEventListener('click', () => {
    if (currentCategory) {
      showOperationsView(currentCategory);
    } else {
      showCategoriesView();
    }
  });

  // Load user categories and initialize settings
  loadUserCategories().then(() => {
    renderSettingsView();
    initializeLLMConfig();
  });
}

// ============================================================================
// LLM Configuration Handlers
// ============================================================================

/**
 * Initialize LLM configuration UI
 */
async function initializeLLMConfig() {
  // Load current configuration
  const config = await getLLMConfig();

  // Set provider radio button
  const localRadio = document.getElementById('llmProviderLocal');
  const cloudRadio = document.getElementById('llmProviderCloud');
  if (localRadio && cloudRadio) {
    if (config.provider === 'local') {
      localRadio.checked = true;
      document.getElementById('localLLMSettings').style.display = 'block';
      document.getElementById('cloudLLMSettings').style.display = 'none';
    } else {
      cloudRadio.checked = true;
      document.getElementById('localLLMSettings').style.display = 'none';
      document.getElementById('cloudLLMSettings').style.display = 'block';
    }

    // Add change listeners
    localRadio.addEventListener('change', () => {
      if (localRadio.checked) {
        document.getElementById('localLLMSettings').style.display = 'block';
        document.getElementById('cloudLLMSettings').style.display = 'none';
      }
    });

    cloudRadio.addEventListener('change', () => {
      if (cloudRadio.checked) {
        document.getElementById('localLLMSettings').style.display = 'none';
        document.getElementById('cloudLLMSettings').style.display = 'block';
      }
    });
  }

  // Set current values
  const localEndpoint = document.getElementById('localLLMEndpoint');
  const localModel = document.getElementById('localLLMModel');
  const cloudProvider = document.getElementById('cloudProvider');
  const apiKey = document.getElementById('llmApiKey');
  const cloudModel = document.getElementById('cloudLLMModel');

  if (localEndpoint) localEndpoint.value = config.localEndpoint || 'http://localhost:11434/api/chat';
  if (localModel) localModel.value = config.model || 'llama3';
  if (cloudProvider) cloudProvider.value = config.cloudProvider || 'openai';
  if (apiKey) apiKey.value = config.apiKey || '';
  if (cloudModel) cloudModel.value = config.model || 'gpt-4';

  // Save button handler
  const saveBtn = document.getElementById('saveLLMConfigBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      await saveLLMConfig();
    });
  }

  // Test connection button handler
  const testBtn = document.getElementById('testLLMConnectionBtn');
  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      await testLLMConnection();
    });
  }
}

/**
 * Save LLM configuration
 */
async function saveLLMConfig() {
  const provider = document.querySelector('input[name="llmProvider"]:checked')?.value || 'local';
  const localEndpoint = document.getElementById('localLLMEndpoint')?.value || '';
  const localModel = document.getElementById('localLLMModel')?.value || 'llama3';
  const cloudProvider = document.getElementById('cloudProvider')?.value || 'openai';
  const apiKey = document.getElementById('llmApiKey')?.value || '';
  const cloudModel = document.getElementById('cloudLLMModel')?.value || 'gpt-4';

  const config = {
    llmProvider: provider,
    localLLMEndpoint: localEndpoint,
    cloudProvider: cloudProvider,
    apiKey: apiKey,
    model: provider === 'local' ? localModel : cloudModel
  };

  await new Promise((resolve) => {
    chrome.storage.local.set(config, resolve);
  });

  const statusDiv = document.getElementById('llmConfigStatus');
  if (statusDiv) {
    statusDiv.innerHTML = '<span style="color: #10b981;">✓ Configuration saved successfully</span>';
    setTimeout(() => {
      statusDiv.innerHTML = '';
    }, 3000);
  }
}

/**
 * Test LLM connection
 */
async function testLLMConnection() {
  const statusDiv = document.getElementById('llmConfigStatus');
  if (statusDiv) {
    statusDiv.innerHTML = '<span style="color: #6b7280;">Testing connection...</span>';
  }

  try {
    // Save config first
    await saveLLMConfig();

    // Get updated config
    const config = await getLLMConfig();

    // Test with a simple prompt
    const testPrompt = 'Generate a simple execution plan for: "show top 5 domains"';
    const response = await callLLM(testPrompt, config);

    if (response && response.trim()) {
      if (statusDiv) {
        statusDiv.innerHTML = '<span style="color: #10b981;">✓ Connection successful! LLM is working.</span>';
      }
    } else {
      throw new Error('Empty response from LLM');
    }
  } catch (error) {
    if (statusDiv) {
      statusDiv.innerHTML = `<span style="color: #dc2626;">✗ Connection failed: ${error.message}</span>`;
    }
  }
}

// Show settings view
function showSettingsView() {
  currentView = 'settings';
  currentCategory = null;
  currentOperation = null;

  document.getElementById('categoriesView').style.display = 'none';
  document.getElementById('operationsView').style.display = 'none';
  document.getElementById('operationFormView').style.display = 'none';
  document.getElementById('settingsView').style.display = 'block';

  updateCategoryNavLinks();

  // Clear output when switching views
  clearOutput();

  renderSettingsView();
}

// Get all unique domains from history
async function getAllHistoryDomains() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: "FETCH_HISTORY",
        startTime: Date.now() - 1000 * 60 * 60 * 24 * 365, // Last year
        maxResults: 50000
      },
      (response) => {
        const domainSet = new Set();
        if (response && response.visits) {
          response.visits.forEach(visit => {
            const domain = getDomain(visit.url);
            if (domain) {
              domainSet.add(domain);
            }
          });
        }
        resolve(Array.from(domainSet).sort());
      }
    );
  });
}

// Get all categorized domains (from both system and user categories)
// Returns a Set that includes both exact domains and their main domains
function getAllCategorizedDomains() {
  const categorizedDomains = new Set();
  const categorizedMainDomains = new Set();

  // Add domains from system categories
  Object.keys(SYSTEM_CATEGORIES).forEach(categoryName => {
    const domains = getSystemCategoryWithOverrides(categoryName);
    domains.forEach(domain => {
      categorizedDomains.add(domain);
      const mainDomain = getMainDomain(domain);
      if (mainDomain) {
        categorizedMainDomains.add(mainDomain);
      }
    });
  });

  // Add domains from user categories
  Object.values(userCategories).forEach(domains => {
    if (Array.isArray(domains)) {
      domains.forEach(domain => {
        categorizedDomains.add(domain);
        const mainDomain = getMainDomain(domain);
        if (mainDomain) {
          categorizedMainDomains.add(mainDomain);
        }
      });
    }
  });

  // Return a function that checks if a domain is categorized
  // (either exact match or main domain match)
  return {
    has: (domain) => {
      if (!domain) return false;
      // Check exact match
      if (categorizedDomains.has(domain)) return true;
      // Check main domain match
      const mainDomain = getMainDomain(domain);
      return mainDomain ? categorizedMainDomains.has(mainDomain) : false;
    },
    // Also expose the sets for backwards compatibility if needed
    exactDomains: categorizedDomains,
    mainDomains: categorizedMainDomains
  };
}

// Get uncategorized domains (domains in history but not in any category)
async function getUncategorizedDomains() {
  const allDomains = await getAllHistoryDomains();
  const categorizedDomains = getAllCategorizedDomains();

  // Filter out domains that are categorized (either exact match or main domain match)
  return allDomains.filter(domain => !categorizedDomains.has(domain));
}

// Render settings view with system and user categories
let isRenderingSettingsView = false;
async function renderSettingsView() {
  // Prevent concurrent calls
  if (isRenderingSettingsView) {
    return;
  }

  isRenderingSettingsView = true;

  try {
    const categoriesList = document.getElementById('categoriesList');
    categoriesList.innerHTML = '';

    // Clear selection when re-rendering
    selectedDomains.clear();
    const existingActionBar = document.getElementById('floatingActionBar');
    if (existingActionBar) {
      existingActionBar.remove();
    }

    // First render system categories
    Object.keys(SYSTEM_CATEGORIES).forEach(categoryName => {
      const domains = getSystemCategoryWithOverrides(categoryName);
      const isSystem = true;
      renderCategoryItem(categoriesList, categoryName, domains, isSystem);
    });

    // Then render user-defined categories (skip "Others" as it's handled separately)
    Object.entries(userCategories).forEach(([categoryName, domains]) => {
      // Skip "Others" category - it's always rendered as a special dynamic category
      if (categoryName === 'Others') {
        return;
      }
      const isSystem = false;
      renderCategoryItem(categoriesList, categoryName, domains, isSystem);
    });

    // Render "Others" category with uncategorized domains (always render this special category)
    const uncategorizedDomains = await getUncategorizedDomains();
    if (uncategorizedDomains.length > 0) {
      renderCategoryItem(categoriesList, 'Others', uncategorizedDomains, false, true);
    }

    if (Object.keys(SYSTEM_CATEGORIES).length === 0 && Object.keys(userCategories).length === 0 && uncategorizedDomains.length === 0) {
      categoriesList.innerHTML = '<div style="color: #6c757d; font-size: 13px; padding: 20px; text-align: center;">No categories yet. Add one below!</div>';
    }

    // Setup handlers after rendering
    setupCategoryItemHandlers();
    setupDragAndDrop();
  } finally {
    isRenderingSettingsView = false;
  }
}

// Store selected domains for bulk operations
let selectedDomains = new Set();
let allUncategorizedDomains = [];

// Render a single category item
function renderCategoryItem(container, categoryName, domains, isSystem, isOthers = false) {
  const categoryItem = document.createElement('div');
  categoryItem.className = 'category-item';
  categoryItem.dataset.categoryName = categoryName;
  categoryItem.dataset.isSystem = isSystem;
  categoryItem.dataset.isOthers = isOthers;
  if (isOthers) {
    categoryItem.classList.add('category-item-others');
    // Store full list for filtering
    allUncategorizedDomains = Array.isArray(domains) ? [...domains] : [];
  }

  const domainList = Array.isArray(domains) ? domains : [];

  // For Others category, use checkboxes and search
  if (isOthers) {
    const domainTags = domainList.map(domain => `
      <label class="domain-tag-selectable">
        <input type="checkbox" class="domain-checkbox" data-domain="${domain}" />
        <span class="domain-tag-text">${domain}</span>
      </label>
    `).join('');

    const systemBadge = isSystem ? '<span style="background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-left: 8px;">System</span>' : '';
    const othersBadge = isOthers ? '<span style="background: #fff3cd; color: #856404; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-left: 8px;">Uncategorized</span>' : '';
    const domainCount = domainList.length;

    categoryItem.innerHTML = `
      <div class="category-item-header">
        <div class="category-item-name">${categoryName}${systemBadge}${othersBadge} <span style="color: #6b7280; font-size: 12px; font-weight: 500;">(${domainCount} domains)</span></div>
        <div class="category-item-actions">
          <button class="btn-small" id="selectAllOthers" style="display: none;">Select All</button>
          <button class="btn-small" id="deselectAllOthers" style="display: none;">Deselect All</button>
        </div>
      </div>
      <div class="others-search-container">
        <input type="text" class="others-search-input" placeholder="🔍 Search domains..." id="othersSearchInput" />
      </div>
      <div class="domain-list others-domain-list" data-category-name="${categoryName}" data-is-system="${isSystem}">
        ${domainTags || '<span style="color: #6c757d; font-size: 12px;">No domains yet</span>'}
      </div>
    `;
  } else {
    // Regular categories use the original design
    const domainTags = domainList.map(domain => `
      <span class="domain-tag" draggable="true" data-domain="${domain}">
        ${domain}
        <span class="remove" data-domain="${domain}">×</span>
      </span>
    `).join('');

    const systemBadge = isSystem ? '<span style="background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-left: 8px;">System</span>' : '';

    categoryItem.innerHTML = `
      <div class="category-item-header">
        <div class="category-item-name">${categoryName}${systemBadge}</div>
        <div class="category-item-actions">
          <button class="btn-small btn-edit-category" data-category-name="${categoryName}" data-is-system="${isSystem}">Edit Name</button>
          ${!isSystem ? `<button class="btn-small btn-delete-category" data-category-name="${categoryName}">Delete</button>` : ''}
        </div>
      </div>
      <div class="domain-list" data-category-name="${categoryName}" data-is-system="${isSystem}">
        ${domainTags || '<span style="color: #6c757d; font-size: 12px;">No domains yet</span>'}
      </div>
      <div class="add-domain-input">
        <input type="text" placeholder="Add domain (e.g., example.com)" data-category="${categoryName}" data-is-system="${isSystem}" />
        <button class="btn-small btn-primary btn-add-domain" data-category-name="${categoryName}" data-is-system="${isSystem}">Add Domain</button>
      </div>
    `;
  }

  container.appendChild(categoryItem);

  // Setup Others category specific handlers
  if (isOthers) {
    setupOthersCategoryHandlers(categoryItem);
  }
}

// Setup handlers for category items
function setupCategoryItemHandlers() {
  const categoriesList = document.getElementById('categoriesList');

  // Setup remove domain handlers
  categoriesList.querySelectorAll('.domain-tag .remove').forEach(removeBtn => {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const domain = e.target.dataset.domain;
      const categoryItem = e.target.closest('.category-item');
      const categoryName = categoryItem.dataset.categoryName;
      const isSystem = categoryItem.dataset.isSystem === 'true';
      removeDomainFromCategory(categoryName, domain, isSystem);
    });
  });

  // Setup add domain handlers (Enter key and button click)
  categoriesList.querySelectorAll('.add-domain-input input').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const categoryName = input.dataset.category;
        const isSystem = input.dataset.isSystem === 'true';
        const addBtn = input.nextElementSibling;
        addDomainToCategory(categoryName, input, isSystem);
      }
    });
  });

  // Setup add domain button handlers
  categoriesList.querySelectorAll('.btn-add-domain').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const categoryName = btn.dataset.categoryName;
      const isSystem = btn.dataset.isSystem === 'true';
      const input = btn.previousElementSibling;
      addDomainToCategory(categoryName, input, isSystem);
    });
  });

  // Setup edit category name button handlers
  categoriesList.querySelectorAll('.btn-edit-category').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const categoryName = btn.dataset.categoryName;
      const isSystem = btn.dataset.isSystem === 'true';
      editCategoryName(categoryName, isSystem);
    });
  });

  // Setup delete category button handlers
  categoriesList.querySelectorAll('.btn-delete-category').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const categoryName = btn.dataset.categoryName;
      deleteCategory(categoryName);
    });
  });
}

// Setup handlers for Others category (search, checkboxes, bulk actions)
function setupOthersCategoryHandlers(categoryItem) {
  const searchInput = categoryItem.querySelector('.others-search-input');
  const domainList = categoryItem.querySelector('.others-domain-list');
  const selectAllBtn = categoryItem.querySelector('#selectAllOthers');
  const deselectAllBtn = categoryItem.querySelector('#deselectAllOthers');

  // Search/filter functionality
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();
      filterOthersDomains(domainList, searchTerm);
    });
  }

  // Checkbox change handlers
  domainList.querySelectorAll('.domain-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const domain = e.target.dataset.domain;
      if (e.target.checked) {
        selectedDomains.add(domain);
      } else {
        selectedDomains.delete(domain);
      }
      updateFloatingActionBar();
      updateSelectAllButtons(selectAllBtn, deselectAllBtn, domainList);
    });
  });

  // Select All / Deselect All buttons
  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', () => {
      const visibleCheckboxes = domainList.querySelectorAll('.domain-checkbox:not([style*="display: none"])');
      visibleCheckboxes.forEach(cb => {
        cb.checked = true;
        selectedDomains.add(cb.dataset.domain);
      });
      updateFloatingActionBar();
      updateSelectAllButtons(selectAllBtn, deselectAllBtn, domainList);
    });
  }

  if (deselectAllBtn) {
    deselectAllBtn.addEventListener('click', () => {
      const visibleCheckboxes = domainList.querySelectorAll('.domain-checkbox:not([style*="display: none"])');
      visibleCheckboxes.forEach(cb => {
        cb.checked = false;
        selectedDomains.delete(cb.dataset.domain);
      });
      updateFloatingActionBar();
      updateSelectAllButtons(selectAllBtn, deselectAllBtn, domainList);
    });
  }

  // Initial update of Select All buttons
  updateSelectAllButtons(selectAllBtn, deselectAllBtn, domainList);
}

// Filter domains in Others category based on search term
function filterOthersDomains(domainList, searchTerm) {
  const checkboxes = domainList.querySelectorAll('.domain-tag-selectable');
  let visibleCount = 0;

  checkboxes.forEach(label => {
    const domain = label.querySelector('.domain-checkbox').dataset.domain;
    const matches = !searchTerm || domain.toLowerCase().includes(searchTerm);

    if (matches) {
      label.style.display = '';
      visibleCount++;
    } else {
      label.style.display = 'none';
    }
  });

  // Show message if no results
  let noResultsMsg = domainList.querySelector('.no-results-message');
  if (visibleCount === 0 && searchTerm) {
    if (!noResultsMsg) {
      noResultsMsg = document.createElement('div');
      noResultsMsg.className = 'no-results-message';
      noResultsMsg.style.cssText = 'color: #6c757d; font-size: 12px; padding: 20px; text-align: center;';
      domainList.appendChild(noResultsMsg);
    }
    noResultsMsg.textContent = `No domains match "${searchTerm}"`;
  } else if (noResultsMsg) {
    noResultsMsg.remove();
  }

  // Update Select All buttons after filtering
  const categoryItem = domainList.closest('.category-item');
  if (categoryItem) {
    const selectAllBtn = categoryItem.querySelector('#selectAllOthers');
    const deselectAllBtn = categoryItem.querySelector('#deselectAllOthers');
    updateSelectAllButtons(selectAllBtn, deselectAllBtn, domainList);
  }
}

// Update Select All / Deselect All button visibility
function updateSelectAllButtons(selectAllBtn, deselectAllBtn, domainList) {
  if (!selectAllBtn || !deselectAllBtn) return;

  const visibleCheckboxes = Array.from(domainList.querySelectorAll('.domain-checkbox:not([style*="display: none"])'));
  const checkedCount = visibleCheckboxes.filter(cb => cb.checked).length;

  if (visibleCheckboxes.length > 0) {
    selectAllBtn.style.display = checkedCount < visibleCheckboxes.length ? 'inline-block' : 'none';
    deselectAllBtn.style.display = checkedCount > 0 ? 'inline-block' : 'none';
  } else {
    selectAllBtn.style.display = 'none';
    deselectAllBtn.style.display = 'none';
  }
}

// Update floating action bar visibility and content
function updateFloatingActionBar() {
  let actionBar = document.getElementById('floatingActionBar');

  if (selectedDomains.size === 0) {
    if (actionBar) {
      actionBar.remove();
    }
    return;
  }

  // Create action bar if it doesn't exist
  if (!actionBar) {
    actionBar = document.createElement('div');
    actionBar.id = 'floatingActionBar';
    actionBar.className = 'floating-action-bar';
    document.getElementById('settingsContainer').appendChild(actionBar);
  }

  // Get all available categories (system + user)
  const allCategories = [];
  Object.keys(SYSTEM_CATEGORIES).forEach(cat => {
    allCategories.push({ name: cat, isSystem: true });
  });
  Object.keys(userCategories).forEach(cat => {
    if (cat !== 'Others') {
      allCategories.push({ name: cat, isSystem: false });
    }
  });

  const selectedCount = selectedDomains.size;
  const categoryButtons = allCategories.map(cat =>
    `<button class="floating-category-btn" data-category="${cat.name}" data-is-system="${cat.isSystem}">${cat.name}</button>`
  ).join('');

  actionBar.innerHTML = `
    <div class="floating-action-bar-content">
      <span class="floating-action-bar-text">${selectedCount} domain${selectedCount > 1 ? 's' : ''} selected</span>
      <div class="floating-category-buttons">
        ${categoryButtons}
      </div>
      <button class="floating-cancel-btn" id="cancelSelection">Cancel</button>
    </div>
  `;

  // Setup category button handlers
  actionBar.querySelectorAll('.floating-category-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const categoryName = e.target.dataset.category;
      const isSystem = e.target.dataset.isSystem === 'true';
      moveSelectedDomainsToCategory(categoryName, isSystem);
    });
  });

  // Setup cancel button
  actionBar.querySelector('#cancelSelection').addEventListener('click', () => {
    clearSelection();
  });
}

// Move selected domains to a category
function moveSelectedDomainsToCategory(categoryName, isSystem) {
  const domainsToMove = Array.from(selectedDomains);

  if (domainsToMove.length === 0) return;

  // Move each domain directly (without triggering individual renders)
  domainsToMove.forEach(domain => {
    if (isSystem) {
      // For system categories, track additions in overrides
      if (!systemCategoryOverrides[categoryName]) {
        systemCategoryOverrides[categoryName] = { added: [], removed: [] };
      }
      const currentDomains = getSystemCategoryWithOverrides(categoryName);
      if (!currentDomains.includes(domain)) {
        systemCategoryOverrides[categoryName].added.push(domain);
      }
    } else {
      // For user categories
      if (!userCategories[categoryName]) {
        userCategories[categoryName] = [];
      }
      if (!userCategories[categoryName].includes(domain)) {
        userCategories[categoryName].push(domain);
      }
    }
  });

  // Save once after all moves
  saveUserCategories();

  // Clear selection and refresh view
  clearSelection();
  renderSettingsView();
}

// Clear all selections
function clearSelection() {
  selectedDomains.clear();
  const categoriesList = document.getElementById('categoriesList');
  categoriesList.querySelectorAll('.domain-checkbox').forEach(cb => {
    cb.checked = false;
  });
  updateFloatingActionBar();

  // Update Select All buttons
  const othersCategory = categoriesList.querySelector('.category-item-others');
  if (othersCategory) {
    const domainList = othersCategory.querySelector('.others-domain-list');
    const selectAllBtn = othersCategory.querySelector('#selectAllOthers');
    const deselectAllBtn = othersCategory.querySelector('#deselectAllOthers');
    updateSelectAllButtons(selectAllBtn, deselectAllBtn, domainList);
  }
}

// Setup drag and drop functionality
function setupDragAndDrop() {
  const categoriesList = document.getElementById('categoriesList');

  // Make all domain tags draggable (except remove buttons and Others category)
  // Skip Others category - it uses checkboxes instead
  categoriesList.querySelectorAll('.category-item:not(.category-item-others) .domain-tag').forEach(tag => {
    // Prevent drag when clicking on remove button
    const removeBtn = tag.querySelector('.remove');
    if (removeBtn) {
      removeBtn.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });
      removeBtn.style.pointerEvents = 'auto';
      removeBtn.style.cursor = 'pointer';
    }

    tag.addEventListener('dragstart', (e) => {
      // Don't start drag if clicking on remove button
      if (e.target.classList.contains('remove')) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', tag.dataset.domain);
      tag.classList.add('dragging');
    });

    tag.addEventListener('dragend', (e) => {
      tag.classList.remove('dragging');
      // Remove drag-over class from all drop zones
      categoriesList.querySelectorAll('.drop-zone, .domain-list').forEach(zone => {
        zone.classList.remove('drag-over');
      });
    });
  });

  // Setup drop zones (all category domain lists)
  categoriesList.querySelectorAll('.domain-list').forEach(dropZone => {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
      // Only remove drag-over if we're actually leaving the drop zone
      const rect = dropZone.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        dropZone.classList.remove('drag-over');
      }
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');

      const draggedDomain = e.dataTransfer.getData('text/plain');
      const targetCategoryName = dropZone.dataset.categoryName;
      const targetIsSystem = dropZone.dataset.isSystem === 'true';

      // Find the source category
      const draggedTag = categoriesList.querySelector(`.domain-tag[data-domain="${draggedDomain}"].dragging`);
      if (!draggedTag) return;

      const sourceCategoryItem = draggedTag.closest('.category-item');
      const sourceCategoryName = sourceCategoryItem.dataset.categoryName;
      const sourceIsSystem = sourceCategoryItem.dataset.isSystem === 'true';
      const sourceIsOthers = sourceCategoryItem.dataset.isOthers === 'true';

      // Don't do anything if dropping on the same category
      if (sourceCategoryName === targetCategoryName) {
        return;
      }

      // Check if domain already exists in target
      let targetDomains = [];
      if (targetIsSystem) {
        targetDomains = getSystemCategoryWithOverrides(targetCategoryName);
      } else {
        targetDomains = userCategories[targetCategoryName] || [];
      }

      if (targetDomains.includes(draggedDomain)) {
        // Domain already in target category, just remove from source if not Others
        if (!sourceIsOthers) {
          removeDomainFromCategory(sourceCategoryName, draggedDomain, sourceIsSystem);
        }
        return;
      }

      // Remove from source category first (if not Others)
      if (!sourceIsOthers) {
        removeDomainFromCategory(sourceCategoryName, draggedDomain, sourceIsSystem);
      }

      // Add to target category
      // Create a temporary input element to use addDomainToCategory
      const tempInput = document.createElement('input');
      tempInput.value = draggedDomain;
      addDomainToCategory(targetCategoryName, tempInput, targetIsSystem);
    });
  });
}

// Add domain to category
function addDomainToCategory(categoryName, inputElement, isSystem = false) {
  const domain = inputElement.value.trim();
  if (!domain) return;

  if (isSystem) {
    // For system categories, track additions in overrides
    if (!systemCategoryOverrides[categoryName]) {
      systemCategoryOverrides[categoryName] = { added: [], removed: [] };
    }
    const currentDomains = getSystemCategoryWithOverrides(categoryName);
    if (currentDomains.includes(domain)) {
      alert('Domain already exists in this category');
      inputElement.value = '';
      return;
    }
    systemCategoryOverrides[categoryName].added.push(domain);
    saveUserCategories();
    renderSettingsView();
  } else {
    // For user categories
    if (!userCategories[categoryName]) {
      userCategories[categoryName] = [];
    }
    if (!userCategories[categoryName].includes(domain)) {
      userCategories[categoryName].push(domain);
      saveUserCategories();
      renderSettingsView();
    } else {
      alert('Domain already exists in this category');
    }
  }
  inputElement.value = '';
}

// Remove domain from category
function removeDomainFromCategory(categoryName, domain, isSystem = false) {
  if (isSystem) {
    // For system categories, track removals in overrides
    if (!systemCategoryOverrides[categoryName]) {
      systemCategoryOverrides[categoryName] = { added: [], removed: [] };
    }
    // If it was user-added, remove from added list
    if (systemCategoryOverrides[categoryName].added.includes(domain)) {
      systemCategoryOverrides[categoryName].added = systemCategoryOverrides[categoryName].added.filter(d => d !== domain);
    } else {
      // Otherwise, add to removed list
      systemCategoryOverrides[categoryName].removed.push(domain);
    }
    saveUserCategories();
    renderSettingsView();
  } else {
    // For user categories
    if (userCategories[categoryName]) {
      userCategories[categoryName] = userCategories[categoryName].filter(d => d !== domain);
      if (userCategories[categoryName].length === 0) {
        delete userCategories[categoryName];
      }
      saveUserCategories();
      renderSettingsView();
    }
  }
}

// Edit category name
function editCategoryName(oldName, isSystem = false) {
  if (isSystem) {
    // For system categories, we can't rename them, but we can create a copy
    const newName = prompt('Enter new category name (this will create a copy):', oldName);
    if (newName && newName.trim() && newName.trim() !== oldName) {
      if (userCategories[newName.trim()] || SYSTEM_CATEGORIES[newName.trim()]) {
        alert('A category with this name already exists');
        return;
      }
      // Copy domains from system category to new user category
      const domains = getSystemCategoryWithOverrides(oldName);
      userCategories[newName.trim()] = [...domains];
      saveUserCategories();
      renderSettingsView();
    }
  } else {
    // For user categories
    const newName = prompt('Enter new category name:', oldName);
    if (newName && newName.trim() && newName.trim() !== oldName) {
      if (userCategories[newName.trim()] || SYSTEM_CATEGORIES[newName.trim()]) {
        alert('A category with this name already exists');
        return;
      }
      userCategories[newName.trim()] = userCategories[oldName];
      delete userCategories[oldName];
      saveUserCategories();
      renderSettingsView();
    }
  }
}

// Delete category
function deleteCategory(categoryName) {
  if (confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
    delete userCategories[categoryName];
    saveUserCategories();
    renderSettingsView();
  }
}

// Add new category
function addNewCategory() {
  const nameInput = document.getElementById('newCategoryName');
  const categoryName = nameInput.value.trim();
  if (!categoryName) {
    alert('Please enter a category name');
    return;
  }

  // "Others" is a reserved category name (used for uncategorized domains)
  if (categoryName === 'Others') {
    alert('"Others" is a reserved category name and cannot be used. It is automatically created for uncategorized domains.');
    return;
  }

  // Check both user categories and system categories (case-sensitive)
  if (userCategories[categoryName] || SYSTEM_CATEGORIES[categoryName]) {
    alert('A category with this name already exists');
    return;
  }

  userCategories[categoryName] = [];
  saveUserCategories();
  renderSettingsView();
  nameInput.value = '';
}

// Add Enter key submission support
function setupEnterKeySubmission() {
  // Get all input and select elements
  const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]');
  inputs.forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const sendButton = document.getElementById("send");
        if (!sendButton.disabled) {
          executeQuery();
        }
      }
    });
  });
}

// Get available dates from history
async function getAvailableDates() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: "FETCH_HISTORY",
        startTime: Date.now() - 1000 * 60 * 60 * 24 * 365, // Last year
        maxResults: 50000
      },
      (response) => {
        const dateSet = new Set();
        if (response && response.visits) {
          response.visits.forEach(visit => {
            const date = new Date(visit.visited_at).toISOString().split('T')[0];
            dateSet.add(date);
          });
        }
        const dates = Array.from(dateSet).sort();
        resolve(dates);
      }
    );
  });
}

// Store available dates globally for validation
let availableDatesSet = new Set();
let dateInputsSetup = false;

// Setup date inputs with availability checking
async function setupDateInputs() {
  const dates = await getAvailableDates();
  if (dates.length === 0) return;

  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];
  availableDatesSet = new Set(dates);

  // Set min/max for all date inputs
  const dateInputs = document.querySelectorAll('input[type="date"]');
  dateInputs.forEach(input => {
    input.setAttribute('min', minDate);
    input.setAttribute('max', maxDate);

    // Add has-value class if input already has a value
    if (input.value) {
      input.classList.add('has-value');
    }

    // Remove existing event listener if already set up
    if (dateInputsSetup && input.dataset.dateListenerAdded) {
      return; // Already set up
    }

    // Store previous valid value
    let previousValidValue = input.value || '';

    // Aggressive validation - intercept invalid dates immediately
    const validateAndClearInvalid = (e) => {
      const selectedDate = e.target.value;

      // If date is selected and not in available dates, clear it immediately
      if (selectedDate && !availableDatesSet.has(selectedDate)) {
        // Immediately clear the invalid date
        e.target.value = '';
        previousValidValue = '';
        // Remove has-value class
        input.classList.remove('has-value');

        // Show error message
        let errorMsg = input.parentElement.querySelector('.date-error');
        if (!errorMsg) {
          errorMsg = document.createElement('div');
          errorMsg.className = 'date-error';
          errorMsg.style.cssText = 'color: #dc3545; font-size: 12px; margin-top: 4px;';
          input.parentElement.appendChild(errorMsg);
        }
        errorMsg.textContent = `No data available for ${selectedDate}. Only dates with history data can be selected.`;
        input.style.borderColor = '#dc3545';

        // Clear error after a delay
        setTimeout(() => {
          if (errorMsg && errorMsg.parentElement) {
            errorMsg.remove();
            input.style.borderColor = '';
          }
        }, 4000);

        // Trigger validation to update button state
        validateRequiredFields();
      } else if (selectedDate) {
        // Date is valid, update previous valid value
        previousValidValue = selectedDate;
        // Add has-value class for styling
        input.classList.add('has-value');

        // Clear any existing error
        const errorMsg = input.parentElement.querySelector('.date-error');
        if (errorMsg) {
          errorMsg.remove();
        }
        input.style.borderColor = '';

        // Trigger validation to update button state
        validateRequiredFields();
      }
    };

    // Use multiple events to catch date selection from calendar
    // 'input' fires when value changes (including calendar selection)
    input.addEventListener('input', validateAndClearInvalid);
    // Also update has-value class on input
    input.addEventListener('input', function() {
      if (this.value) {
        this.classList.add('has-value');
      } else {
        this.classList.remove('has-value');
      }
    });
    // 'change' fires when user commits the change
    input.addEventListener('change', validateAndClearInvalid);
    // 'blur' fires when input loses focus (catches manual typing)
    input.addEventListener('blur', validateAndClearInvalid);

    // Add title attribute for tooltip
    input.setAttribute('title', `Only dates with history data can be selected (${dates.length} dates available)`);
    input.dataset.dateListenerAdded = 'true';
  });
  dateInputsSetup = true;

  // Set up click handlers for all date inputs to open picker when clicking anywhere
  setupDateInputClickHandlers();
}

// Setup click handlers for all date inputs to open picker on click
function setupDateInputClickHandlers() {
  const allDateInputs = document.querySelectorAll('input[type="date"], input[type="datetime-local"]');
  setupDateInputClickHandlersForInputs(allDateInputs);
}

// Setup click handlers for date inputs in a specific section
function setupDateInputClickHandlersForSection(section) {
  const dateInputs = section.querySelectorAll('input[type="date"], input[type="datetime-local"]');
  setupDateInputClickHandlersForInputs(dateInputs);
}

// Common function to set up click handlers for a collection of date inputs
function setupDateInputClickHandlersForInputs(dateInputs) {
  dateInputs.forEach(input => {
    // Only add if not already added
    if (!input.dataset.clickHandlerAdded) {
      input.addEventListener('click', (e) => {
        // Focus the input to ensure it's active
        input.focus();
        // Try to show the picker if the browser supports it (modern browsers)
        if (input.showPicker) {
          try {
            input.showPicker();
          } catch (err) {
            // showPicker might fail in some contexts, that's okay
          }
        }
      });
      input.dataset.clickHandlerAdded = 'true';
    }
  });
}

// Setup validation listeners for required fields
function setupRequiredFieldValidation() {
  // Add listeners to all required input fields
  const requiredFields = {
    "top_domains_by_day": ["date"],
    "neighbor_visits": ["anchor"],
    "before_after_navigation": ["anchor_domain"],
    "history_search": ["search_query"]
  };

  // Get all unique field IDs
  const allFieldIds = new Set();
  Object.values(requiredFields).forEach(fields => {
    fields.forEach(fieldId => allFieldIds.add(fieldId));
  });

  // Add event listeners to each required field
  allFieldIds.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      // Listen to input, change, and blur events
      field.addEventListener("input", validateRequiredFields);
      field.addEventListener("change", validateRequiredFields);
      field.addEventListener("blur", validateRequiredFields);
    }
  });
}

// Setup date range toggle functionality
function setupDateRangeToggles() {
  const toggles = document.querySelectorAll('.date-range-toggle');
  toggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const operation = toggle.getAttribute('data-operation');
      const fields = document.querySelector(`.date-range-fields[data-operation="${operation}"]`);

      if (fields) {
        const isVisible = fields.style.display !== 'none';
        if (isVisible) {
          fields.style.display = 'none';
          toggle.textContent = '📅 Set custom date range';
        } else {
          fields.style.display = 'block';
          toggle.textContent = '📅 Hide date range';
        }
      }
    });
  });
}

// Setup customise widget toggle functionality
function setupCustomiseWidgets(container = document) {
  const widgets = container.querySelectorAll('.customise-widget');
  widgets.forEach(widget => {
    const header = widget.querySelector('.customise-widget-header');
    const content = widget.querySelector('.customise-widget-content');

    if (header && content) {
      // Remove any existing listeners by cloning
      const newHeader = header.cloneNode(true);
      header.parentNode.replaceChild(newHeader, header);

      newHeader.addEventListener('click', () => {
        const isExpanded = content.classList.contains('expanded');
        if (isExpanded) {
          content.classList.remove('expanded');
          newHeader.classList.remove('expanded');
        } else {
          content.classList.add('expanded');
          newHeader.classList.add('expanded');
        }
      });
    }
  });
}

// Initialize on page load
updateFieldsVisibility();
initializeNavigation();
setupEnterKeySubmission();
setupDateInputs();
setupDateInputClickHandlers();
setupDateRangeToggles();
setupRequiredFieldValidation();

// Setup add category button (after DOM is ready)
const addCategoryBtn = document.getElementById('addCategoryBtn');
const newCategoryNameInput = document.getElementById('newCategoryName');
if (addCategoryBtn) {
  addCategoryBtn.addEventListener('click', addNewCategory);
}
if (newCategoryNameInput) {
  newCategoryNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addNewCategory();
    }
  });
}

// Operation select is no longer used (removed with MCP mode)

function getInputValue(id, defaultValue = null) {
  const mode = getCurrentMode();
  let elem = null;

  // In local mode with operation form, search in the form container first
  if (mode === 'local' && currentView === 'operationForm') {
    const formContainer = document.getElementById('operationFormContainer');
    if (formContainer) {
      elem = formContainer.querySelector(`#${id}`);
    }
  }

  // Fallback to document-wide search
  if (!elem) {
    elem = document.getElementById(id);
  }

  return elem ? elem.value : defaultValue;
}

function getNumberInput(id, defaultValue = null) {
  const value = getInputValue(id);
  return value ? Number(value) : defaultValue;
}

// Get date range from inputs, with defaults
// Finds inputs within the currently visible section for the given operation
function getDateRange(operation = null) {
  let startDateValue = null;
  let endDateValue = null;
  const mode = getCurrentMode();

  // In local mode, search in the form container first
  if (mode === 'local' && currentView === 'operationForm') {
    const formContainer = document.getElementById('operationFormContainer');
    if (formContainer) {
      const startInput = formContainer.querySelector('input[id="start_date"]');
      const endInput = formContainer.querySelector('input[id="end_date"]');
      startDateValue = startInput ? startInput.value : null;
      endDateValue = endInput ? endInput.value : null;
    }
  } else if (operation) {
    // Find the visible section for this operation
    const visibleSection = document.querySelector(`.section[data-operation="${operation}"].visible`);
    if (visibleSection) {
      const startInput = visibleSection.querySelector('input[id="start_date"]');
      const endInput = visibleSection.querySelector('input[id="end_date"]');
      startDateValue = startInput ? startInput.value : null;
      endDateValue = endInput ? endInput.value : null;
    }
  } else {
    // Fallback: try to find any visible start_date/end_date inputs
    const visibleSections = document.querySelectorAll('.section.visible');
    for (const section of visibleSections) {
      const startInput = section.querySelector('input[id="start_date"]');
      const endInput = section.querySelector('input[id="end_date"]');
      if (startInput || endInput) {
        startDateValue = startInput ? startInput.value : null;
        endDateValue = endInput ? endInput.value : null;
        break;
      }
    }
  }

  // Default to 7 days ago to today if not specified
  // Use local time to avoid timezone issues
  let endDate, startDate;

  if (endDateValue) {
    // Parse date string and set to end of day in local time
    const [year, month, day] = endDateValue.split('-').map(Number);
    endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
  } else {
    endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
  }

  if (startDateValue) {
    // Parse date string and set to start of day in local time
    const [year, month, day] = startDateValue.split('-').map(Number);
    startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  } else {
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
  }

  return { startDate, endDate, startDateValue, endDateValue };
}

// Filter visits by date range
// Uses date strings (YYYY-MM-DD) for comparison to match runLocalTopDomainsByDay logic
// startDateStr and endDateStr are the date strings from user input (e.g., "2026-01-02")
function filterVisitsByDateRange(visits, startDateStr, endDateStr) {
  return visits.filter(visit => {
    // Use the same method as runLocalTopDomainsByDay: extract local date string from visit timestamp
    const ts = new Date(visit.visited_at);
    const year = ts.getFullYear();
    const month = String(ts.getMonth() + 1).padStart(2, '0');
    const day = String(ts.getDate()).padStart(2, '0');
    const visitDateStr = `${year}-${month}-${day}`;

    // Compare date strings directly
    return visitDateStr >= startDateStr && visitDateStr <= endDateStr;
  });
}

async function executeQuery() {
  // Always use local mode (MCP mode removed)
  const op = currentOperation;

  // Also update the hidden select for compatibility (if it exists)
  const operationSelect = document.getElementById("operation");
  if (operationSelect) {
    operationSelect.value = op;
  }

  // Prevent action if no operation is selected
  if (!op || op === "") {
    return;
  }

  showLoading();

  // Operations that support date range selection
  const dateRangeOperations = [
    "top_links", "top_domains", "visits_by_time_of_day", "sessions",
    "before_after_navigation", "history_search", "export_data", "navigation_paths",
    "domain_frequency", "domain_time_distribution", "category_inference", "daily_summary"
  ];

  // Get date range if operation supports it
  let dateRange = null;
  let daysBack = 7;
  if (dateRangeOperations.includes(op)) {
    dateRange = getDateRange(op);
    // Calculate daysBack to fetch enough history (add 1 day buffer)
    const daysDiff = Math.ceil((dateRange.endDate - dateRange.startDate) / (1000 * 60 * 60 * 24));
    daysBack = Math.max(daysDiff + 1, 7); // At least 7 days
  } else {
    // Determine time range based on operation
    if (op === "repeated_daily_habits" || op === "emerging_interests") {
      daysBack = 30;
    } else if (op === "browser_usage_timeline") {
      daysBack = 1;
    }
  }

  // Fetch history data
  chrome.runtime.sendMessage(
    {
      type: "FETCH_HISTORY",
      startTime: Date.now() - 1000 * 60 * 60 * 24 * daysBack,
      maxResults: 50000
    },
    async (response) => {
      // Run local logic
        let result;
        let timeRangeInfo = null;

        try {
          // Filter visits by date range if operation supports it
          let visits = response.visits;

          // Re-read date range inside callback to ensure we get current values
          if (dateRangeOperations.includes(op)) {
            const currentDateRange = getDateRange(op);
            // Use date strings for comparison, matching runLocalTopDomainsByDay logic
            // Both operations now extract local date strings (YYYY-MM-DD) from visit timestamps
            // So we should use the date string values directly if available, otherwise extract from Date objects
            const formatLocalDateStr = (date) => {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            };
            const startDateStr = currentDateRange.startDateValue || formatLocalDateStr(currentDateRange.startDate);
            const endDateStr = currentDateRange.endDateValue || formatLocalDateStr(currentDateRange.endDate);
            visits = filterVisitsByDateRange(visits, startDateStr, endDateStr);

            // Format dates in local timezone for display (YYYY-MM-DD)
            const formatLocalDate = (date) => {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            };

            // Always set date_range type to show actual date range
            timeRangeInfo = {
              type: 'date_range',
              startDate: formatLocalDate(currentDateRange.startDate),
              endDate: formatLocalDate(currentDateRange.endDate)
            };
          } else {
            // For operations without date range, visits stays as response.visits
            visits = response.visits;
          }

          if (op === "top_links") {
            const limit = getNumberInput("limit", 10);
            result = runLocalTopLinks(visits, limit);
            // timeRangeInfo already set above if dateRange exists
            if (!timeRangeInfo) timeRangeInfo = { type: 'default_range' };
          } else if (op === "top_domains") {
            const limit = getNumberInput("limit", 10);
            result = runLocalTopDomains(visits, limit);
            // timeRangeInfo already set above if dateRange exists
            if (!timeRangeInfo) timeRangeInfo = { type: 'default_range' };
          } else if (op === "top_domains_by_day") {
            const dateValue = getInputValue("date");
            if (!dateValue) {
              showError("Please select a date to view top domains for that day.");
              return;
            }
            // Double-check that the date has data (should never fail due to validation, but safety check)
            if (!availableDatesSet.has(dateValue)) {
              showError(`No data available for ${dateValue}. Please select a date with available history data.`);
              return;
            }
            result = runLocalTopDomainsByDay(response.visits, dateValue);
            timeRangeInfo = { type: 'exact_date', date: dateValue };
          } else if (op === "visits_by_time_of_day") {
            result = runLocalVisitsByTimeOfDay(visits);
            if (!timeRangeInfo) timeRangeInfo = { type: 'default_range' };
          } else if (op === "sessions") {
            const gapMinutes = getNumberInput("session_gap", 30);
            result = runLocalSessions(visits, gapMinutes);
            if (!timeRangeInfo) timeRangeInfo = { type: 'default_range' };
          } else if (op === "before_after_navigation") {
            const anchorDomain = getInputValue("anchor_domain");
            const direction = getInputValue("direction", "after");
            if (!anchorDomain) {
              showError("Please enter an anchor domain to analyze navigation patterns.");
              return;
            }
            result = runLocalBeforeAfterNavigation(visits, anchorDomain, direction);
            if (!timeRangeInfo) timeRangeInfo = { type: 'default_range' };
          } else if (op === "daily_summary") {
            let startDateValue = null;
            let endDateValue = null;

            // Check if date range fields are visible
            const formContainer = document.getElementById('operationFormContainer');
            let dateRangeFieldsVisible = false;
            if (formContainer) {
              const dateRangeFields = formContainer.querySelector('.date-range-fields[data-operation="daily_summary"]');
              dateRangeFieldsVisible = dateRangeFields && dateRangeFields.style.display !== 'none';
            }

            if (dateRangeFieldsVisible && dateRangeOperations.includes(op)) {
              // Get date values directly from inputs to avoid timezone conversion issues
              const formContainer = document.getElementById('operationFormContainer');
              if (formContainer) {
                const startInput = formContainer.querySelector('input[id="start_date"]');
                const endInput = formContainer.querySelector('input[id="end_date"]');
                startDateValue = startInput ? startInput.value : null;
                endDateValue = endInput ? endInput.value : null;
              } else {
                startDateValue = null;
                endDateValue = null;
              }
            } else {
              // If date range is not visible, default to just today
              const today = new Date().toISOString().split('T')[0];
              startDateValue = today;
              endDateValue = today;
            }

            result = runLocalDailySummary(response.visits, startDateValue, endDateValue);

            if (dateRangeFieldsVisible && startDateValue && endDateValue && startDateValue !== endDateValue) {
              timeRangeInfo = { type: 'date_range', startDate: startDateValue, endDate: endDateValue };
            } else {
              // Single date (today or the selected date)
              const dateToUse = endDateValue || startDateValue || new Date().toISOString().split('T')[0];
              timeRangeInfo = { type: 'exact_date', date: dateToUse };
            }
          } else if (op === "new_vs_familiar") {
            const days = getNumberInput("days", 7);
            result = runLocalNewVsFamiliar(response.visits, days);
            timeRangeInfo = { type: 'days', value: days };
          } else if (op === "category_tagging") {
            const dateValue = getInputValue("date");
            result = runLocalCategoryTagging(response.visits, dateValue || null);
            if (dateValue) {
              timeRangeInfo = { type: 'exact_date', date: dateValue };
            } else {
              timeRangeInfo = { type: 'all_time' };
            }
          } else if (op === "history_search") {
            const query = getInputValue("search_query");
            if (!query) {
              showError("Please enter a search query to search your browsing history.");
              return;
            }
            result = runLocalHistorySearch(visits, query);
            if (!timeRangeInfo) timeRangeInfo = { type: 'default_range' };
          } else if (op === "export_data") {
            const format = getInputValue("export_format", "json");
            result = runLocalExportData(visits, format);
            if (!timeRangeInfo) timeRangeInfo = { type: 'default_range' };
          } else if (op === "navigation_paths") {
            const limit = getNumberInput("limit", 10);
            result = runLocalNavigationPaths(visits, limit);
            if (!timeRangeInfo) timeRangeInfo = { type: 'default_range' };
          } else if (op === "repeated_patterns") {
            const days = getNumberInput("days", 7);
            result = runLocalRepeatedPatterns(response.visits, days);
            timeRangeInfo = { type: 'days', value: days };
          } else if (op === "domain_frequency") {
            result = runLocalDomainFrequency(visits);
            if (!timeRangeInfo) timeRangeInfo = { type: 'default_range' };
          } else if (op === "domain_time_distribution") {
            const domainFilter = getInputValue("domain_filter");
            result = runLocalDomainTimeDistribution(visits, domainFilter || null);
            if (!timeRangeInfo) timeRangeInfo = { type: 'default_range' };
          } else if (op === "category_inference") {
            result = runLocalCategoryInference(visits);
            if (!timeRangeInfo) timeRangeInfo = { type: 'default_range' };
          } else if (op === "productivity_vs_distraction") {
            const dateValue = getInputValue("date");
            result = runLocalProductivityVsDistraction(response.visits, dateValue || null);
            if (dateValue) {
              timeRangeInfo = { type: 'exact_date', date: dateValue };
            } else {
              timeRangeInfo = { type: 'all_time' };
            }
          } else if (op === "repeated_daily_habits") {
            const days = getNumberInput("days", 30);
            result = runLocalRepeatedDailyHabits(response.visits, days);
            timeRangeInfo = { type: 'days', value: days };
          } else if (op === "emerging_interests") {
            const days = getNumberInput("days", 7);
            result = runLocalEmergingInterests(response.visits, days);
            timeRangeInfo = { type: 'days', value: days };
          } else if (op === "browser_usage_timeline") {
            const hours = getNumberInput("hours", 24);
            result = runLocalBrowserUsageTimeline(response.visits, hours);
            timeRangeInfo = { type: 'hours', value: hours };
          } else if (op === "neighbor_visits") {
            const anchorValue = getInputValue("anchor");
            if (!anchorValue) {
              showError("Please enter an anchor URL to find neighboring visits.");
              return;
            }
            const anchorDateTime = getInputValue("anchor_datetime");
            const radiusMinutes = getNumberInput("radius", 30);
            result = runLocalNeighborVisits(response.visits, anchorValue, radiusMinutes, anchorDateTime || null);
            // For neighbor visits, show the anchor time context
            if (result && result.anchor_time) {
              const anchorDate = new Date(result.anchor_time);
              timeRangeInfo = { type: 'exact_date', date: anchorDate.toISOString().split('T')[0] };
            } else {
              timeRangeInfo = { type: 'default_range' };
            }
          } else {
            result = { error: "Unknown operation: " + op };
          }

          // Handle export specially
          if (op === "export_data" && typeof result === "string") {
            // Create download link for export
            const blob = new Blob([result], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `browsing_history_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            document.getElementById("output").innerHTML = '<div class="card"><div class="card-header">✅ Export Complete</div><div class="card-content">Your browsing history has been downloaded!</div></div>';
          } else {
            renderResult(op, result, timeRangeInfo);
          }
        } catch (error) {
          showError(`An error occurred while processing your request: ${error.message}. Please try again.`);
        }
    }
  );
}

document.getElementById("send").onclick = executeQuery;

// Rotating placeholder text for AI search bar
const sampleQueries = [
  "What topics dominate my browsing lately?",
  "Which subjects do I keep returning to?",
  "List the links that I visited related to ethnic metallic jewellery",
  "What kind of content distracts me?",
  "Find that Italian website I visited which has traditional recipes ",
  "What topics have I stopped caring about?",
  "How much time do I spend on politics? give detailed report.",
  "list the links which have been long pending to be read",
  "What do I spend more time on than I realize?",
  "How intentional is my browsing?"
];

function initRotatingPlaceholder() {
  const searchInput = document.querySelector('.ai-search-bar');
  if (!searchInput) return;

  let currentIndex = 0;
  const rotationInterval = 3000; // 3 seconds per placeholder
  const baseFontSize = 13; // Base font size in pixels (matches CSS)
  const minFontSize = 11; // Minimum font size to prevent text from being too small
  const maxTextLength = 75; // Approximate characters that fit comfortably at base font size

  function updatePlaceholder() {
    if (searchInput) {
      const query = sampleQueries[currentIndex];
      searchInput.placeholder = query;
      searchInput.title = query; // Show full text on hover

      // Dynamically adjust font size based on text length
      // Longer text gets smaller font size to fit better, but not too small
      if (query.length > maxTextLength) {
        // Calculate font size: reduce by 0.5px for every ~15 characters over the max
        const lengthDiff = query.length - maxTextLength;
        const sizeReduction = Math.floor(lengthDiff / 15) * 0.5;
        const calculatedSize = Math.max(
          minFontSize,
          baseFontSize - sizeReduction
        );
        searchInput.style.fontSize = `${calculatedSize}px`;
      } else {
        // Reset to base font size for shorter queries
        searchInput.style.fontSize = `${baseFontSize}px`;
      }

      currentIndex = (currentIndex + 1) % sampleQueries.length;
    }
  }

  // Set initial placeholder
  updatePlaceholder();

  // Rotate placeholder every 3 seconds
  setInterval(updatePlaceholder, rotationInterval);
}

// ============================================================================
// Contract-Based Operations (for AI Search Executor)
// Operations follow the contract: operation(ctx, params) → result
// ============================================================================

/**
 * Get history operation - returns data from context (no filtering needed here)
 * Time filtering is handled by the executor before passing data to operations
 */
function getHistory(ctx, params) {
  // This operation just returns the current data
  // Time filtering should be done by executor based on params.time
  return ctx.data;
}

/**
 * Top links operation (contract-based)
 */
function topLinks(ctx, params) {
  const data = ctx.data;
  const limit = params.limit || 10;

  const counter = {};
  data.forEach(v => {
    const normalizedUrl = normalizeUrl(v.url);
    counter[normalizedUrl] = (counter[normalizedUrl] || 0) + 1;
  });

  return Object.entries(counter)
    .map(([url, count]) => ({ url, visit_count: count }))
    .sort((a, b) => b.visit_count - a.visit_count)
    .slice(0, limit);
}

/**
 * Top domains operation (contract-based)
 */
function topDomains(ctx, params) {
  const data = ctx.data;
  const limit = params.limit || 10;

  const counts = {};
  data.forEach(v => {
    const domain = getDomain(v.url);
    if (domain) {
      counts[domain] = (counts[domain] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .map(([domain, visit_count]) => ({ domain, visit_count }))
    .sort((a, b) => b.visit_count - a.visit_count)
    .slice(0, limit || Infinity);
}

/**
 * Filter by domain operation (contract-based)
 */
function filterByDomain(ctx, params) {
  const data = ctx.data;
  const domain = params.domain;

  if (!domain) {
    return data; // No filter if domain not specified
  }

  return data.filter(v => {
    const visitDomain = getDomain(v.url);
    return visitDomain && visitDomain.includes(domain);
  });
}

/**
 * Neighbor visits operation (contract-based)
 */
function neighborVisits(ctx, params) {
  const data = ctx.data;
  const anchor = params.anchor || params.url_contains;
  const radiusMinutes = params.radius_minutes || 30;
  const anchorDateTime = params.anchor_datetime || null;

  if (!anchor) {
    return { error: "ANCHOR_REQUIRED", message: "Anchor URL or domain is required" };
  }

  let anchorMatches = data.filter(v => v.url.includes(anchor));

  if (anchorMatches.length === 0) {
    return { error: "ANCHOR_NOT_FOUND", anchorUrl: anchor };
  }

  // If datetime is provided, find the nearest anchor visit to that time
  let anchorVisit;
  if (anchorDateTime) {
    const targetTime = new Date(anchorDateTime);
    anchorVisit = anchorMatches.reduce((closest, current) => {
      const currentTime = new Date(current.visited_at);
      const closestTime = new Date(closest.visited_at);
      const currentDiff = Math.abs(currentTime - targetTime);
      const closestDiff = Math.abs(closestTime - targetTime);
      return currentDiff < closestDiff ? current : closest;
    });
  } else {
    anchorVisit = anchorMatches[0];
  }

  const anchorDomain = getDomain(anchorVisit.url);
  const anchorTime = new Date(anchorVisit.visited_at);
  const start = new Date(anchorTime.getTime() - radiusMinutes * 60 * 1000);
  const end = new Date(anchorTime.getTime() + radiusMinutes * 60 * 1000);

  const neighborDomains = new Set();
  const domainCounts = {};
  const neighborVisits = [];

  data.forEach(v => {
    const visitTime = new Date(v.visited_at);
    if (visitTime >= start && visitTime <= end &&
        !(v.url === anchorVisit.url && v.visited_at === anchorVisit.visited_at)) {
      const domain = getDomain(v.url);
      if (domain && domain !== anchorDomain) {
        neighborDomains.add(domain);
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        neighborVisits.push(v);
      }
    }
  });

  return {
    anchor_url: anchorVisit.url,
    anchor_time: anchorVisit.visited_at,
    anchor_domain: anchorDomain,
    radius_minutes: radiusMinutes,
    neighbor_domains: Array.from(neighborDomains),
    neighbor_visits: neighborVisits.sort((a, b) =>
      new Date(a.visited_at) - new Date(b.visited_at)
    ),
    domain_counts: Object.entries(domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
  };
}

/**
 * Sessions operation (contract-based)
 */
function sessionize(ctx, params) {
  const data = ctx.data;
  const sessionGapMinutes = params.session_gap || params.gap_minutes || 30;

  if (data.length === 0) return [];

  const sorted = [...data].sort((a, b) =>
    new Date(a.visited_at) - new Date(b.visited_at)
  );

  const sessions = [];
  let currentSession = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prevTime = new Date(sorted[i - 1].visited_at);
    const currTime = new Date(sorted[i].visited_at);
    const gapMinutes = (currTime - prevTime) / (1000 * 60);

    if (gapMinutes <= sessionGapMinutes) {
      currentSession.push(sorted[i]);
    } else {
      sessions.push({
        start: currentSession[0].visited_at,
        end: currentSession[currentSession.length - 1].visited_at,
        duration_minutes: Math.round(
          (new Date(currentSession[currentSession.length - 1].visited_at) -
           new Date(currentSession[0].visited_at)) / (1000 * 60)
        ),
        visit_count: currentSession.length,
        visits: currentSession
      });
      currentSession = [sorted[i]];
    }
  }

  if (currentSession.length > 0) {
    sessions.push({
      start: currentSession[0].visited_at,
      end: currentSession[currentSession.length - 1].visited_at,
      duration_minutes: Math.round(
        (new Date(currentSession[currentSession.length - 1].visited_at) -
         new Date(currentSession[0].visited_at)) / (1000 * 60)
      ),
      visit_count: currentSession.length,
      visits: currentSession
    });
  }

  return sessions;
}

/**
 * Group by operation (contract-based)
 */
function groupBy(ctx, params) {
  const data = ctx.data;
  const field = params.field || 'domain';

  const groups = {};

  data.forEach(v => {
    let key;
    if (field === 'domain') {
      key = getDomain(v.url) || 'unknown';
    } else if (field === 'url') {
      key = normalizeUrl(v.url);
    } else if (field === 'date') {
      const date = new Date(v.visited_at);
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } else {
      key = v[field] || 'unknown';
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(v);
  });

  return Object.entries(groups).map(([key, visits]) => ({
    [field]: key,
    count: visits.length,
    visits: visits
  }));
}

// ============================================================================
// Register Operations
// ============================================================================

// Register operations when registry is available
function registerAllOperations() {
  if (typeof registerOperation === 'undefined') {
    // Registry not loaded yet, will be called after script loads
    return;
  }

  // Get history - returns data as-is (time filtering handled by executor)
  registerOperation({
    name: 'get_history',
    description: 'Fetch browser history data. Time filtering is handled by the executor based on params.time',
    params: {
      time: { type: 'string', description: 'Time range: "yesterday", "last_week", "last_30_days", "all", etc.' }
    },
    execute: getHistory
  });

  // Top links
  registerOperation({
    name: 'top_links',
    description: 'Returns the most visited URLs',
    params: {
      limit: { type: 'number', default: 10, description: 'Maximum number of results' }
    },
    execute: topLinks
  });

  // Top domains
  registerOperation({
    name: 'top_domains',
    description: 'Returns the most visited domains',
    params: {
      limit: { type: 'number', default: 10, description: 'Maximum number of results' }
    },
    execute: topDomains
  });

  // Filter by domain
  registerOperation({
    name: 'filter_by_domain',
    description: 'Filters visits by domain name',
    params: {
      domain: { type: 'string', required: true, description: 'Domain to filter by (partial match)' }
    },
    execute: filterByDomain
  });

  // Neighbor visits
  registerOperation({
    name: 'neighbor_visits',
    description: 'Finds visits near the same time as an anchor URL',
    params: {
      anchor: { type: 'string', description: 'Anchor URL or domain to search for' },
      url_contains: { type: 'string', description: 'Alternative to anchor: URL substring to match' },
      radius_minutes: { type: 'number', default: 30, description: 'Time radius in minutes' },
      anchor_datetime: { type: 'string', description: 'Specific datetime for anchor (ISO format)' }
    },
    execute: neighborVisits
  });

  // Sessions
  registerOperation({
    name: 'sessionize',
    description: 'Groups browsing activity into sessions based on time gaps',
    params: {
      session_gap: { type: 'number', default: 30, description: 'Gap in minutes that defines a new session' },
      gap_minutes: { type: 'number', default: 30, description: 'Alternative parameter name for session_gap' }
    },
    execute: sessionize
  });

  // Group by
  registerOperation({
    name: 'group_by',
    description: 'Groups visits by a field (domain, url, date)',
    params: {
      field: { type: 'string', default: 'domain', description: 'Field to group by: "domain", "url", or "date"' }
    },
    execute: groupBy
  });

  // Semantic operations (v1 - local heuristics)
  if (typeof semanticFilter !== 'undefined') {
    registerOperation({
      name: 'semantic_filter',
      description: 'Filters visits based on semantic query using keyword and domain heuristics',
      params: {
        query: { type: 'string', required: true, description: 'Semantic query string to match against titles, URLs, and domains' }
      },
      execute: semanticFilter
    });

    registerOperation({
      name: 'filter_by_keywords',
      description: 'Filters visits by keywords in specified fields',
      params: {
        keywords: { type: 'array', required: true, description: 'Array of keywords to search for' },
        fields: { type: 'array', default: ['title', 'url'], description: 'Fields to search in: "title", "url", "domain"' }
      },
      execute: filterByKeywords
    });

    registerOperation({
      name: 'find_pending_links',
      description: 'Finds links visited once that are old (long pending to read)',
      params: {
        days_old: { type: 'number', default: 7, description: 'Minimum age in days to be considered "pending"' }
      },
      execute: findPendingLinks
    });

    registerOperation({
      name: 'find_distracting_content',
      description: 'Finds content from distracting domains (social media, entertainment)',
      params: {},
      execute: findDistractingContent
    });

    registerOperation({
      name: 'find_stopped_caring',
      description: 'Finds domains that were visited before but not recently',
      params: {
        recent_days: { type: 'number', default: 30, description: 'Number of days to consider as "recent"' }
      },
      execute: findStoppedCaring
    });
  }
}

// ============================================================================
// AI Search Handlers
// ============================================================================

/**
 * Handle AI search submission
 */
async function handleAISearch() {
  const searchInput = document.getElementById('aiSearchInput');
  const query = searchInput?.value.trim();

  if (!query) {
    return; // Empty query, do nothing
  }

  // Show loading state
  if (searchInput) {
    searchInput.classList.add('loading');
    searchInput.disabled = true;
  }

  const submitButton = document.getElementById('aiSearchSubmit');
  if (submitButton) {
    submitButton.disabled = true;
  }

  try {
    showLoading();

    // Check LLM configuration
    if (typeof getLLMConfig === 'undefined') {
      throw new Error('LLM client not loaded');
    }

    const llmConfig = await getLLMConfig();
    if (!llmConfig.provider || (llmConfig.provider === 'cloud' && !llmConfig.apiKey)) {
      showError('LLM not configured. Please configure it in Settings.');
      // Show configuration prompt
      const output = document.getElementById("output");
      if (output) {
        output.innerHTML = `
          <div class="card" style="background: #fff3cd; border-color: #ffc107;">
            <div class="card-header" style="color: #856404;">⚠️ LLM Not Configured</div>
            <div class="card-content" style="color: #856404; margin-top: 12px; padding: 16px;">
              <p style="margin-bottom: 12px;">Please configure your LLM in Settings before using AI search.</p>
              <button class="btn-small btn-primary" onclick="showSettingsView()" style="width: 100%;">Go to Settings</button>
            </div>
          </div>
        `;
      }
      return;
    }

    // Fetch history data
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "FETCH_HISTORY",
          startTime: 0,
          maxResults: 50000
        },
        resolve
      );
    });

    if (response.error) {
      showError(`Failed to fetch history: ${response.error}`);
      return;
    }

    if (!response.visits || response.visits.length === 0) {
      showError('No browsing history found.');
      return;
    }

    // Generate execution plan from LLM
    if (typeof generatePlan === 'undefined') {
      throw new Error('Plan generator not loaded');
    }

    let plan;
    try {
      plan = await generatePlan(query);
    } catch (error) {
      if (error.message.includes('Cannot connect') || error.message.includes('API key')) {
        showError(`LLM Error: ${error.message}`);
        return;
      }
      throw error;
    }

    // Execute plan
    if (typeof executePlan === 'undefined') {
      throw new Error('Query executor not loaded');
    }

    let result;
    try {
      result = executePlan(plan, response.visits);
    } catch (error) {
      showError(`Execution Error: ${error.message}`);
      return;
    }

    // Render results
    if (typeof renderAIResult === 'undefined') {
      throw new Error('Result renderer not loaded');
    }

    renderAIResult(query, plan, result);

  } catch (error) {
    showError(`An error occurred: ${error.message}`);
    console.error('AI Search Error:', error);
  } finally {
    // Hide loading state
    if (searchInput) {
      searchInput.classList.remove('loading');
      searchInput.disabled = false;
    }
    if (submitButton) {
      submitButton.disabled = false;
    }
    hideLoading();
  }
}

/**
 * Initialize AI search bar handlers
 */
function initAISearch() {
  const searchInput = document.getElementById('aiSearchInput');
  const submitButton = document.getElementById('aiSearchSubmit');

  if (!searchInput) {
    return; // AI search bar not found
  }

  // Enter key handler
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAISearch();
    }
  });

  // Submit button handler
  if (submitButton) {
    submitButton.addEventListener('click', (e) => {
      e.preventDefault();
      handleAISearch();
    });
  }

  // Focus on search bar when extension opens (optional)
  // searchInput.focus();
}

// ============================================================================
// State Persistence
// ============================================================================

/**
 * Save AI search result state to chrome.storage.local
 */
function saveAIResultState(query, plan, result, metadata = {}) {
  const state = {
    type: 'ai',
    query,
    plan,
    result,
    metadata,
    timestamp: Date.now()
  };
  chrome.storage.local.set({ lastResultState: state });
}

/**
 * Save local operation result state to chrome.storage.local
 */
function saveLocalResultState(operation, result, timeRangeInfo = null) {
  const state = {
    type: 'local',
    operation,
    result,
    timeRangeInfo,
    timestamp: Date.now()
  };
  chrome.storage.local.set({ lastResultState: state });
}

/**
 * Restore last result state from chrome.storage.local
 */
function restoreLastResultState() {
  chrome.storage.local.get(['lastResultState'], (items) => {
    if (chrome.runtime.lastError) {
      console.error('Error restoring state:', chrome.runtime.lastError);
      return;
    }

    const state = items.lastResultState;
    if (!state) {
      return; // No saved state
    }

    // Restore based on state type
    if (state.type === 'ai') {
      if (typeof renderAIResult !== 'undefined' && state.query && state.result !== undefined) {
        renderAIResult(state.query, state.plan, state.result, state.metadata || {});
      }
    } else if (state.type === 'local') {
      if (typeof renderResult !== 'undefined' && state.operation && state.result !== undefined) {
        renderResult(state.operation, state.result, state.timeRangeInfo || null);
      }
    }
  });
}

// Initialize rotating placeholder when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initRotatingPlaceholder();
    registerAllOperations();
    initAISearch();
    restoreLastResultState();
  });
} else {
  initRotatingPlaceholder();
  registerAllOperations();
  initAISearch();
  restoreLastResultState();
}
