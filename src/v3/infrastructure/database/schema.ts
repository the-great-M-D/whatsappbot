import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  primaryKey,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'

export const userStatus = pgEnum('user_status', ['INVITED', 'ACTIVE', 'SUSPENDED', 'DISABLED'])
export const instanceStatus = pgEnum('instance_status', ['CREATED', 'STARTING', 'PAIRING', 'CONNECTING', 'CONNECTED', 'DISCONNECTED', 'RECONNECTING', 'STOPPING', 'STOPPED', 'CRASHED', 'DISABLED'])
export const desiredState = pgEnum('desired_state', ['RUNNING', 'STOPPED'])
export const scannerEventStatus = pgEnum('scanner_event_status', ['MATCHED', 'NOTIFIED', 'ACTIONED', 'IGNORED'])
export const taskStatus = pgEnum('task_status', ['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'TIMED_OUT'])

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 120 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  status: userStatus('status').default('INVITED').notNull(),
  totpSecretEncrypted: text('totp_secret_encrypted'),
  ...timestamps,
}, (t) => [uniqueIndex('users_username_uq').on(t.username)])

export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 80 }).notNull(),
  description: text('description'),
  ...timestamps,
}, (t) => [uniqueIndex('roles_name_uq').on(t.name)])

export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 160 }).notNull(),
  description: text('description'),
}, (t) => [uniqueIndex('permissions_name_uq').on(t.name)])

export const userRoles = pgTable('user_roles', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
}, (t) => [primaryKey({ columns: [t.userId, t.roleId] })])

export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })])

export const botInstances = pgTable('bot_instances', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull(),
  name: varchar('name', { length: 160 }).notNull(),
  status: instanceStatus('status').default('CREATED').notNull(),
  desiredState: desiredState('desired_state').default('STOPPED').notNull(),
  config: jsonb('config').$type<Record<string, unknown>>().default({}).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  ...timestamps,
}, (t) => [uniqueIndex('bot_instances_slug_uq').on(t.slug), index('bot_instances_status_idx').on(t.status)])

export const instanceUsers = pgTable('instance_users', {
  instanceId: uuid('instance_id').notNull().references(() => botInstances.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'set null' }),
}, (t) => [primaryKey({ columns: [t.instanceId, t.userId] })])

export const whatsappIdentities = pgTable('whatsapp_identities', {
  id: uuid('id').defaultRandom().primaryKey(),
  instanceId: uuid('instance_id').notNull().references(() => botInstances.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 40 }).default('baileys').notNull(),
  phoneJid: varchar('phone_jid', { length: 160 }),
  label: varchar('label', { length: 160 }),
  ...timestamps,
}, (t) => [uniqueIndex('whatsapp_identity_instance_uq').on(t.instanceId)])

export const whatsappSessions = pgTable('whatsapp_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  instanceId: uuid('instance_id').notNull().references(() => botInstances.id, { onDelete: 'cascade' }),
  encryptedBackup: text('encrypted_backup'),
  keyVersion: varchar('key_version', { length: 40 }),
  backedUpAt: timestamp('backed_up_at', { withTimezone: true }),
  ...timestamps,
}, (t) => [uniqueIndex('whatsapp_session_instance_uq').on(t.instanceId)])

export const groups = pgTable('groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  instanceId: uuid('instance_id').notNull().references(() => botInstances.id, { onDelete: 'cascade' }),
  whatsappJid: varchar('whatsapp_jid', { length: 180 }).notNull(),
  name: varchar('name', { length: 255 }),
  isBotAdmin: boolean('is_bot_admin').default(false).notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
}, (t) => [uniqueIndex('groups_instance_jid_uq').on(t.instanceId, t.whatsappJid)])

export const groupSettings = pgTable('group_settings', {
  groupId: uuid('group_id').primaryKey().references(() => groups.id, { onDelete: 'cascade' }),
  settings: jsonb('settings').$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
})

export const commands = pgTable('commands', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
}, (t) => [uniqueIndex('commands_name_uq').on(t.name)])

