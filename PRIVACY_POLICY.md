# Privacy Policy for Sutra Extension

**Last Updated:** 02-Jan-2026

## Introduction

Sutra ("we," "our," or "the extension") is a browser extension that provides insights from your browsing patterns. This privacy policy explains how we collect, use, and protect your data.

## Data Collection

### Web History Data

Sutra accesses your browser history to provide insights about your browsing patterns. This includes:

- **URLs** of websites you have visited
- **Page titles** of visited pages
- **Visit timestamps** indicating when you visited each page

This data is accessed through the Chrome History API with your explicit permission.

### User Preferences

Sutra stores the following preferences locally on your device:

- User-defined domain categories
- System category overrides
- Mode preference (local or MCP mode)
- MCP server URL (if configured)

## How We Use Your Data

### Local Processing

When using Sutra in "local" mode, all data processing occurs entirely on your device. Your browsing history is:

- Read from your browser's history
- Processed locally in the extension
- Displayed as insights in the extension popup
- **Never transmitted to any external server**

### MCP Mode (Optional)

If you choose to use "MCP mode" and configure an MCP server URL, your browsing history data will be:

- Sent to the MCP server you specify
- Processed by that server to generate insights
- The results returned to the extension for display

**Important:** The MCP server URL is user-configured. If you use a localhost server, data remains on your device. If you use an external server, data will be transmitted to that server. We have no control over external MCP servers you configure.

## Data Storage

### Local Storage

All user preferences are stored locally on your device using Chrome's local storage API. This data:

- Remains on your device
- Is not synchronized across devices
- Can be cleared by uninstalling the extension or clearing browser data

### Browser History

Sutra does not store your browsing history. It only reads history data that is already stored by your browser. Your browser history remains under your control and can be managed through Chrome's history settings.

## Data Sharing

### No Third-Party Sharing

Sutra does not share your data with any third parties, except:

- **User-Configured MCP Servers:** If you configure an MCP server URL, data will be sent to that server. You are responsible for the privacy practices of any external MCP server you use.

### No Analytics or Tracking

Sutra does not:
- Collect analytics data
- Use tracking technologies
- Send data to advertising networks
- Share data with data brokers

## Your Rights and Controls

### Access and Control

You have full control over your data:

- **Disable the extension:** You can disable or uninstall the extension at any time
- **Clear local storage:** You can clear stored preferences through Chrome's extension settings
- **Manage browser history:** You can view, delete, or modify your browser history through Chrome's history page
- **Choose processing mode:** You can choose between local processing (no data transmission) or MCP mode (user-configured server)

### Permissions

Sutra requires the following permissions:

- **History permission:** Required to read your browsing history and provide insights
- **Storage permission:** Required to save your preferences (categories, mode, MCP server URL) locally

You can revoke these permissions at any time through Chrome's extension settings, though this may limit the extension's functionality.

## Security

We take data security seriously:

- All local data is stored using Chrome's secure storage APIs
- No data is transmitted unless you explicitly configure an MCP server
- The extension only accesses data necessary for its functionality

## Children's Privacy

Sutra is not intended for children under the age of 13. We do not knowingly collect data from children.

## Changes to This Privacy Policy

We may update this privacy policy from time to time. We will notify you of any material changes by updating the "Last Updated" date at the top of this policy.

## Contact

If you have questions about this privacy policy or how we handle your data, please contact us at [your contact information].

## Compliance

This privacy policy is designed to comply with:
- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR) principles
- California Consumer Privacy Act (CCPA) principles

---

**Note:** This extension is provided "as is" and processes your data locally by default. When using MCP mode with external servers, you are responsible for ensuring those servers comply with applicable privacy laws and regulations.

