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

// Initialize on page load
updateFieldsVisibility();

// Update when operation changes
document.getElementById("operation").addEventListener("change", updateFieldsVisibility);

document.getElementById("send").onclick = async () => {
  const op = document.getElementById("operation").value;

  // Prevent action if no operation is selected
  if (!op || op === "") {
    return;
  }

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

  chrome.runtime.sendMessage(
    {
      type: "FETCH_HISTORY",
      startTime: Date.now() - 1000 * 60 * 60 * 24 * 7
    },
    async (response) => {
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
  );
};
