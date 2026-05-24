# Code Layout - whatsappbot

This document describes the repository layout and important files with short one-line descriptions. It targets the branch `update/baileys` and is intended as a developer reference while upgrading Baileys and maintaining the project.

## Repository root

- package.json — project metadata, scripts and dependencies (currently uses @adiwajshing/baileys; branch `update/baileys` will update to @whiskeysockets/baileys).
- README.md — project overview and deployment hints.
- CODE_LAYOUT.md — this file.

## src/
Top-level TypeScript source files.

- kaoi.ts (entry) — builds/starts the bot (compiled to dist/kaoi.js).

### src/lib/
Core library classes and utilities.
- WAClient.ts — WhatsApp client wrapper; creates and manages the Baileys socket connection, handles events (connection.update, messages.upsert, group updates). This file already imports from @whiskeysockets/baileys and is the primary place to keep Baileys connection logic.
- Server.ts — Express server exposing a small web UI and /wa endpoints (QR endpoint). Performs session-auth checks. (See: src/lib/Server.ts)
- BaseCommand.ts — base class for command modules (common command behavior, metadata).
- request.ts — small HTTP helper used by some commands to fetch buffers.
- other helpers — utilities referenced across command handlers.

### src/Handlers/
- MessageHandler.ts — central dispatcher that parses incoming messages and invokes command modules.
- (other handlers) — event or job handlers for background tasks.

### src/commands/
Commands are organized by category subfolders (Media, Fun, General, Dev, Moderation, Files, Games, Bots, Educative, etc.). Each file exports a command class extending BaseCommand.
Examples:
- src/commands/Media/Sticker.ts — image/video to sticker conversion and sending.
- src/commands/Media/Play.ts — plays audio from YouTube searches.
- src/commands/Fun/jail.ts — uses avatar images to generate "jail" meme images.
- src/commands/Dev/Status.ts — posts status updates to WhatsApp (status@broadcast).

Notes: Many command files currently import types or enums from the old Baileys package (@adiwajshing/baileys) and use MessageType/Mimetype constants and older sendMessage signatures. These will be updated to the new @whiskeysockets/baileys message shapes and types during the Baileys upgrade.

### src/typings/
- index.d.ts — project-wide TypeScript interfaces (IConfig, ISession, IExtendedGroupMetadata, etc.). Currently imports WAGroupMetadata from @adiwajshing/baileys — update this to import from the new Baileys package.
- message.ts, command.ts, mongo.ts — supporting type definitions for messages, command metadata and DB models.

### src/assets/
- Pre-bundled buffers and JSON assets (quotes, trigger overlays, GIF metadata, etc.) — loaded by commands via this.client.assets.get(...).

### public/
- Static files served by the Express server (used by Server.ts).

## Important files to inspect/modify for Baileys upgrade

- package.json — bump dependency from @adiwajshing/baileys to @whiskeysockets/baileys (or specific version). Also ensure peer deps (pino, protobufjs) versions align with the new baileys release.
- src/lib/WAClient.ts — already uses @whiskeysockets/baileys; use it as canonical reference for new API usage.
- src/typings/index.d.ts — change imports of WAGroupMetadata and other types to the new package.
- All files importing from '@adiwajshing/baileys' — replace imports with '@whiskeysockets/baileys' or adjust to new type locations; remove/replace MessageType and Mimetype usage and refactor sendMessage calls to the new message object shapes, for example:
  - Old: client.sendMessage(jid, buffer, MessageType.image, { caption })
  - New: client.sendMessage(jid, { image: buffer, caption })
- Any use of proto, WAMessage, and viewOnceMessage — update type imports if namespaced differently in new package. Use WAProto types via @whiskeysockets/baileys if required.
- downloadMediaMessage and getProfilePicture helpers — confirm signatures on WAClient wrapper and update call sites accordingly.

## Suggested upgrade checklist

1. Update package.json dependency to @whiskeysockets/baileys (use a specific version or `latest`).
2. Update lockfile (yarn.lock or package-lock.json) by running install locally or by CI.
3. Replace all imports from '@adiwajshing/baileys' with '@whiskeysockets/baileys' (or import only the required types from the new package).
4. Refactor sendMessage usage across commands to use the new message content objects. Examples:
   - Images: sendMessage(jid, { image: buffer, caption })
   - Video: sendMessage(jid, { video: buffer, caption })
   - Document: sendMessage(jid, { document: buffer, mimetype: 'application/pdf', fileName })
   - Audio: sendMessage(jid, { audio: buffer })
   - Text-only: sendMessage(jid, { text: 'hello' })
5. Replace MessageType/Mimetype enum usages or create a small compatibility shim in a helper file to translate old enums to new message objects where appropriate.
6. Update typings in src/typings to reference new package types (WAGroupMetadata, proto types, WAMessage). Run TypeScript compiler to find errors.
7. Run full test (build) and fix any type/runtime issues.

## References
- Server.ts: https://github.com/the-great-M-D/whatsappbot/blob/main/src/lib/Server.ts
- WAClient.ts: src/lib/WAClient.ts (already uses @whiskeysockets/baileys — use as example for socket creation and event handling).
- Code search for old Baileys imports (may be incomplete): https://github.com/the-great-M-D/whatsappbot/search?q=%40adiwajshing%2Fbaileys&type=code

---
If you want, I can:
- Commit this file to branch `update/baileys` now (I will push it and open the PR), or
- First run an automatic replacement across files and include the compatibility shim before committing.

Confirm if you want me to commit CODE_LAYOUT.md to branch `update/baileys` now. If yes, I'll push and return the PR link once I open the PR with further Baileys upgrade changes.