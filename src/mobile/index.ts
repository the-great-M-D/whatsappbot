import fs from 'node:fs';
import path from 'node:path';
import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import chalk from 'chalk';
import { config } from './config.js';
import { DiscordBridge } from './discord.js';
import { moderate, enforceMute, isAdmin } from './moderation.js';
import { dev } from './dev.js';
import { configCommand } from './config-command.js';
import { appendError } from './state.js';

const sleep = (ms:number) => new Promise(r => setTimeout(r, ms));
const norm = (n:string) => n.replace(/[^0-9]/g, '');
const authBackupRoot = () => path.join(path.dirname(config.authDir), 'whatsapp-auth-backups');

function ensureMobileDirs() {
  for (const dir of [config.authDir, config.dataDir, 'scripts']) {
    try { fs.mkdirSync(dir, { recursive: true }); }
    catch (e) { console.error('[BOOT] Could not create directory ' + dir + ':', e); }
  }
}

let sock: any;
let pairing = false;
let waState = 'starting';
let reconnectAttempt = 0;
let lastDisconnectCode = '';
let lastDisconnectReason = '';
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let connectInProgress = false;

const discord = new DiscordBridge(async (jid, text) => {
  if (!sock) throw new Error('WhatsApp socket is not ready');
  await sock.sendMessage(jid, { text });
});

const errorAlertAt = new Map<string, number>();
const ERROR_ALERT_COOLDOWN = 5 * 60 * 1000;

async function reportError(label: string, error: unknown) {
  appendError(label, error);
  const raw = error instanceof Error ? error.message : String(error);
  const detail = raw.length > 1500 ? raw.slice(0, 1500) + '…' : raw;
  console.error('[ERROR] ' + label + ':', error);
  if (!sock || !config.owners.length) return;
  const now = Date.now();
  const last = errorAlertAt.get(label) || 0;
  if (now - last < ERROR_ALERT_COOLDOWN) return;
  errorAlertAt.set(label, now);
  const alert = '[BOT ERROR] ' + label + '\nTime: ' + new Date().toISOString() + '\nUptime: ' + Math.floor(process.uptime()) + 's\n' + detail;
  for (const owner of config.owners) {
    try { await sock.sendMessage(owner, { text: alert }); }
    catch (sendError) { console.error('[ERROR] Could not send owner alert:', sendError); }
  }
}

function archiveAuth() {
  if (!fs.existsSync(config.authDir)) return '';
  fs.mkdirSync(authBackupRoot(), { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const destination = path.join(authBackupRoot(), stamp);
  fs.renameSync(config.authDir, destination);
  fs.mkdirSync(config.authDir, { recursive: true });
  return destination;
}

function scheduleReconnect() {
  if (reconnectTimer || connectInProgress) return;
  const delay = Math.min(3000 * Math.max(reconnectAttempt, 1), 30000);
  console.log(chalk.yellow('[WA] Reconnecting in ' + Math.ceil(delay / 1000) + 's...'));
  reconnectTimer = setTimeout(() => {
    reconnectTimer = undefined;
    connect().catch(e => { void reportError('WA reconnect', e); });
  }, delay);
}

async function connect() {
  if (connectInProgress) return;
  connectInProgress = true;
  try {
    const { state, saveCreds } = await useMultiFileAuthState(config.authDir);
    const { version } = await fetchLatestBaileysVersion();
    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: ['Termux', 'Chrome', '1.0.0'],
      syncFullHistory: false
    });
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (u:any) => {
      try {
        const { connection, lastDisconnect } = u;
        if (u.qr) console.log(chalk.yellow('[AUTH] QR received but QR is disabled.'));

        if (connection === 'open') {
          pairing = false;
          reconnectAttempt = 0;
          lastDisconnectCode = '';
          lastDisconnectReason = '';
          waState = 'connected';
          console.log(chalk.green('[WA] Connected as ' + (sock.user?.id || 'unknown')));
          await discord.start();
        }

        if (connection === 'close') {
          const code = (lastDisconnect?.error as any)?.output?.statusCode;
          lastDisconnectCode = code != null ? String(code) : 'unknown';
          lastDisconnectReason = (lastDisconnect?.error as any)?.message || '';
          pairing = false;
          waState = 'disconnected';
          console.log(chalk.red('[WA] Disconnected code=' + lastDisconnectCode + (lastDisconnectReason ? ' reason=' + lastDisconnectReason : '')));

          if (code === DisconnectReason.loggedOut) {
            console.log(chalk.red('[AUTH] Logged out. Auth was not deleted.'));
            console.log(chalk.cyan('[AUTH] Run !dev repair from the owner account to archive auth and request a fresh pairing.'));
            return;
          }

          reconnectAttempt += 1;
          scheduleReconnect();
        }
      } catch (e) {
        void reportError('Connection handler', e);
      }
    });

    if (!state.creds.registered && config.phone && !pairing) {
      pairing = true;
      waState = 'pairing';
      await sleep(1500);
      try {
        const phone = norm(config.phone);
        if (!phone) throw new Error('WA_PHONE_NUMBER is empty or invalid');
        const code = await sock.requestPairingCode(phone);
        console.log(chalk.cyan('[AUTH] Pairing code: ' + code));
        console.log(chalk.gray('[AUTH] WhatsApp > Linked devices > Link with phone number.'));
      } catch (e) {
        pairing = false;
        waState = 'disconnected';
        void reportError('Pairing failed', e);
      }
    }
  } finally {
    connectInProgress = false;
  }
}

