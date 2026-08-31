<div align="center">

<img src="https://i.ibb.co/1GP0NSnN/a96c6f2b-c325-4256-92bf-6fd1576b4f0f.png" alt="M-D Bot" width="200">

# M-D WhatsApp Bot

[![CodeFactor](https://www.codefactor.io/repository/github/the-great-m-d/whatsappbot/badge/main)](https://www.codefactor.io/repository/github/the-great-m-d/whatsappbot/overview/main)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: GPL](https://img.shields.io/badge/License-GPL-blue?style=for-the-badge)](./LICENSE)

> A fully modular, object-oriented WhatsApp bot built with TypeScript and Baileys.

</div>

---

## 🚀 Quick Deploy

### Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/the-great-M-D/whatsappbot&envs=PREFIX,SESSION,MODS,CRON,MONGODB_URL,GOOGLE_API_KEY,CHAT_BOT_URL&optionalEnvs=MODS,CRON,GOOGLE_API_KEY,CHAT_BOT_URL)

### Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/the-great-M-D/whatsappbot)

### Fly.io

```bash
fly launch
fly deploy
```

### Docker

```bash
docker build -t m-d-bot .
docker run -p 4040:4040 --env-file .env m-d-bot
```

---

## ✨ Highlights

- **Fully Modular** — each command is a self-contained class
- **Object-Oriented** — clean inheritance and typed interfaces
- **TypeScript** — end-to-end type safety
- **Self-Restoring Auth** — WhatsApp session backed up to MongoDB, auto-restores on restart
- **Built with [Baileys](https://github.com/WhiskeySockets/Baileys)** — the best WhatsApp library out there

---

## 📋 Prerequisites

- Node.js 18+ (native `fetch` support required)
- MongoDB database (for auth persistence, users, groups, and feature flags)
- `yt-dlp` installed on the system (for media download commands)

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SESSION` | ✅ | Unique session identifier string |
| `MONGODB_URL` | ✅ | MongoDB connection string |
| `PREFIX` | ❌ | Command prefix (default: `!`) |
| `NAME` | ❌ | Bot display name (default: `M_D BOT`) |
| `MODS` | ❌ | Comma-separated admin phone numbers (international format, no `+`) |
| `CRON` | ❌ | Cron string for clearing chats on a schedule |
| `GOOGLE_API_KEY` | ❌ | Google Custom Search API key for `!google` command |
| `CHAT_BOT_URL` | ❌ | BrainShop API URL for chatbot feature |
| `OPENWEATHER_API_KEY` | ❌ | OpenWeather API key for `!weather` command |

---

## 🛠️ Local Development

```bash
# Clone the repo
git clone https://github.com/the-great-M-D/whatsappbot.git
cd whatsappbot

# Install dependencies
npm install --legacy-peer-deps

# Build
npm run build

# Start the bot
npm start
```

---

## 🎯 Features

- Group moderation (anti-invite, anti-link)
- Multi-command categories: educative, fun, media, files, dev
- Crypto price tracking
- Weather, jokes, facts, advice
- YouTube media download (audio & video)
- Instagram stalking
- Google search
- Chatbot integration
- XP & leveling system
- Database-backed feature toggles
- QR code or phone pairing authentication

📄 **Full feature list:** [Features.md](./Features.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

Make sure to follow ESLint rules and run `npm run prettier-format` before opening PRs.

---

## 📜 License

Distributed under the **GNU General Public License**. See [LICENSE](./LICENSE) for details.

---

<div align="center">

### 💬 Support

[![WhatsApp Group](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://chat.whatsapp.com/GJ4Rxuj1iFD3uUdAxjsgyN)

**Maintained by [@the-great-M-D](https://github.com/the-great-M-D)**

</div>
