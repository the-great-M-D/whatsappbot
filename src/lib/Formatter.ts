/**
 * M_D Bot message design system.
 *
 * One consistent look for every reply:
 *   - bold section headers with a divider
 *   - short labelled fields
 *   - semantic status lines (ok / error / warn / info)
 *   - a quiet footer with a usage hint
 *
 * WhatsApp formatting: *bold*, _italic_, ```monospace```.
 */

export const BRAND = 'M_D BOT'

export const DIVIDER = '━━━━━━━━━━━━━━━━━━'

export const F = {
    /** Section header: brand + title + divider */
    header(title: string): string {
        return `✦ *${BRAND} · ${title.toUpperCase()}*\n${DIVIDER}`
    },

    /** Labelled field line */
    field(label: string, value: string | number): string {
        return `▢ *${label}:* ${value}`
    },

    /** Success status */
    ok(message: string): string {
        return `✅ ${message}`
    },

    /** Error status */
    err(message: string): string {
        return `❌ *Error* — ${message}`
    },

    /** Warning status */
    warn(message: string): string {
        return `⚠️ ${message}`
    },

    /** Neutral info status */
    info(message: string): string {
        return `ℹ️ ${message}`
    },

    /** Footer divider + hint line */
    footer(hint?: string): string {
        return `${DIVIDER}\n_${hint || `M_D Bot • use !help for the command list`}_`
    },

    /** Full framed block: header, body lines, footer */
    frame(title: string, body: string[], hint?: string): string {
        return [F.header(title), '', ...body, '', F.footer(hint)].join('\n')
    }
}