async function repairAuth(M:any) {
  if (!config.owners.includes(M.sender)) return void M.reply('Owner only.');
  if (pairing || waState === 'connected') return void M.reply('Repair is only available while disconnected.');
  try {
    const backup = archiveAuth();
    reconnectAttempt = 0;
    lastDisconnectCode = '';
    lastDisconnectReason = '';
    pairing = false;
    waState = 'pairing';
    await M.reply('Old auth archived. Starting fresh phone-number pairing...');
    await connect();
    if (backup) console.log(chalk.cyan('[AUTH] Archived old auth at ' + backup));
  } catch (e) {
    void reportError('Auth repair', e);
    await M.reply('Auth repair failed. Check the Termux console.');
  }
}

console.log(chalk.cyan('=== Mobile Termux WhatsApp Bot ==='));
ensureMobileDirs();
console.log('[BOOT] Auth: ' + config.authDir);
console.log('[BOOT] Data: ' + config.dataDir);
console.log('[BOOT] Discord target: ' + (config.discordTarget || 'not set'));
console.log('[DEV] Allowed shell commands: ' + (config.allowedCommands.length ? config.allowedCommands.join(', ') : 'none'));
console.log('[DEV] Allowed Python scripts: ' + (config.allowedScripts.length ? config.allowedScripts.join(', ') : 'none'));

async function handleMessages() {
  if (!sock) return;
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

        const muted = await enforceMute(sock, M);
        if (muted) continue;

        if (chat === config.discordTarget) {
          await discord.fromWA(sender, meta?.participants.find((p:any)=>p.id===sender)?.name || sender, text);
        }

        if (!text.startsWith(config.prefix)) continue;
        const [name,...args] = text.slice(config.prefix.length).trim().split(/\s+/);
        const cmd = (name || '').toLowerCase();

        if (cmd === 'hi') await M.reply('Hi there. Bot is online.');
        else if (['kick','warn','warnings','clearwarn','mute','unmute'].includes(cmd)) await moderate(sock, M, cmd, args.join(' '));
        else if (['add','promote','demote'].includes(cmd)) {
          if (!meta || !isAdmin(meta, sender) || !isAdmin(meta, sock.user?.id?.split(':')[0] + '@s.whatsapp.net')) {
            await M.reply('Admin only and bot must be admin.');
            continue;
          }
          const rawTarget = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || args[0] || '';
          const digits = String(rawTarget).replace(/[^0-9]/g,'');
          if (!digits) { await M.reply('Mention or provide a phone number.'); continue; }
          const jid = digits + '@s.whatsapp.net';
          await sock.groupParticipantsUpdate(chat, [jid], cmd === 'add' ? 'add' : cmd === 'promote' ? 'promote' : 'demote');
          await M.reply(cmd + ' done.');
        } else if (['dev','sh','py','status','logs','errors','clearerrors','restart','repair'].includes(cmd)) {
          if (!config.owners.includes(sender)) { await M.reply('Owner only.'); continue; }
          if (cmd === 'repair') { await repairAuth(M); continue; }
          await dev(M, cmd === 'dev' ? args : [cmd, ...args], {
            waState,
            discordState: discord.client?.isReady() ? 'connected' : (config.discordToken ? 'disconnected' : 'disabled'),
            pairing,
            discordTarget: config.discordTarget,
            reconnectAttempt,
            lastDisconnectCode,
            lastDisconnectReason
          });
        } else if (cmd === 'config') {
          if (!config.owners.includes(sender)) { await M.reply('Owner only.'); continue; }
          await configCommand(M, args);
        }
      } catch (e) { void reportError('Message handler', e); }
    }
  });
}

async function start() {
  ensureMobileDirs();
  await connect();
  handleMessages();
}

start().catch(e => { void reportError('Fatal startup', e); });
