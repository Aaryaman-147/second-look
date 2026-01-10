# Second Look 👀 - A mindful browsing Chrome extension

![Second Look Dashboard](screenshots/dashboard.png)

Second Look is a lightweight Chrome extension that helps you browse more intentionally by tracking how often you open certain websites and preventing tab overload. 🚀

Instead of blocking sites outright, it gives you a second look — a gentle nudge that makes you pause and think before opening the same site again.

## 🧠 Why this exists

We don’t always realise how often we reopen the same tabs — social media, docs, dashboards, videos.
### Second Look:

- Makes your browsing habits visible
- Reduces duplicate tabs
- Encourages mindful decision-making, not restriction

## ✨ Features

- 🔢 Site open counter — tracks how many times you open a site
- 🚫 One-tab rule — prevents opening duplicate tabs of the same site
- 🪶 Lightweight & fast — no tracking servers, all local
- 🔒 Privacy-friendly — data stays in your browser

## 📸 Screenshots

### Site Visit Prompt
A gentle nudge when a site has been opened multiple times.

![Site visit prompt](screenshots/visit-prompt.png)

### One-Tab Rule Mode
Prevents opening duplicate tabs for the same site.

![One-tab rule mode](screenshots/one-tab-rule.png)
## 🛠️ How it works

- Uses Chrome’s tabs and storage APIs
- Tracks site opens per domain
- Injects logic via content.js
- Stores all data locally using chrome.storage

No accounts. No cloud. No analytics.

## 🧪 Current Status

This project is under active development.

## 📄 License
