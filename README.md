# Sutra

<div align="center">
  <img src="extension/img/sutra_icon_128.png" alt="Sutra Logo" width="128" height="128">
  <h3>The smarter browser history</h3>
  <p>Discover insights and patterns from your browsing behavior</p>
</div>

---

## Overview

**Sutra** is a Chrome extension that transforms your browsing history into actionable insights. Whether you want to understand your browsing patterns, track productivity, or discover emerging interests, Sutra provides powerful analytics while keeping your data private and local.

## Features

### 🔍 **Navigation & History**
- **Neighbor visits** - See pages visited near the same time as a given page
- **Before/after navigation** - Track pages visited before or after a specific page
- **Sessions** - Group browsing activity into sessions based on time gaps

### 📊 **Statistics**
- **Top visited links** - Most frequently visited URLs
- **Top domains** - Most frequently visited domains
- **Domain time distribution** - Time-of-day distribution per domain
- **Browser usage timeline** - Timeline view of browsing activity

### 📈 **Trends & Patterns**
- **Most common navigation paths** - Identify commonly repeated navigation paths
- **Repeated patterns** - Detect recurring browsing sequences or behaviors
- **Daily browsing summary** - Summarize browsing activity for a given day
- **Emerging interests** - Detect new or increasing areas of interest
- **Category interests** - Infer category interests based on browsing behavior
- **Productivity vs distraction** - Classify browsing as productive or distracting

### 🏷️ **Smart Categorization**
- Pre-configured system categories (Productivity, Social Media, Learning, etc.)
- Custom user-defined categories
- Automatic domain categorization
- Category-based insights and analytics

## Installation

### From Chrome Web Store
*Coming soon - extension will be available on the Chrome Web Store*

### Manual Installation (Developer Mode)

1. **Download or clone this repository**
   ```bash
   git clone https://github.com/yourusername/smarthistory.git
   cd smarthistory
   ```

2. **Open Chrome Extensions page**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)

3. **Load the extension**
   - Click "Load unpacked"
   - Select the `extension` folder from this repository

4. **Grant permissions**
   - The extension will request History and Storage permissions
   - These are required for the extension to function

## Usage

### Local Mode (Default)

By default, Sutra processes all data locally on your device. No data is transmitted to any external server.

1. Click the Sutra icon in your Chrome toolbar
2. Select an operation from the categories
3. Configure any required parameters (date ranges, limits, etc.)
4. Click to run the analysis
5. View your insights in the results panel

### MCP Mode (Optional)

For advanced users, Sutra supports connecting to a Model Context Protocol (MCP) server for server-side processing.

1. Switch to "MCP" mode in the extension
2. Configure your MCP server URL (e.g., `http://localhost:8082`)
3. Operations will be processed on your MCP server
4. Results are returned to the extension for display

**Note:** When using MCP mode with external servers, your browsing history data will be sent to that server. Ensure you trust the server you configure.

## Privacy

Sutra is designed with privacy in mind:

- ✅ **Local processing by default** - All data stays on your device
- ✅ **No analytics or tracking** - We don't collect any usage data
- ✅ **No third-party sharing** - Your data is never shared with third parties
- ✅ **User control** - You can disable or uninstall at any time
- ✅ **Transparent permissions** - Only requests necessary permissions

**Required Permissions:**
- **History** - To read your browsing history and provide insights
- **Storage** - To save your preferences (categories, mode, MCP server URL) locally

For detailed information, see our [Privacy Policy](PRIVACY_POLICY.md).

## MCP Server (Optional)

Sutra includes an optional MCP server for server-side processing. The MCP server supports a subset of operations and can be run locally or on a remote server.

### Running the MCP Server

```bash
cd mcp
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The server will start on `http://localhost:8082` by default.

### Supported MCP Operations

- `top_links` - Get most frequently visited links
- `top_domains_by_day` - Get top domains for a specific day
- `neighbor_visits` - Find visits near a given anchor URL
