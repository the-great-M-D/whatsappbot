import { Client, GatewayIntentBits, Message } from 'discord.js';
import { appendHistory } from './state.js';
import { config } from './config.js';

export class DiscordBridge {
  client: Client | null = null;
  constructor(private sendWA: (jid: string, text: string) => Promise<void>) {}
  async start() {
    if (!config.discordToken) return console.log('[DISCORD] disabled (no DISCORD_TOKEN)');
    if (this.client) return;
    this.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
    this.client.on('ready', () => console.log('[DISCORD] connected'));
    this.client.on('messageCreate', async (m: Message) => {
      try {
        if (m.author.bot || m.channelId !== config.discordChannelId || !m.content.startsWith(config.prefix)) return;
        const [cmd, ...rest] = m.content.slice(config.prefix.length).trim().split(/\s+/);
        if (cmd.toLowerCase() !== 'wa') return;
        if (!config.discordAllowed.includes(m.author.id)) return void m.reply('Not authorized.');
        if (!config.discordTarget) return void m.reply('DISCORD_WA_TARGET is not configured.');
        const text = rest.join(' ').trim();
        if (!text) return void m.reply('Usage: !wa <message>');
        await this.sendWA(config.discordTarget, '[Discord] ' + m.author.displayName + ': ' + text);
        appendHistory({ ts: Date.now(), direction: 'discord', whatsappJid: config.discordTarget, discordUserId: m.author.id, discordUser: m.author.displayName, discordChannelId: m.channelId, text });
        await m.react('✅');
      } catch (e) { console.error('[DISCORD] message error:', e); }
    });
    await this.client.login(config.discordToken);
  }
  async fromWA(sender: string, name: string, text: string) {
    if (!this.client || !config.discordChannelId || (config.discordTarget && sender === '')) return;
    const ch = await this.client.channels.fetch(config.discordChannelId);
    if (!ch || !ch.isTextBased() || !('send' in ch)) return;
    await ch.send('[WhatsApp] ' + name + ': ' + text);
    appendHistory({ ts: Date.now(), direction: 'whatsapp', whatsappJid: sender, whatsappSender: name, discordChannelId: config.discordChannelId, text });
  }
}