export const instanceCommands = pgTable('instance_commands', {
  instanceId: uuid('instance_id').notNull().references(() => botInstances.id, { onDelete: 'cascade' }),
  commandId: uuid('command_id').notNull().references(() => commands.id, { onDelete: 'cascade' }),
  enabled: boolean('enabled').default(true).notNull(),
}, (t) => [primaryKey({ columns: [t.instanceId, t.commandId] })])

export const features = pgTable('features', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  description: text('description'),
}, (t) => [uniqueIndex('features_name_uq').on(t.name)])

export const instanceFeatures = pgTable('instance_features', {
  instanceId: uuid('instance_id').notNull().references(() => botInstances.id, { onDelete: 'cascade' }),
  featureId: uuid('feature_id').notNull().references(() => features.id, { onDelete: 'cascade' }),
  enabled: boolean('enabled').notNull(),
}, (t) => [primaryKey({ columns: [t.instanceId, t.featureId] })])

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  instanceId: uuid('instance_id').notNull().references(() => botInstances.id, { onDelete: 'cascade' }),
  groupId: uuid('group_id').references(() => groups.id, { onDelete: 'set null' }),
  whatsappMessageId: varchar('whatsapp_message_id', { length: 255 }).notNull(),
  senderJid: varchar('sender_jid', { length: 180 }).notNull(),
  text: text('text'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex('messages_instance_provider_id_uq').on(t.instanceId, t.whatsappMessageId), index('messages_instance_created_idx').on(t.instanceId, t.createdAt)])

export const scannerEvents = pgTable('scanner_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  instanceId: uuid('instance_id').notNull().references(() => botInstances.id, { onDelete: 'cascade' }),
  source: varchar('source', { length: 80 }).notNull(),
  externalId: varchar('external_id', { length: 255 }),
  status: scannerEventStatus('status').default('MATCHED').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().default({}).notNull(),
  matchedAt: timestamp('matched_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (t) => [index('scanner_events_instance_time_idx').on(t.instanceId, t.matchedAt)])

export const scannerConfigs = pgTable('scanner_configs', {
  instanceId: uuid('instance_id').primaryKey().references(() => botInstances.id, { onDelete: 'cascade' }),
  enabled: boolean('enabled').default(false).notNull(),
  config: jsonb('config').$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
})

export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  instanceId: uuid('instance_id').notNull().references(() => botInstances.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 160 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  schedule: varchar('schedule', { length: 160 }).notNull(),
  timezone: varchar('timezone', { length: 80 }).default('UTC').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().default({}).notNull(),
  nextRunAt: timestamp('next_run_at', { withTimezone: true }),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  lastStatus: varchar('last_status', { length: 40 }),
  failureCount: integer('failure_count').default(0).notNull(),
  ...timestamps,
}, (t) => [index('jobs_instance_next_run_idx').on(t.instanceId, t.nextRunAt)])

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  instanceId: uuid('instance_id').notNull().references(() => botInstances.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 100 }).notNull(),
  status: taskStatus('status').default('QUEUED').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().default({}).notNull(),
  progress: integer('progress').default(0).notNull(),
  error: text('error'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  ...timestamps,
}, (t) => [index('tasks_instance_status_idx').on(t.instanceId, t.status)])

export const logs = pgTable('logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  instanceId: uuid('instance_id').references(() => botInstances.id, { onDelete: 'set null' }),
  level: varchar('level', { length: 20 }).notNull(),
  service: varchar('service', { length: 80 }).notNull(),
  event: varchar('event', { length: 120 }),
  message: text('message').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('logs_instance_created_idx').on(t.instanceId, t.createdAt)])

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorType: varchar('actor_type', { length: 30 }).notNull(),
  actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  instanceId: uuid('instance_id').references(() => botInstances.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 160 }).notNull(),
  target: varchar('target', { length: 255 }),
  result: varchar('result', { length: 30 }).notNull(),
  requestId: varchar('request_id', { length: 120 }),
  ip: varchar('ip', { length: 64 }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('audit_created_idx').on(t.createdAt), index('audit_instance_idx').on(t.instanceId)])

export const dashboardSessions = pgTable('dashboard_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
  ip: varchar('ip', { length: 64 }),
  userAgent: text('user_agent'),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex('dashboard_sessions_token_uq').on(t.tokenHash), index('dashboard_sessions_user_idx').on(t.userId)])
