import { spawn } from 'node:child_process';
import path from 'node:path';
import { config } from './config.js';
import { readHistory, readErrors } from './state.js';

const clip = (s: string) => s.length > config.maxOutput ? s.slice(0, config.maxOutput) + '\n...[truncated]' : s;
function run(bin: string, args: string[]) {
  return new Promise<string>((resolve) => {
    const p = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    const timer = setTimeout(() => { p.kill('SIGTERM'); }, config.shellTimeout);
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { err += d; });
    p.on('close', code => { clearTimeout(timer); resolve('exit=' + code + '\n' + clip(out) + (err ? '\nstderr:\n' + clip(err) : '')); });
    p.on('error', e => { clearTimeout(timer); resolve('error: ' + e.message); });
  });
}
export async function dev(M: any, args: string[]) {
  if (!args.length) return void M.reply('Dev: !dev status|logs|sh|py|restart');
  const cmd = args.shift()!.toLowerCase();
  if (cmd === 'status') return void M.reply('Uptime: ' + Math.floor(process.uptime()) + 's\nNode: ' + process.version + '\nPID: ' + process.pid);
  if (cmd === 'logs') return void M.reply(readHistory(Number(args[0]) || 20).join('\n') || 'No bridge history.');
  if (cmd === 'errors') return void M.reply(readErrors(Number(args[0]) || 50).join('\n') || 'No errors recorded.');
  if (cmd === 'restart') {
    await M.reply('Restarting...');
    setTimeout(() => process.exit(0), 500);
    return;
  }
  if (cmd === 'sh') {
    if (args.length !== 1 || !config.allowedCommands.includes(args[0])) return void M.reply('Command not allowlisted. Use !py for approved Python scripts.');
    return void M.reply(await run(args[0], []));
  }
  if (cmd === 'py') {
    const script = args.shift() || '';
    if (!config.allowedScripts.includes(script)) return void M.reply('Python script not allowlisted.');
    const base = path.resolve(process.cwd(), script);
    const root = path.resolve(process.cwd(), 'scripts');
    if (!base.startsWith(root + path.sep)) return void M.reply('Script must be inside scripts/.');
    return void M.reply(await run('python', [base, ...args]));
  }
  return void M.reply('Unknown dev command.');
}
