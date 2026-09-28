# WhatsApp Bot — Termux Mobile

A lightweight WhatsApp bot built for **Android + Termux** using TypeScript, Node.js, and Baileys.

This mobile branch is designed to run directly on a phone. It does **not** require a PC, MongoDB, SQLite, Express, a dashboard, or native-heavy media packages.

## What is included

- WhatsApp phone-number pairing
- Persistent Baileys authentication
- Automatic reconnect
- `!hi`
- Owner-only developer commands
- Allowlisted shell commands
- Allowlisted Python scripts with arguments
- Persistent error log with 48-hour retention
- Owner WhatsApp error alerts with throttling
- Group moderation:
  - `!kick`
  - `!add`
  - `!promote`
  - `!demote`
  - `!warn`
  - `!warnings`
  - `!clearwarn`
  - `!mute`
  - `!unmute`
- Two-way Discord text bridge
- Persistent Discord/WhatsApp bridge history with 48-hour retention

## Requirements

- Android phone
- Termux
- Node.js
- Git
- WhatsApp account
- Optional Discord bot/token

## Install Termux

Install Termux from the official F-Droid/GitHub distribution rather than an outdated Play Store build.

Then run:

```bash
pkg update -y
pkg install -y nodejs git
termux-setup-storage
```

Allow Termux storage access when Android asks.

## Get the bot

```bash
git clone --branch mobile-termux https://github.com/the-great-M-D/whatsappbot.git whatsappbot-termux
cd whatsappbot-termux
```

## One-command installer

Run:

```bash
./install-termux.sh
```

The installer:

1. Checks that it is running inside Termux.
2. Checks Node.js and Git.
3. Installs the minimal npm dependencies.
4. Creates the runtime directories.
5. Creates `.env` from `.env.example` if it does not exist.
6. Builds the TypeScript code.
7. Prints the remaining configuration steps.

Do not put real passwords, Discord tokens, or WhatsApp credentials into Git.

## Configure .env

Edit:

```bash
nano .env
```

Minimum WhatsApp configuration:

```env
WA_PHONE_NUMBER=
OWNER_NUMBERS=
PREFIX=!

WA_AUTH_DIR=/storage/1FC3-111D/whatsapp-auth
BOT_DATA_DIR=/storage/1FC3-111D/discord
```

Use international phone numbers without the leading `+`.

Example format:

```env
WA_PHONE_NUMBER=COUNTRYCODEPHONENUMBER
OWNER_NUMBERS=COUNTRYCODEPHONENUMBER
```

The actual number is intentionally not included in this repository.

## Start

```bash
./start.sh
```

Or:

```bash
npm run mobile
```

The terminal shows connection, pairing, reconnect, Discord, and error information.

## WhatsApp pairing

QR pairing is disabled in this mobile build.

On first startup, the terminal prints a pairing code:

```
[AUTH] Pairing code: XXXXXXXX
```

On your WhatsApp phone:

**WhatsApp → Linked devices → Link a device → Link with phone number**

Enter the displayed code.

Authentication is stored separately from the project:

```
/storage/1FC3-111D/whatsapp-auth
```

Do not delete this directory unless you intentionally want to re-authenticate.

## Data layout

```
/storage/1FC3-111D/
├── whatsapp-auth/
└── discord/
    ├── bridge-history.jsonl
    ├── moderation.json
    └── errors.jsonl
```

Python scripts are stored inside the project:

```
scripts/
└── README.txt
```

## Commands

### General

```
!hi
```

### Developer

Developer commands are owner-only.

```
!dev status
!dev logs
!dev errors
!dev clearerrors
!dev sh
!dev py
!dev restart
```

Status reports:

- bot uptime
- Node version
- process ID
- WhatsApp state
- Discord state
- pairing state
- Discord target
- reconnect attempts
- last WhatsApp disconnect code/reason

System/debug logs remain in the Termux console. `!dev logs` is for the persistent Discord bridge history.

### Allowlisted shell commands

Only commands listed in:

```env
DEV_ALLOWED_COMMANDS=
```

can be executed.

The command receives **no arguments**.

Example:

```env
DEV_ALLOWED_COMMANDS=python
```

### Python scripts

Python scripts must be placed in `scripts/` and explicitly allowlisted:

```env
DEV_ALLOWED_SCRIPTS=backup.py,test.py
```

Run:

```
!py backup.py
!py backup.py argument1 argument2
```

Python is executed using the Termux `python` command.

Execution is limited by:

```env
DEV_TIMEOUT_MS=15000
DEV_MAX_OUTPUT=12000
```

Read `scripts/README.txt` for the full workflow.

## Group moderation

Moderation commands require the sender to be a group admin and the bot to be a group admin.

Target a member by replying to their message or mentioning them.

```
!kick
!warn
!warnings
!clearwarn
!mute
!unmute
```

Three warnings automatically trigger a kick and reset that user's warnings.

The bot does not moderate group admins.

```
!add <phone>
!promote <phone>
!demote <phone>
```

## Discord bridge

The bridge is optional.

Configure:

```env
DISCORD_TOKEN=
DISCORD_CHANNEL_ID=
DISCORD_WA_TARGET=
DISCORD_ALLOWED_USER_IDS=
```

WhatsApp → Discord:

```
[WhatsApp] Name: message
```

Discord → WhatsApp:

```
!wa message
```

Only Discord user IDs listed in `DISCORD_ALLOWED_USER_IDS` may send WhatsApp messages.

Bridge history is stored locally for 48 hours.

## Error handling

Runtime errors are stored in:

```
/storage/1FC3-111D/discord/errors.jsonl
```

Only the most recent 50 errors are retained, and errors older than 48 hours are removed.

Owner alerts are throttled to prevent repeated failures from flooding WhatsApp.

Use:

```
!dev errors
!dev clearerrors
```

## Updating

From the project directory:

```bash
git pull --ff-only
./start.sh
```

The project intentionally does not commit:

- `.env`
- WhatsApp authentication
- runtime data
- `node_modules`
- build output

## Troubleshooting

### No pairing code

Check:

```bash
grep -E 'WA_PHONE_NUMBER|OWNER_NUMBERS' .env
```

Then restart:

```bash
./start.sh
```

### Authentication is broken

Stop the bot first.

Back up the authentication directory if you need it for investigation, then remove it to force a fresh pairing:

```rm -rf /storage/1FC3-111D/whatsapp-auth```

Start again:

```bash
./start.sh
```

### Check the bot state

From WhatsApp:

```
!dev status
```

### Check recent errors

```
!dev errors
```

### Clear old errors

```
!dev clearerrors
```

## Security

Treat these as secrets:

- `.env`
- Discord bot token
- WhatsApp authentication files

Do not commit them or paste them into public GitHub issues.

Developer shell/Python execution is deliberately allowlisted and owner-only. Keep the allowlists as small as possible.

## License

See [LICENSE](./LICENSE).
