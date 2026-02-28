CREATE TABLE IF NOT EXISTS "chat_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "channel" text NOT NULL,
  "external_session_id" text,
  "participants" text[],
  "tags" text[],
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_sessions_channel_idx" ON "chat_sessions" ("channel");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_sessions_external_session_id_idx" ON "chat_sessions" ("external_session_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_sessions_created_at_idx" ON "chat_sessions" ("created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL,
  "role" text NOT NULL,
  "channel_message_id" text,
  "sender" text,
  "content" text NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_session_id_idx" ON "chat_messages" ("session_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_role_idx" ON "chat_messages" ("role");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_channel_message_id_idx" ON "chat_messages" ("channel_message_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_created_at_idx" ON "chat_messages" ("created_at");