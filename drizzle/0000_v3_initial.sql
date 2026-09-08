CREATE TYPE "user_status" AS ENUM ('INVITED','ACTIVE','SUSPENDED','DISABLED');
CREATE TYPE "instance_status" AS ENUM ('CREATED','STARTING','PAIRING','CONNECTING','CONNECTED','DISCONNECTED','RECONNECTING','STOPPING','STOPPED','CRASHED','DISABLED');
CREATE TYPE "desired_state" AS ENUM ('RUNNING','STOPPED');
CREATE TYPE "scanner_event_status" AS ENUM ('MATCHED','NOTIFIED','ACTIONED','IGNORED');
CREATE TYPE "task_status" AS ENUM ('QUEUED','RUNNING','SUCCEEDED','FAILED','CANCELLED','TIMED_OUT');

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "username" varchar(120) NOT NULL UNIQUE,
  "password_hash" text NOT NULL, "status" "user_status" NOT NULL DEFAULT 'INVITED',
  "totp_secret_encrypted" text, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "name" varchar(80) NOT NULL UNIQUE, "description" text,
  "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "name" varchar(160) NOT NULL UNIQUE, "description" text
);
CREATE TABLE "user_roles" ("user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE, "role_id" uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE, PRIMARY KEY ("user_id","role_id"));
CREATE TABLE "role_permissions" ("role_id" uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE, "permission_id" uuid NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE, PRIMARY KEY ("role_id","permission_id"));
CREATE TABLE "bot_instances" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "slug" varchar(100) NOT NULL UNIQUE, "name" varchar(160) NOT NULL,
  "status" "instance_status" NOT NULL DEFAULT 'CREATED', "desired_state" "desired_state" NOT NULL DEFAULT 'STOPPED',
  "config" jsonb NOT NULL DEFAULT '{}'::jsonb, "deleted_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "bot_instances_status_idx" ON "bot_instances"("status");
CREATE TABLE "instance_users" ("instance_id" uuid NOT NULL REFERENCES "bot_instances"("id") ON DELETE CASCADE, "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE, "role_id" uuid REFERENCES "roles"("id") ON DELETE SET NULL, PRIMARY KEY ("instance_id","user_id"));
CREATE TABLE "whatsapp_identities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "instance_id" uuid NOT NULL UNIQUE REFERENCES "bot_instances"("id") ON DELETE CASCADE,
  "provider" varchar(40) NOT NULL DEFAULT 'baileys', "phone_jid" varchar(160), "label" varchar(160),
  "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "whatsapp_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "instance_id" uuid NOT NULL UNIQUE REFERENCES "bot_instances"("id") ON DELETE CASCADE,
  "encrypted_backup" text, "key_version" varchar(40), "backed_up_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "groups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "instance_id" uuid NOT NULL REFERENCES "bot_instances"("id") ON DELETE CASCADE,
  "whatsapp_jid" varchar(180) NOT NULL, "name" varchar(255), "is_bot_admin" boolean NOT NULL DEFAULT false,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("instance_id","whatsapp_jid")
);
CREATE TABLE "group_settings" ("group_id" uuid PRIMARY KEY REFERENCES "groups"("id") ON DELETE CASCADE, "settings" jsonb NOT NULL DEFAULT '{}'::jsonb, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now());
CREATE TABLE "commands" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "name" varchar(100) NOT NULL UNIQUE, "description" text, "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb);
CREATE TABLE "instance_commands" ("instance_id" uuid NOT NULL REFERENCES "bot_instances"("id") ON DELETE CASCADE, "command_id" uuid NOT NULL REFERENCES "commands"("id") ON DELETE CASCADE, "enabled" boolean NOT NULL DEFAULT true, PRIMARY KEY ("instance_id","command_id"));
CREATE TABLE "features" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "name" varchar(120) NOT NULL UNIQUE, "description" text);
CREATE TABLE "instance_features" ("instance_id" uuid NOT NULL REFERENCES "bot_instances"("id") ON DELETE CASCADE, "feature_id" uuid NOT NULL REFERENCES "features"("id") ON DELETE CASCADE, "enabled" boolean NOT NULL, PRIMARY KEY ("instance_id","feature_id"));
CREATE TABLE "messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "instance_id" uuid NOT NULL REFERENCES "bot_instances"("id") ON DELETE CASCADE,
  "group_id" uuid REFERENCES "groups"("id") ON DELETE SET NULL, "whatsapp_message_id" varchar(255) NOT NULL, "sender_jid" varchar(180) NOT NULL, "text" text,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb, "created_at" timestamptz NOT NULL DEFAULT now(), UNIQUE ("instance_id","whatsapp_message_id")
);
CREATE INDEX "messages_instance_created_idx" ON "messages"("instance_id","created_at");
CREATE TABLE "scanner_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "instance_id" uuid NOT NULL REFERENCES "bot_instances"("id") ON DELETE CASCADE,
  "source" varchar(80) NOT NULL, "external_id" varchar(255), "status" "scanner_event_status" NOT NULL DEFAULT 'MATCHED',
  "payload" jsonb NOT NULL DEFAULT '{}'::jsonb, "matched_at" timestamptz NOT NULL DEFAULT now(), "expires_at" timestamptz
);
CREATE INDEX "scanner_events_instance_time_idx" ON "scanner_events"("instance_id","matched_at");
CREATE TABLE "scanner_configs" ("instance_id" uuid PRIMARY KEY REFERENCES "bot_instances"("id") ON DELETE CASCADE, "enabled" boolean NOT NULL DEFAULT false, "config" jsonb NOT NULL DEFAULT '{}'::jsonb, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now());
CREATE TABLE "jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "instance_id" uuid NOT NULL REFERENCES "bot_instances"("id") ON DELETE CASCADE,
  "name" varchar(160) NOT NULL, "type" varchar(100) NOT NULL, "schedule" varchar(160) NOT NULL, "timezone" varchar(80) NOT NULL DEFAULT 'UTC', "enabled" boolean NOT NULL DEFAULT true,
  "payload" jsonb NOT NULL DEFAULT '{}'::jsonb, "next_run_at" timestamptz, "last_run_at" timestamptz, "last_status" varchar(40), "failure_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "jobs_instance_next_run_idx" ON "jobs"("instance_id","next_run_at");
