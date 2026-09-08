export const Permissions = {
    commandsUse: 'commands.use',
    commandsManage: 'commands.manage',
    groupsManage: 'groups.manage',
    groupsModerate: 'groups.moderate',
    scannerView: 'scanner.view',
    scannerManage: 'scanner.manage',
    instancesStart: 'instances.start',
    instancesStop: 'instances.stop',
    instancesPair: 'instances.pair',
    settingsManage: 'settings.manage',
    usersManage: 'users.manage',
} as const

export type Permission = typeof Permissions[keyof typeof Permissions]

export function hasPermission(granted: Iterable<string>, required: string): boolean {
    return new Set(granted).has(required)
}
