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
            document.getElementById("output").textContent = "Export downloaded!";
          } else {
            document.getElementById("output").textContent =
              JSON.stringify(result, null, 2);
          }
        } catch (error) {
          document.getElementById("output").textContent =
            JSON.stringify({ error: error.message, stack: error.stack }, null, 2);
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
        document.getElementById("output").textContent =
          JSON.stringify(json, null, 2);
      }
    }
  );
};
