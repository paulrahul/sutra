// Utility functions
function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (e) {
    return null;
  }
}

function getCategory(domain) {
  if (!domain) return 'Other';

  const categoryMap = {
    // Social Media
    'facebook.com': 'Social Media',
    'twitter.com': 'Social Media',
    'x.com': 'Social Media',
    'instagram.com': 'Social Media',
    'linkedin.com': 'Social Media',
    'reddit.com': 'Social Media',
    'tiktok.com': 'Social Media',
    'youtube.com': 'Social Media',
    'pinterest.com': 'Social Media',
    'snapchat.com': 'Social Media',

    // News
    'cnn.com': 'News',
    'bbc.com': 'News',
    'nytimes.com': 'News',
    'theguardian.com': 'News',
    'reuters.com': 'News',
    'wsj.com': 'News',
    'npr.org': 'News',

    // Shopping
    'amazon.com': 'Shopping',
    'ebay.com': 'Shopping',
    'etsy.com': 'Shopping',
    'shopify.com': 'Shopping',
    'target.com': 'Shopping',
    'walmart.com': 'Shopping',

    // Productivity
    'github.com': 'Productivity',
    'stackoverflow.com': 'Productivity',
    'google.com': 'Productivity',
    'docs.google.com': 'Productivity',
    'drive.google.com': 'Productivity',
    'notion.so': 'Productivity',
    'trello.com': 'Productivity',
    'slack.com': 'Productivity',
    'zoom.us': 'Productivity',

    // Entertainment
    'netflix.com': 'Entertainment',
    'hulu.com': 'Entertainment',
    'disney.com': 'Entertainment',
    'spotify.com': 'Entertainment',
    'twitch.tv': 'Entertainment',

    // Education
    'coursera.org': 'Education',
    'edx.org': 'Education',
    'khanacademy.org': 'Education',
    'udemy.com': 'Education',
  };

  // Check exact match first
  if (categoryMap[domain]) {
    return categoryMap[domain];
  }

  // Check partial matches
  for (const [key, category] of Object.entries(categoryMap)) {
    if (domain.includes(key.replace(/\./g, '.'))) {
      return category;
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
function runLocalTopLinks(data, limit) {
  const counter = {};
  data.forEach(v => {
    counter[v.url] = (counter[v.url] || 0) + 1;
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
    if (ts.toISOString().split('T')[0] !== date) {
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
    return { error: "ANCHOR_NOT_FOUND" };
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

function runLocalDailySummary(data, days = 1) {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const dailyData = {};
  data.forEach(v => {
    const visitDate = new Date(v.visited_at);
    if (visitDate < startDate) return;

    const dateKey = visitDate.toISOString().split('T')[0];
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

  return Object.values(dailyData).map(day => ({
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
  }));
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

function runLocalNavigationPaths(data, limit = 10) {
  const sorted = [...data].sort((a, b) =>
    new Date(a.visited_at) - new Date(b.visited_at)
  );

  const pathCounts = {};
  for (let i = 0; i < sorted.length - 1; i++) {
    const from = getDomain(sorted[i].url);
    const to = getDomain(sorted[i + 1].url);

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

function runLocalNeighborVisits(data, anchor, radiusMinutes) {
  const anchorMatches = data.filter(v => v.url.includes(anchor));

  if (anchorMatches.length === 0) {
    return { error: "ANCHOR_NOT_FOUND" };
  }

  const anchorVisit = anchorMatches[0];
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

function showError(message) {
  const output = document.getElementById("output");
  output.innerHTML = `<div class="error">${message}</div>`;
}

function renderTopLinks(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No data found</div></div>';
  }

  const maxCount = Math.max(...data.map(item => item.visit_count || 0));

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">🔗 Top Visited Links</div>';
  html += '<div class="bar-chart">';

  data.forEach((item, index) => {
    const percentage = maxCount > 0 ? (item.visit_count / maxCount) * 100 : 0;
    const url = item.url || '';
    const domain = getDomain(url);
    html += `
      <div class="bar-item">
        <div class="bar-label" title="${url}">
          <strong>#${index + 1}</strong> ${domain || 'Unknown'}
        </div>
        <div class="bar-container">
          <div class="bar-fill" style="width: ${percentage}%">${item.visit_count}</div>
        </div>
        <div class="bar-value">${item.visit_count}</div>
      </div>
    `;
  });

  html += '</div></div></div>';
  return html;
}

function renderTopDomains(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No data found</div></div>';
  }

  const maxCount = Math.max(...data.map(item => item.visit_count || 0));

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">🌐 Top Domains</div>';
  html += '<div class="bar-chart">';

  data.forEach((item, index) => {
    const percentage = maxCount > 0 ? (item.visit_count / maxCount) * 100 : 0;
    const category = getCategory(item.domain);
    html += `
      <div class="bar-item">
        <div class="bar-label">
          <strong>#${index + 1}</strong> ${item.domain}
          <span class="category-badge category-${category.toLowerCase().replace(' ', '-')}">${category}</span>
        </div>
        <div class="bar-container">
          <div class="bar-fill" style="width: ${percentage}%">${item.visit_count}</div>
        </div>
        <div class="bar-value">${item.visit_count}</div>
      </div>
    `;
  });

  html += '</div></div></div>';
  return html;
}

function renderVisitsByTimeOfDay(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No data found</div></div>';
  }

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">⏰ Visits by Time of Day</div>';

  data.forEach(slot => {
    html += `<div class="time-slot">`;
    html += `<div class="time-slot-header">${slot.time_slot}</div>`;
    html += '<div class="bar-chart">';

    const maxCount = Math.max(...slot.domains.map(d => d.visit_count || 0));

    slot.domains.slice(0, 5).forEach(domain => {
      const percentage = maxCount > 0 ? (domain.visit_count / maxCount) * 100 : 0;
      html += `
        <div class="bar-item">
          <div class="bar-label">${domain.domain}</div>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${percentage}%">${domain.visit_count}</div>
          </div>
          <div class="bar-value">${domain.visit_count}</div>
        </div>
      `;
    });

    html += '</div></div>';
  });

  html += '</div></div>';
  return html;
}

function renderSessions(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No sessions found</div></div>';
  }

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">📅 Browsing Sessions</div>';

  data.slice(0, 10).forEach((session, index) => {
    const start = new Date(session.start);
    const end = new Date(session.end);
    html += `
      <div class="session-card">
        <div class="session-time">
          <strong>Session #${index + 1}</strong> • ${start.toLocaleString()} → ${end.toLocaleString()}
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

function renderDailySummary(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No data found</div></div>';
  }

  let html = '<div class="result-container">';

  data.forEach(day => {
    html += '<div class="card">';
    html += `<div class="card-header">📊 ${day.date}</div>`;
    html += '<div class="stats-grid">';
    html += `<div class="stat-card"><div class="stat-value">${day.total_visits}</div><div class="stat-label">Total Visits</div></div>`;
    html += `<div class="stat-card"><div class="stat-value">${day.unique_domains}</div><div class="stat-label">Unique Domains</div></div>`;
    html += '</div>';

    if (day.top_domains && day.top_domains.length > 0) {
      html += '<div style="margin-top: 16px;"><strong>Top Domains:</strong></div>';
      html += '<div class="bar-chart">';
      const maxCount = Math.max(...day.top_domains.map(d => d.count || 0));
      day.top_domains.forEach(domain => {
        const percentage = maxCount > 0 ? (domain.count / maxCount) * 100 : 0;
        html += `
          <div class="bar-item">
            <div class="bar-label">${domain.domain}</div>
            <div class="bar-container">
              <div class="bar-fill" style="width: ${percentage}%">${domain.count}</div>
            </div>
            <div class="bar-value">${domain.count}</div>
          </div>
        `;
      });
      html += '</div>';
    }

    html += '</div>';
  });

  html += '</div>';
  return html;
}

function renderCategoryTagging(data) {
  if (!data.categories || data.categories.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No data found</div></div>';
  }

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">🏷️ Category Tagging</div>';

  const maxCount = Math.max(...data.categories.map(c => c.visit_count || 0));

  data.categories.forEach(category => {
    const percentage = maxCount > 0 ? (category.visit_count / maxCount) * 100 : 0;
    html += `
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <strong>${category.category}</strong>
          <span style="font-weight: 600;">${category.visit_count} visits</span>
        </div>
        <div class="bar-container">
          <div class="bar-fill" style="width: ${percentage}%"></div>
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

function renderProductivityVsDistraction(data) {
  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">⚖️ Productivity vs Distraction</div>';
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

function renderHistorySearch(data) {
  if (!data.matches || data.matches.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">🔍</div><div>No matches found for "' + data.query + '"</div></div>';
  }

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">🔍 Search Results: "' + data.query + '"</div>';
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

function renderNavigationPaths(data) {
  if (!data.most_common_paths || data.most_common_paths.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No navigation paths found</div></div>';
  }

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">🛤️ Most Common Navigation Paths</div>';

  const maxCount = Math.max(...data.most_common_paths.map(p => p.count || 0));

  data.most_common_paths.forEach(path => {
    const percentage = maxCount > 0 ? (path.count / maxCount) * 100 : 0;
    html += `
      <div class="path-item">
        <div style="flex: 1;">
          <strong>${path.from}</strong>
          <span class="path-arrow"> → </span>
          <strong>${path.to}</strong>
        </div>
        <div class="bar-container" style="width: 150px;">
          <div class="bar-fill" style="width: ${percentage}%">${path.count}</div>
        </div>
        <div class="bar-value">${path.count}</div>
      </div>
    `;
  });

  html += '</div></div>';
  return html;
}

function renderNewVsFamiliar(data) {
  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">🆕 New vs Familiar Sites</div>';
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

function renderBeforeAfterNavigation(data) {
  if (data.error) {
    return `<div class="error">Anchor domain "${data.anchor_domain}" not found in history</div>`;
  }

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">🧭 Navigation ' + (data.direction === 'after' ? 'After' : 'Before') + ' ' + data.anchor_domain + '</div>';

  if (data.most_common && data.most_common.length > 0) {
    const maxCount = Math.max(...data.most_common.map(d => d.count || 0));
    html += '<div class="bar-chart">';
    data.most_common.forEach(item => {
      const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
      html += `
        <div class="bar-item">
          <div class="bar-label">${item.domain}</div>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${percentage}%">${item.count}</div>
          </div>
          <div class="bar-value">${item.count}</div>
        </div>
      `;
    });
    html += '</div>';
  }

  html += '</div></div>';
  return html;
}

function renderNeighborVisits(data) {
  if (data.error) {
    return `<div class="error">Anchor URL not found in history</div>`;
  }

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">🔗 Neighbor Visits</div>';
  html += `<div style="margin-bottom: 12px; color: #6c757d;">Around ${data.anchor_domain} at ${new Date(data.anchor_time).toLocaleString()}</div>`;

  if (data.domain_counts && data.domain_counts.length > 0) {
    const maxCount = Math.max(...data.domain_counts.map(d => d.count || 0));
    html += '<div class="bar-chart">';
    data.domain_counts.forEach(item => {
      const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
      html += `
        <div class="bar-item">
          <div class="bar-label">${item.domain}</div>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${percentage}%">${item.count}</div>
          </div>
          <div class="bar-value">${item.count}</div>
        </div>
      `;
    });
    html += '</div>';
  }

  html += '</div></div>';
  return html;
}

function renderCategoryInference(data) {
  if (!data.categories || data.categories.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No data found</div></div>';
  }

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">🏷️ Category Inference</div>';

  const maxCount = Math.max(...data.categories.map(c => c.visit_count || 0));

  data.categories.forEach(category => {
    const percentage = maxCount > 0 ? (category.visit_count / maxCount) * 100 : 0;
    html += `
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <strong>${category.category}</strong>
          <span style="font-weight: 600;">${category.visit_count} visits (${category.percentage})</span>
        </div>
        <div class="bar-container">
          <div class="bar-fill" style="width: ${percentage}%"></div>
        </div>
        <div style="margin-top: 4px; font-size: 12px; color: #6c757d;">
          ${category.unique_domains} unique domains
        </div>
      </div>
    `;
  });

  html += '</div></div>';
  return html;
}

function renderRepeatedPatterns(data) {
  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">🔄 Repeated Patterns (Last ' + data.period_days + ' days)</div>';

  if (data.by_hour && data.by_hour.length > 0) {
    html += '<div style="margin-bottom: 20px;"><strong>By Hour of Day:</strong></div>';
    data.by_hour.forEach(hourData => {
      html += `<div style="margin-bottom: 12px;"><strong>${hourData.hour}:00</strong>`;
      if (hourData.top_domains && hourData.top_domains.length > 0) {
        hourData.top_domains.forEach(domain => {
          html += `<span class="category-badge category-other" style="margin-left: 8px;">${domain.domain} (${domain.count})</span>`;
        });
      }
      html += '</div>';
    });
  }

  if (data.by_day_of_week && data.by_day_of_week.length > 0) {
    html += '<div style="margin-top: 20px; margin-bottom: 12px;"><strong>By Day of Week:</strong></div>';
    data.by_day_of_week.forEach(dayData => {
      html += `<div style="margin-bottom: 12px;"><strong>${dayData.day}</strong>`;
      if (dayData.top_domains && dayData.top_domains.length > 0) {
        dayData.top_domains.forEach(domain => {
          html += `<span class="category-badge category-other" style="margin-left: 8px;">${domain.domain} (${domain.count})</span>`;
        });
      }
      html += '</div>';
    });
  }

  html += '</div></div>';
  return html;
}

function renderRepeatedDailyHabits(data) {
  if (!data.daily_habits || data.daily_habits.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No daily habits found</div></div>';
  }

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">📅 Repeated Daily Habits (Last ' + data.period_days + ' days)</div>';

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

function renderEmergingInterests(data) {
  if (!data.emerging_interests || data.emerging_interests.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No emerging interests found</div></div>';
  }

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">📈 Emerging Interests (Last ' + data.period_days + ' days)</div>';

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

function renderBrowserUsageTimeline(data) {
  if (!data.timeline || data.timeline.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No timeline data found</div></div>';
  }

  let html = '<div class="result-container">';
  html += '<div class="card"><div class="card-header">⏱️ Browser Usage Timeline (Last ' + data.period_hours + ' hours)</div>';

  if (data.hourly_summary && data.hourly_summary.length > 0) {
    html += '<div style="margin-bottom: 16px;"><strong>Hourly Summary:</strong></div>';
    const maxCount = Math.max(...data.hourly_summary.map(h => h.visit_count || 0));
    data.hourly_summary.forEach(hour => {
      const percentage = maxCount > 0 ? (hour.visit_count / maxCount) * 100 : 0;
      html += `
        <div class="bar-item">
          <div class="bar-label">${hour.hour}:00 (${hour.unique_domains} domains)</div>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${percentage}%">${hour.visit_count}</div>
          </div>
          <div class="bar-value">${hour.visit_count}</div>
        </div>
      `;
    });
  }

  html += '</div></div>';
  return html;
}

function renderDomainTimeDistribution(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No data found</div></div>';
  }

  let html = '<div class="result-container">';

  data.forEach(domainData => {
    html += '<div class="card">';
    html += `<div class="card-header">⏰ ${domainData.domain}</div>`;
    html += `<div style="margin-bottom: 12px; color: #6c757d;">Peak hour: ${domainData.peak_hour}:00</div>`;

    if (domainData.hourly_distribution && domainData.hourly_distribution.length > 0) {
      const maxCount = Math.max(...domainData.hourly_distribution.map(h => h.count || 0));
      html += '<div class="bar-chart">';
      domainData.hourly_distribution.forEach(hour => {
        const percentage = maxCount > 0 ? (hour.count / maxCount) * 100 : 0;
        html += `
          <div class="bar-item">
            <div class="bar-label">${hour.hour}:00</div>
            <div class="bar-container">
              <div class="bar-fill" style="width: ${percentage}%">${hour.count}</div>
            </div>
            <div class="bar-value">${hour.count}</div>
          </div>
        `;
      });
      html += '</div>';
    }

    html += '</div>';
  });

  html += '</div>';
  return html;
}

function renderResult(operation, result) {
  const output = document.getElementById("output");

  if (result.error) {
    showError(result.error);
    return;
  }

  switch (operation) {
    case 'top_links':
      output.innerHTML = renderTopLinks(result);
      break;
    case 'top_domains':
    case 'top_domains_by_day':
      output.innerHTML = renderTopDomains(result);
      break;
    case 'domain_frequency':
      output.innerHTML = renderTopDomains(result);
      break;
    case 'visits_by_time_of_day':
      output.innerHTML = renderVisitsByTimeOfDay(result);
      break;
    case 'sessions':
      output.innerHTML = renderSessions(result);
      break;
    case 'daily_summary':
      output.innerHTML = renderDailySummary(result);
      break;
    case 'category_tagging':
      output.innerHTML = renderCategoryTagging(result);
      break;
    case 'category_inference':
      output.innerHTML = renderCategoryInference(result);
      break;
    case 'productivity_vs_distraction':
      output.innerHTML = renderProductivityVsDistraction(result);
      break;
    case 'history_search':
      output.innerHTML = renderHistorySearch(result);
      break;
    case 'navigation_paths':
      output.innerHTML = renderNavigationPaths(result);
      break;
    case 'new_vs_familiar':
      output.innerHTML = renderNewVsFamiliar(result);
      break;
    case 'before_after_navigation':
      output.innerHTML = renderBeforeAfterNavigation(result);
      break;
    case 'neighbor_visits':
      output.innerHTML = renderNeighborVisits(result);
      break;
    case 'repeated_patterns':
      output.innerHTML = renderRepeatedPatterns(result);
      break;
    case 'repeated_daily_habits':
      output.innerHTML = renderRepeatedDailyHabits(result);
      break;
    case 'emerging_interests':
      output.innerHTML = renderEmergingInterests(result);
      break;
    case 'browser_usage_timeline':
      output.innerHTML = renderBrowserUsageTimeline(result);
      break;
    case 'domain_time_distribution':
      output.innerHTML = renderDomainTimeDistribution(result);
      break;
    default:
      // Fallback to JSON for operations without specific renderers
      output.innerHTML = `<div class="card"><div class="card-header">Result</div><pre style="background: #f8f9fa; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 12px;">${JSON.stringify(result, null, 2)}</pre></div>`;
  }
}

// Get mode preference
function getMode() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['mode'], (result) => {
      // Default to 'local' if not set
      const savedMode = result.mode || 'local';
      resolve(savedMode);
    });
  });
}

// Get current mode from radio buttons
function getCurrentMode() {
  const modeLocal = document.getElementById("modeLocal");
  return modeLocal.checked ? 'local' : 'mcp';
}

// Save mode preference
function saveMode(mode) {
  chrome.storage.local.set({ mode });
}

// Show/hide fields based on selected operation and enable/disable button
function updateFieldsVisibility() {
  const op = document.getElementById("operation").value;
  const sections = document.querySelectorAll(".section[data-operation]");
  const sendButton = document.getElementById("send");

  // Show/hide sections based on operation
  sections.forEach(section => {
    if (section.getAttribute("data-operation") === op) {
      section.classList.add("visible");
    } else {
      section.classList.remove("visible");
    }
  });

  // Enable/disable button based on whether an operation is selected
  if (op === "" || op === "select") {
    sendButton.disabled = true;
  } else {
    sendButton.disabled = false;
  }
}

// Initialize mode radio buttons
async function initializeModeRadio() {
  const modeLocal = document.getElementById("modeLocal");
  const modeMCP = document.getElementById("modeMCP");
  const currentMode = await getMode();

  // Set the checked state based on saved preference
  if (currentMode === 'local') {
    modeLocal.checked = true;
  } else {
    modeMCP.checked = true;
  }

  // Add event listeners to both radio buttons
  modeLocal.addEventListener('change', () => {
    if (modeLocal.checked) {
      saveMode('local');
    }
  });

  modeMCP.addEventListener('change', () => {
    if (modeMCP.checked) {
      saveMode('mcp');
    }
  });
}

// Initialize on page load
updateFieldsVisibility();
initializeModeRadio();

// Update when operation changes
document.getElementById("operation").addEventListener("change", updateFieldsVisibility);

function getInputValue(id, defaultValue = null) {
  const elem = document.getElementById(id);
  return elem ? elem.value : defaultValue;
}

function getNumberInput(id, defaultValue = null) {
  const value = getInputValue(id);
  return value ? Number(value) : defaultValue;
}

document.getElementById("send").onclick = async () => {
  const op = document.getElementById("operation").value;

  // Prevent action if no operation is selected
  if (!op || op === "") {
    return;
  }

  showLoading();
  const mode = getCurrentMode();

  // Determine time range based on operation
  let daysBack = 7;
  if (op === "repeated_daily_habits" || op === "emerging_interests") {
    daysBack = 30;
  } else if (op === "browser_usage_timeline") {
    daysBack = 1;
  }

  // Fetch history data first (needed for both modes)
  chrome.runtime.sendMessage(
    {
      type: "FETCH_HISTORY",
      startTime: Date.now() - 1000 * 60 * 60 * 24 * daysBack,
      maxResults: 50000
    },
    async (response) => {
      if (mode === "local") {
        // Run local logic
        let result;

        try {
          if (op === "top_links") {
            const limit = getNumberInput("limit", 10);
            result = runLocalTopLinks(response.visits, limit);
          } else if (op === "top_domains") {
            const limit = getNumberInput("limit", 10);
            result = runLocalTopDomains(response.visits, limit);
          } else if (op === "top_domains_by_day") {
            const dateValue = getInputValue("date");
            if (!dateValue) {
              alert("Date is required for this operation");
              return;
            }
            result = runLocalTopDomainsByDay(response.visits, dateValue);
          } else if (op === "visits_by_time_of_day") {
            result = runLocalVisitsByTimeOfDay(response.visits);
          } else if (op === "sessions") {
            const gapMinutes = getNumberInput("session_gap", 30);
            result = runLocalSessions(response.visits, gapMinutes);
          } else if (op === "before_after_navigation") {
            const anchorDomain = getInputValue("anchor_domain");
            const direction = getInputValue("direction", "after");
            if (!anchorDomain) {
              alert("Anchor domain is required");
              return;
            }
            result = runLocalBeforeAfterNavigation(response.visits, anchorDomain, direction);
          } else if (op === "daily_summary") {
            const days = getNumberInput("days", 1);
            result = runLocalDailySummary(response.visits, days);
          } else if (op === "new_vs_familiar") {
            const days = getNumberInput("days", 7);
            result = runLocalNewVsFamiliar(response.visits, days);
          } else if (op === "category_tagging") {
            const dateValue = getInputValue("date");
            result = runLocalCategoryTagging(response.visits, dateValue || null);
          } else if (op === "history_search") {
            const query = getInputValue("search_query");
            if (!query) {
              alert("Search query is required");
              return;
            }
            result = runLocalHistorySearch(response.visits, query);
          } else if (op === "export_data") {
            const format = getInputValue("export_format", "json");
            result = runLocalExportData(response.visits, format);
          } else if (op === "navigation_paths") {
            const limit = getNumberInput("limit", 10);
            result = runLocalNavigationPaths(response.visits, limit);
          } else if (op === "repeated_patterns") {
            const days = getNumberInput("days", 7);
            result = runLocalRepeatedPatterns(response.visits, days);
          } else if (op === "domain_frequency") {
            result = runLocalDomainFrequency(response.visits);
          } else if (op === "domain_time_distribution") {
            const domainFilter = getInputValue("domain_filter");
            result = runLocalDomainTimeDistribution(response.visits, domainFilter || null);
          } else if (op === "category_inference") {
            result = runLocalCategoryInference(response.visits);
          } else if (op === "productivity_vs_distraction") {
            const dateValue = getInputValue("date");
            result = runLocalProductivityVsDistraction(response.visits, dateValue || null);
          } else if (op === "repeated_daily_habits") {
            const days = getNumberInput("days", 30);
            result = runLocalRepeatedDailyHabits(response.visits, days);
          } else if (op === "emerging_interests") {
            const days = getNumberInput("days", 7);
            result = runLocalEmergingInterests(response.visits, days);
          } else if (op === "browser_usage_timeline") {
            const hours = getNumberInput("hours", 24);
            result = runLocalBrowserUsageTimeline(response.visits, hours);
          } else if (op === "neighbor_visits") {
            const anchorValue = getInputValue("anchor");
            if (!anchorValue) {
              alert("Anchor URL is required for this operation");
              return;
            }
            const radiusMinutes = getNumberInput("radius", 30);
            result = runLocalNeighborVisits(response.visits, anchorValue, radiusMinutes);
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
            renderResult(op, result);
          }
        } catch (error) {
          showError(`Error: ${error.message}`);
        }
      } else {
        // Send to MCP (existing MCP operations only)
        const payload = {
          operation: op
        };

        if (op === "top_links") {
          payload.limit = getNumberInput("limit", 5);
        } else if (op === "top_domains_by_day") {
          const dateValue = getInputValue("date");
          if (!dateValue) {
            alert("Date is required for this operation");
            return;
          }
          payload.date = dateValue;
        } else if (op === "neighbor_visits") {
          const anchorValue = getInputValue("anchor");
          if (!anchorValue) {
            alert("Anchor URL is required for this operation");
            return;
          }
          payload.anchor = {
            url_contains: anchorValue
          };
          payload.radius_minutes = getNumberInput("radius", 30);
        }

        const res = await fetch("http://localhost:8082/mcp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            data: response.visits
          })
        });

        const json = await res.json();
        renderResult(op, json);
      }
    }
  );
};
