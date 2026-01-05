chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FETCH_HISTORY") {
    chrome.history.search(
      {
        text: "",
        startTime: message.startTime || 0,
        maxResults: message.maxResults || 10000
      },
      (results) => {
        if (chrome.runtime.lastError) {
          sendResponse({ visits: [], error: chrome.runtime.lastError.message });
          return;
        }

        if (!results || results.length === 0) {
          sendResponse({ visits: [] });
          return;
        }

        // Get all visits for each URL to get accurate visit counts
        const visitPromises = results.map((result) => {
          return new Promise((resolve) => {
            chrome.history.getVisits({ url: result.url }, (visitItems) => {
              if (chrome.runtime.lastError) {
                // If getVisits fails, fall back to the single visit from search
                resolve([{
                  url: result.url,
                  title: result.title || '',
                  visited_at: new Date(result.lastVisitTime).toISOString()
                }]);
                return;
              }

              // Filter visits within the time range
              const startTime = message.startTime || 0;
              const filteredVisits = visitItems
                .filter((visit) => visit.visitTime >= startTime)
                .map((visit) => ({
                  url: result.url,
                  title: result.title || '',
                  visited_at: new Date(visit.visitTime).toISOString()
                }));

              // If no visits in range, include at least the search result
              if (filteredVisits.length === 0 && result.lastVisitTime >= startTime) {
                resolve([{
                  url: result.url,
                  title: result.title || '',
                  visited_at: new Date(result.lastVisitTime).toISOString()
                }]);
              } else {
                resolve(filteredVisits);
              }
            });
          });
        });

        Promise.all(visitPromises).then((allVisitsArrays) => {
          const visits = allVisitsArrays.flat();
          sendResponse({ visits });
        }).catch((error) => {
          console.error("Error fetching visits:", error);
          sendResponse({ visits: [], error: error.message });
        });
      }
    );
    return true;
});
