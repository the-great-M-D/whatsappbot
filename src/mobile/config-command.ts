export function configCommand(M: any, args: string[]) {
  if (!args.length || args[0] === 'show') {
    return M.reply([
      'Config',
      'prefix=' + process.env.PREFIX,
      'auth=' + (process.env.WA_AUTH_DIR || ''),
      'data=' + (process.env.BOT_DATA_DIR || ''),
      'discord=' + (process.env.DISCORD_CHANNEL_ID ? 'enabled' : 'disabled'),
      'target=' + (process.env.DISCORD_WA_TARGET || 'not set')
    ].join('\n'));
  }
  return M.reply('Runtime config is environment-based. Edit .env and restart the bot.');
}