CREATE TABLE "tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "instance_id" uuid NOT NULL REFERENCES "bot_instances"("id") ON DELETE CASCADE, "type" varchar(100) NOT NULL,
  "status" "task_status" NOT NULL DEFAULT 'QUEUED', "payload" jsonb NOT NULL DEFAULT '{}'::jsonb, "progress" integer NOT NULL DEFAULT 0, "error" text,
  "started_at" timestamptz, "finished_at" timestamptz, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "tasks_instance_status_idx" ON "tasks"("instance_id","status");
CREATE TABLE "logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "instance_id" uuid REFERENCES "bot_instances"("id") ON DELETE SET NULL, "level" varchar(20) NOT NULL, "service" varchar(80) NOT NULL, "event" varchar(120), "message" text NOT NULL, "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb, "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "logs_instance_created_idx" ON "logs"("instance_id","created_at");
CREATE TABLE "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "actor_type" varchar(30) NOT NULL, "actor_id" uuid REFERENCES "users"("id") ON DELETE SET NULL, "instance_id" uuid REFERENCES "bot_instances"("id") ON DELETE SET NULL,
  "action" varchar(160) NOT NULL, "target" varchar(255), "result" varchar(30) NOT NULL, "request_id" varchar(120), "ip" varchar(64), "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb, "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "audit_created_idx" ON "audit_logs"("created_at");
CREATE INDEX "audit_instance_idx" ON "audit_logs"("instance_id");
CREATE TABLE "dashboard_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE, "token_hash" text NOT NULL UNIQUE,
  "expires_at" timestamptz NOT NULL, "last_seen_at" timestamptz NOT NULL DEFAULT now(), "ip" varchar(64), "user_agent" text, "revoked_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "dashboard_sessions_user_idx" ON "dashboard_sessions"("user_id");
