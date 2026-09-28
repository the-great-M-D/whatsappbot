import type { WASocket, WAMessage, GroupMetadata } from '@whiskeysockets/baileys';
import { loadState, saveState, type ModState } from './state.js';

export function jidOf(v: string) {
  const n = v.replace(/[^0-9]/g, '');
  return n ? n + '@s.whatsapp.net' : '';
}
export function target(M: any): string {
  const mentioned = M.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  const quoted = M.message?.extendedTextMessage?.contextInfo?.participant;
  return mentioned || quoted || '';
}
export function isAdmin(meta: GroupMetadata, jid: string) {
  return meta.participants.some((p: any) => p.id === jid && (p.admin === 'admin' || p.admin === 'superadmin'));
}
export async function moderate(sock: WASocket, M: any, cmd: string, arg: string) {
  if (!M.isGroup) return void M.reply('Group only.');
  const meta = await sock.groupMetadata(M.chat);
  if (!isAdmin(meta, M.sender)) return void M.reply('Admin only.');
  const bot = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
  if (!isAdmin(meta, bot)) return void M.reply('Bot must be a group admin.');
  let t = target(M) || jidOf(arg);
  if (!t) return void M.reply('Reply to a user or @mention them.');
  if (isAdmin(meta, t)) return void M.reply('I will not moderate a group admin.');
  const s: ModState = loadState();
  const list = s.muted[M.chat] || [];
  if (cmd === 'mute') { if (!list.includes(t)) list.push(t); s.muted[M.chat] = list; saveState(s); return void M.reply('Muted.'); }
  if (cmd === 'unmute') { s.muted[M.chat] = list.filter(x => x !== t); saveState(s); return void M.reply('Unmuted.'); }
  if (cmd === 'warnings') return void M.reply('Warnings: ' + (s.warnings[M.chat + ':' + t] || 0) + '/3');
  if (cmd === 'clearwarn') { delete s.warnings[M.chat + ':' + t]; saveState(s); return void M.reply('Warnings cleared.'); }
  if (cmd === 'warn') {
    const k = M.chat + ':' + t, count = (s.warnings[k] || 0) + 1;
    if (count >= 3) { delete s.warnings[k]; saveState(s); await sock.groupParticipantsUpdate(M.chat, [t], 'remove'); return void M.reply('3/3 warnings — user kicked and warnings reset.'); }
    s.warnings[k] = count; saveState(s); return void M.reply('Warning ' + count + '/3.');
  }
  if (cmd === 'kick') { await sock.groupParticipantsUpdate(M.chat, [t], 'remove'); return void M.reply('User kicked.'); }
}
export async function enforceMute(sock: WASocket, M: any) {
  if (!M.isGroup) return;
  const s = loadState();
  if ((s.muted[M.chat] || []).includes(M.sender)) {
    try { await sock.sendMessage(M.chat, { delete: M.key }); } catch (e) { console.error('[MUTE]', e); }
  }
}
