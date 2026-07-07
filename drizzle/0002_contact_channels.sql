CREATE TABLE "contact_channels" (
  "id" text PRIMARY KEY NOT NULL,
  "type" varchar(32) NOT NULL,
  "label" text NOT NULL,
  "content" text NOT NULL,
  "href" text NOT NULL,
  "external" boolean DEFAULT false NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "logo_src" text DEFAULT '' NOT NULL,
  "logo_alt" text DEFAULT '' NOT NULL,
  "append_room_message" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "contact_channels_enabled_idx" ON "contact_channels" USING btree ("enabled");
--> statement-breakpoint
CREATE INDEX "contact_channels_sort_order_idx" ON "contact_channels" USING btree ("sort_order");
