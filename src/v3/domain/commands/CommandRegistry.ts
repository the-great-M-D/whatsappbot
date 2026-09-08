export type CommandAvailability = 'AVAILABLE' | 'DISABLED' | 'MISSING_DEPENDENCY' | 'MISCONFIGURED'

export interface CommandDefinition {
    name: string
    aliases?: string[]
    category?: string
    description?: string
    permissions?: string[]
    features?: string[]
    dependencies?: string[]
    availability?: CommandAvailability
    run: (context: CommandContext) => Promise<CommandResult> | CommandResult
}

export interface CommandContext {
    instanceId: string
    actorId: string
    chatId: string
    chatType: 'private' | 'group'
    args: string[]
    text: string
}

export interface CommandResult {
    type: 'text' | 'no-response' | 'error'
    text?: string
}

/** Central command registry. Command modules register once at worker startup. */
export class CommandRegistry {
    private readonly commands = new Map<string, CommandDefinition>()
    private readonly aliases = new Map<string, string>()

    register(command: CommandDefinition): void {
        const name = command.name.trim().toLowerCase()
        if (!name) throw new Error('Command name is required')
        if (this.commands.has(name)) throw new Error(`Command already registered: ${name}`)
        this.commands.set(name, { ...command, name })
        for (const alias of command.aliases ?? []) {
            const normalized = alias.trim().toLowerCase()
            if (normalized) this.aliases.set(normalized, name)
        }
    }

    resolve(name: string): CommandDefinition | undefined {
        const normalized = name.trim().toLowerCase()
        return this.commands.get(normalized) ?? this.commands.get(this.aliases.get(normalized) ?? '')
    }

    list(): CommandDefinition[] {
        return [...this.commands.values()]
    }

    clear(): void {
        this.commands.clear()
        this.aliases.clear()
    }
}
