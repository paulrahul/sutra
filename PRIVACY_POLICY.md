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
- LLM provider preference (local or cloud)
- Local LLM endpoint URL (if using local mode)
- Cloud LLM provider (OpenAI or Anthropic, if using cloud mode)
- API keys for cloud LLM providers (stored locally, encrypted by Chrome)
- Model name preference
- Dark mode preference
- Last search result state (for restoring previous queries)

## How We Use Your Data

### Local LLM Mode

When using Sutra in "local LLM" mode, all data processing occurs entirely on your device. Your browsing history is:

- Read from your browser's history
- Processed locally in the extension
- Sent to your local LLM server (typically running on localhost, e.g., Ollama)
- Displayed as insights in the extension popup
- **Never transmitted to any external server**

**Note:** If you configure a localhost server (e.g., `http://localhost:11434`), your data remains on your device. If you configure an external server URL, data will be transmitted to that server.

### Cloud LLM Mode (Optional)

If you choose to use "cloud LLM" mode and configure a cloud provider (OpenAI or Anthropic), the following applies:

- **Only your search queries are sent** to the cloud LLM API (OpenAI or Anthropic)
- **Your browsing history data is NOT sent** to cloud providers
- The cloud LLM generates an execution plan based on your query
- The execution plan is processed locally against your browsing history
- Results are displayed in the extension popup

**Important:**
- When using cloud mode, your search queries are sent to either OpenAI (`api.openai.com`) or Anthropic (`api.anthropic.com`) depending on your configuration
- Your full browsing history remains on your device and is never transmitted
- You are responsible for the privacy practices of the cloud LLM provider you choose
- API keys are stored locally on your device and are only used to authenticate with the cloud provider

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

- **Cloud LLM Providers (Optional):** If you choose to use cloud LLM mode, your search queries (but not your browsing history) will be sent to either OpenAI or Anthropic, depending on your configuration. You are responsible for reviewing and accepting the privacy policies of these providers.
- **User-Configured Local LLM Servers:** If you configure a local LLM server URL, data will be sent to that server. If you use a localhost server, data remains on your device. If you use an external server, you are responsible for the privacy practices of that server.

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
- **Choose processing mode:** You can choose between local LLM mode (data stays on your device or localhost) or cloud LLM mode (queries sent to OpenAI/Anthropic, but browsing history stays local)

### Permissions

Sutra requires the following permissions:

- **History permission:** Required to read your browsing history and provide insights
- **Storage permission:** Required to save your preferences (categories, LLM configuration, API keys, UI preferences) locally

You can revoke these permissions at any time through Chrome's extension settings, though this may limit the extension's functionality.

## Security

We take data security seriously:

- All local data is stored using Chrome's secure storage APIs
- API keys are stored locally and encrypted by Chrome's storage system
- No browsing history data is transmitted unless you explicitly configure a cloud LLM provider (and even then, only queries are sent, not history)
- When using local LLM mode with localhost, all data remains on your device
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

**Note:** This extension is provided "as is" and processes your data locally by default. When using cloud LLM mode, your search queries are sent to third-party providers (OpenAI or Anthropic), and you are responsible for reviewing their privacy policies. When using local LLM mode with external servers, you are responsible for ensuring those servers comply with applicable privacy laws and regulations.




