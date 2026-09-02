/**
 * DiscordLogger — forwards bot events to a Discord channel via webhook.
 * Set DISCORD_WEBHOOK_URL in env to activate. If unset, this is a no-op.
 */

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || ''
const BOT_NAME = process.env.NAME || 'M_D Bot'

const EMOJI: Record<string, string> = {
    message: '💬',
    command: '⚡',
    group: '👥',
    call: '📞',
    connect: '✅',
    disconnect: '❌',
    system: '🔧'
}

const COLORS: Record<string, number> = {
    message: 0x3498db,    // blue
    command: 0xf39c12,    // orange
    group: 0x2ecc71,      // green
    call: 0xe74c3c,       // red
    connect: 0x2ecc71,    // green
    disconnect: 0xe74c3c, // red
    system: 0x95a5a6      // gray
}

async function postToDiscord(payload: any): Promise<void> {
    if (!WEBHOOK_URL) return
    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
    } catch (err) {
        console.error('[DiscordLogger] Failed to send webhook:', (err as Error).message)
    }
}

export default class DiscordLogger {
    constructor() {
        if (WEBHOOK_URL) {
            console.log('✅ Discord logging enabled')
            this.notify('connect', `${BOT_NAME} starting up`, 'Bot process launched')
        } else {
            console.log('ℹ️ Discord logging disabled (set DISCORD_WEBHOOK_URL to enable)')
        }
    }

    async notify(type: string, title: string, detail: string): Promise<void> {
        if (!WEBHOOK_URL) return
        const embed = {
            title: `${EMOJI[type] || '📍'} ${title}`,
            description: detail,
            color: COLORS[type] || 0x95a5a6,
            timestamp: new Date().toISOString(),
            footer: { text: BOT_NAME }
        }
        await postToDiscord({ embeds: [embed] })
    }

    onMessage(sender: string, group: string | null, content: string): void {
        this.notify('message', `${sender}${group ? ` in ${group}` : ' (DM)'}`, content.slice(0, 1024))
    }

    onCommand(command: string, sender: string, group: string | null): void {
        this.notify('command', `!${command} · ${sender}`, group || 'DM')
    }

    onGroupEvent(names: string, action: string, group: string, actor: string | null): void {
        this.notify('group', `${names} ${action}`, `${group}${actor ? ` · by ${actor}` : ''}`)
    }

    onCall(from: string): void {
        this.notify('call', `Incoming call from ${from}`, 'Auto-rejected')
    }

    onConnect(name: string): void {
        this.notify('connect', `Connected as ${name}`, 'WhatsApp session active')
    }

    onDisconnect(reason: string): void {
        this.notify('disconnect', 'Bot disconnected', reason)
    }

    onSystem(title: string, detail: string): void {
        this.notify('system', title, detail)
    }
}
