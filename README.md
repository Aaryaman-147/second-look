# Second Look 👀 - A pause between impulse and intent.

<p align="center">
  <img src="screenshots/dashboard.png" width="45%" style="object-fit:contain;" />
</p>

Second Look is a lightweight Chrome extension that helps you browse more intentionally by tracking how often you open certain websites and preventing tab overload. 🚀

Instead of blocking sites outright, it gives you a second look — a gentle nudge that makes you pause and think before opening the same site again.
It helps you become more aware of your browsing habits by adding small, intentional pauses before reopening distracting sites.

## 🧠 Why this exists

We don’t always realise how often we reopen the same tabs — social media, docs, dashboards, videos.
### Second Look:

- Makes your browsing habits visible
- Reduces duplicate tabs
- Encourages mindful decision-making, not restriction

### Second Look is built on a simple idea:
> **Awareness beats restriction.**

## ✨ Features

- 🔢 Site open counter — tracks how many times you open a site, and that's where Second Look steps in and asks you to pause and decide - Continue browsing or Leave and go back

- 🚫 One-tab rule — prevents opening duplicate tabs of the same site

- 📊 Usage Dashboard — gives you a clear snapshot of your day: Tabs opened today, Peak simultaneous tabs, Most revisited site, and Hourly activity heatmap

- 🧠 Daily Reflection — After 9 PM, Second Look shows a short end-of-day reflection summarising your activity — once per day, no notifications.

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

Feature-frozen for now.

## 🛠 Tech Stack

- Vanilla JavaScript
- Chrome Extensions API (MV3)
- HTML / CSS

## 📄 License

## 📦 Versioning
**Current version:** `2.0.0`
