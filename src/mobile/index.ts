import fs from 'node:fs';
import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import chalk from 'chalk';
import { config } from './config.js';
import { DiscordBridge } from './discord.js';
import { moderate, enforceMute, isAdmin } from './moderation.js';
import { dev } from './dev.js';
import { configCommand } from './config-command.js';
import { appendError } from './state.js';

const sleep = (ms:number) => new Promise(r => setTimeout(r, ms));

function ensureMobileDirs() {
  const dirs = [config.authDir, config.dataDir, 'scripts'];
  for (const dir of dirs) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      console.error('[BOOT] Could not create directory ' + dir + ':', e);
    }
  }
}
const norm = (n:string) => n.replace(/[^0-9]/g, '');
let sock: any;
let pairing = false;
let waState = 'starting';
const discord = new DiscordBridge(async (jid, text) => sock.sendMessage(jid, { text }));

const errorAlertAt = new Map<string, number>();
const ERROR_ALERT_COOLDOWN = 5 * 60 * 1000;

async function reportError(label: string, error: unknown) {
  appendError(error);
  const raw = error instanceof Error ? error.message : String(error);
  const detail = raw.length > 1500 ? raw.slice(0, 1500) + '…' : raw;
  console.error('[ERROR] ' + label + ':', error);
  if (!sock || !config.owners.length) return;
  const alert = '[BOT ERROR] ' + label + '\\n' + detail;
  for (const owner of config.owners) {
    try { await sock.sendMessage(owner, { text: alert }); }
    catch (sendError) { console.error('[ERROR] Could not send owner alert:', sendError); }
  }
}

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState(config.authDir);
  const { version } = await fetchLatestBaileysVersion();
  sock = makeWASocket({ version, auth: state, printQRInTerminal: false, browser: ['Termux', 'Chrome', '1.0.0'], syncFullHistory: false });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (u:any) => {
    const { connection, lastDisconnect } = u;
    if (u.qr) console.log(chalk.yellow('[AUTH] QR received but QR is disabled.'));
    if (connection === 'open') {
      pairing = false;
      waState = 'connected';
      console.log(chalk.green('[WA] Connected as ' + (sock.user?.id || 'unknown')));
      await discord.start();
    }
    if (connection === 'close') {
      const code = (lastDisconnect?.error as any)?.output?.statusCode;
      waState = 'disconnected';
      console.log(chalk.red('[WA] Disconnected code=' + code));
      if (code === DisconnectReason.loggedOut) {
        console.log(chalk.red('[AUTH] Logged out. Remove the auth directory before re-pairing.'));
        return;
      }
      await sleep(3000);
      connect().catch(e => { void reportError('WA reconnect', e); });
    }
  });
  if (!state.creds.registered && config.phone && !pairing) {
    pairing = true;
    waState = 'pairing';
    await sleep(1500);
    try {
      const code = await sock.requestPairingCode(norm(config.phone));
      console.log(chalk.cyan('[AUTH] Pairing code: ' + code));
      console.log(chalk.gray('[AUTH] WhatsApp > Linked devices > Link with phone number.'));
    } catch (e) { void reportError('Pairing failed', e); pairing = false; waState = 'disconnected'; }
  }
  sock.ev.on('messages.upsert', async ({ messages, type }:any) => {
    if (type !== 'notify') return;
    for (const m of messages) {
      try {
        if (!m.message || m.key.fromMe) continue;
        const chat = m.key.remoteJid || '';
        const sender = m.key.participant || chat;
        const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
        if (!text) continue;
        const meta = chat.endsWith('@g.us') ? await sock.groupMetadata(chat).catch(()=>null) : null;
        const M:any = { message:m.message, key:m.key, chat, sender, isGroup:!!meta, reply:(x:string)=>sock.sendMessage(chat,{text:x}) };
        await enforceMute(sock, M);
        if (chat === config.discordTarget) await discord.fromWA(sender, meta?.participants.find((p:any)=>p.id===sender)?.name || sender, text);
        if (!text.startsWith(config.prefix)) continue;
        const [name,...args] = text.slice(config.prefix.length).trim().split(/\s+/);
        const cmd = (name || '').toLowerCase();
        if (cmd === 'hi') await M.reply('Hi there. Bot is online.');
        else if (['kick','warn','warnings','clearwarn','mute','unmute'].includes(cmd)) await moderate(sock, M, cmd, args.join(' '));
        else if (['add','promote','demote'].includes(cmd)) {
          if (!meta || !isAdmin(meta, sender) || !isAdmin(meta, sock.user?.id?.split(':')[0] + '@s.whatsapp.net')) { await M.reply('Admin only and bot must be admin.'); continue; }
          const t = (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || args[0] || '').replace(/[^0-9]/g,'');
          if (!t) { await M.reply('Mention or provide a phone number.'); continue; }
          const jid = t.includes('@') ? t : t+'@s.whatsapp.net';
          await sock.groupParticipantsUpdate(chat, [jid], cmd === 'add' ? 'add' : cmd === 'promote' ? 'promote' : 'demote');
          await M.reply(cmd + ' done.');
        } else if (['dev','sh','py','status','logs'].includes(cmd)) {
          if (!config.owners.includes(sender)) { await M.reply('Owner only.'); continue; }
          await dev(M, cmd === 'dev' ? args : [cmd, ...args], {
            waState,
            discordState: discord.client?.isReady() ? 'connected' : (config.discordToken ? 'disconnected' : 'disabled'),
            pairing,
            discordTarget: config.discordTarget
          });
        } else if (cmd === 'config') {
          if (!config.owners.includes(sender)) { await M.reply('Owner only.'); continue; }
          await configCommand(M, args);
        }
      } catch (e) { void reportError('Message handler', e); }
    }
  });
}
console.log(chalk.cyan('=== Mobile Termux WhatsApp Bot ==='));
ensureMobileDirs();
console.log('[BOOT] Auth: ' + config.authDir);
console.log('[BOOT] Data: ' + config.dataDir);
console.log('[BOOT] Discord target: ' + (config.discordTarget || 'not set'));
console.log('[DEV] Allowed shell commands: ' + (config.allowedCommands.length ? config.allowedCommands.join(', ') : 'none'));
console.log('[DEV] Allowed Python scripts: ' + (config.allowedScripts.length ? config.allowedScripts.join(', ') : 'none'));
connect().catch(e => { void reportError('Fatal startup', e); });
