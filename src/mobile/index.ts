import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import chalk from 'chalk';
import { config } from './config.js';
import { DiscordBridge } from './discord.js';
import { moderate, enforceMute, isAdmin } from './moderation.js';
import { dev } from './dev.js';
import { configCommand } from './config-command.js';

const sleep = (ms:number) => new Promise(r => setTimeout(r, ms));
const norm = (n:string) => n.replace(/[^0-9]/g, '');
let sock: any;
let pairing = false;
const discord = new DiscordBridge(async (jid, text) => sock.sendMessage(jid, { text }));

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
      console.log(chalk.green('[WA] Connected as ' + (sock.user?.id || 'unknown')));
      await discord.start();
    }
    if (connection === 'close') {
      const code = (lastDisconnect?.error as any)?.output?.statusCode;
      console.log(chalk.red('[WA] Disconnected code=' + code));
      if (code === DisconnectReason.loggedOut) {
        console.log(chalk.red('[AUTH] Logged out. Remove the auth directory before re-pairing.'));
        return;
      }
      await sleep(3000);
      connect().catch(e => console.error('[WA] reconnect error', e));
    }
  });
  if (!state.creds.registered && config.phone && !pairing) {
    pairing = true;
    await sleep(1500);
    try {
      const code = await sock.requestPairingCode(norm(config.phone));
      console.log(chalk.cyan('[AUTH] Pairing code: ' + code));
      console.log(chalk.gray('[AUTH] WhatsApp > Linked devices > Link with phone number.'));
    } catch (e) { console.error('[AUTH] Pairing failed:', e); pairing = false; }
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
          await dev(M, cmd === 'dev' ? args : [cmd, ...args]);
        } else if (cmd === 'config') {
          if (!config.owners.includes(sender)) { await M.reply('Owner only.'); continue; }
          await configCommand(M, args);
        }
      } catch (e) { console.error('[MESSAGE] handler error:', e); }
    }
  });
}
console.log(chalk.cyan('=== Mobile Termux WhatsApp Bot ==='));
console.log('[BOOT] Auth: ' + config.authDir);
console.log('[BOOT] Data: ' + config.dataDir);
console.log('[BOOT] Discord target: ' + (config.discordTarget || 'not set'));
connect().catch(e => console.error('[FATAL]', e));
