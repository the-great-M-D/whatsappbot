import 'dotenv/config';

const csv = (v: string | undefined) => (v || '').split(',').map(x => x.trim()).filter(Boolean);
const phone = (v: string) => {
  const n = v.replace(/[^0-9]/g, '');
  return n ? (n.includes('@') ? n : n + '@s.whatsapp.net') : '';
};

export const config = {
  phone: process.env.WA_PHONE_NUMBER || '',
  owners: csv(process.env.OWNER_NUMBERS).map(phone),
  prefix: process.env.PREFIX || '!',
  authDir: process.env.WA_AUTH_DIR || '/storage/1FC3-111D/whatsapp-auth',
  dataDir: process.env.BOT_DATA_DIR || '/storage/1FC3-111D/discord',
  discordToken: process.env.DISCORD_TOKEN || '',
  discordChannelId: process.env.DISCORD_CHANNEL_ID || '',
  discordTarget: process.env.DISCORD_WA_TARGET || '',
  discordAllowed: csv(process.env.DISCORD_ALLOWED_USER_IDS),
  allowedCommands: csv(process.env.DEV_ALLOWED_COMMANDS),
  allowedScripts: csv(process.env.DEV_ALLOWED_SCRIPTS),
  shellTimeout: Number(process.env.DEV_TIMEOUT_MS || 15000),
  maxOutput: Number(process.env.DEV_MAX_OUTPUT || 12000)
};
