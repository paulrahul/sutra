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

function runLocalTopDomainsByDay(data, date) {
  const counts = {};
  data.forEach(v => {
    const ts = new Date(v.visited_at);
    if (ts.toISOString().split('T')[0] !== date) {
      return;
    }
    try {
      const domain = new URL(v.url).hostname;
      counts[domain] = (counts[domain] || 0) + 1;
    } catch (e) {
      // Invalid URL, skip
    }
  });

  return Object.entries(counts)
    .map(([domain, visit_count]) => ({ domain, visit_count }))
    .sort((a, b) => b.visit_count - a.visit_count);
}

function runLocalNeighborVisits(data, anchor, radiusMinutes) {
  const anchorMatches = data.filter(v => v.url.includes(anchor));

  if (anchorMatches.length === 0) {
    return { error: "ANCHOR_NOT_FOUND" };
  }

  const anchorVisit = anchorMatches[0];
  const anchorTime = new Date(anchorVisit.visited_at);
  const start = new Date(anchorTime.getTime() - radiusMinutes * 60 * 1000);
  const end = new Date(anchorTime.getTime() + radiusMinutes * 60 * 1000);

  const neighbors = data.filter(v => {
    const visitTime = new Date(v.visited_at);
    return visitTime >= start && visitTime <= end &&
           !(v.url === anchorVisit.url && v.visited_at === anchorVisit.visited_at);
  });

  return {
    anchor_visit: anchorVisit,
    neighbors: neighbors
  };
}

// Get mode preference
function getMode() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['mode'], (result) => {
      resolve(result.mode || 'local');
    });
  });
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

// Update mode label
function updateModeLabel(mode) {
  const modeLabel = document.getElementById("modeLabel");
  modeLabel.textContent = mode === 'local' ? 'Local Mode' : 'MCP Mode';
}

// Initialize mode toggle
async function initializeModeToggle() {
  const modeToggle = document.getElementById("modeToggle");
  const currentMode = await getMode();
  modeToggle.checked = currentMode === 'local';
  updateModeLabel(currentMode);

  modeToggle.addEventListener('change', () => {
    const mode = modeToggle.checked ? 'local' : 'mcp';
    saveMode(mode);
    updateModeLabel(mode);
  });
}

// Initialize on page load
updateFieldsVisibility();
initializeModeToggle();

// Update when operation changes
document.getElementById("operation").addEventListener("change", updateFieldsVisibility);

document.getElementById("send").onclick = async () => {
  const op = document.getElementById("operation").value;

  // Prevent action if no operation is selected
  if (!op || op === "") {
    return;
  }

  const mode = await getMode();

  // Fetch history data first (needed for both modes)
  chrome.runtime.sendMessage(
    {
      type: "FETCH_HISTORY",
      startTime: Date.now() - 1000 * 60 * 60 * 24 * 7
    },
    async (response) => {
      if (mode === "local") {
        // Run local logic
        let result;

        if (op === "top_links") {
          const limit = Number(document.getElementById("limit").value) || 5;
          result = runLocalTopLinks(response.visits, limit);
        } else if (op === "top_domains_by_day") {
          const dateValue = document.getElementById("date").value;
          if (!dateValue) {
            alert("Date is required for this operation");
            return;
          }
          result = runLocalTopDomainsByDay(response.visits, dateValue);
        } else if (op === "neighbor_visits") {
          const anchorValue = document.getElementById("anchor").value;
          if (!anchorValue) {
            alert("Anchor URL is required for this operation");
            return;
          }
          const radiusMinutes = Number(document.getElementById("radius").value) || 30;
          result = runLocalNeighborVisits(response.visits, anchorValue, radiusMinutes);
        }

        document.getElementById("output").textContent =
          JSON.stringify(result, null, 2);
      } else {
        // Send to MCP
        const payload = {
          operation: op
        };

        if (op === "top_links") {
          payload.limit = Number(document.getElementById("limit").value) || 5;
        }

        if (op === "top_domains_by_day") {
          const dateValue = document.getElementById("date").value;
          if (!dateValue) {
            alert("Date is required for this operation");
            return;
          }
          payload.date = dateValue;
        }

        if (op === "neighbor_visits") {
          const anchorValue = document.getElementById("anchor").value;
          if (!anchorValue) {
            alert("Anchor URL is required for this operation");
            return;
          }
          payload.anchor = {
            url_contains: anchorValue
          };
          payload.radius_minutes = Number(document.getElementById("radius").value) || 30;
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
