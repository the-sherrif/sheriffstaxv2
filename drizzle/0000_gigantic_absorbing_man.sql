CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`session_hash` text NOT NULL,
	`handle` text NOT NULL,
	`warrant_url` text,
	`warrant_number` text NOT NULL,
	`rules_version` integer NOT NULL,
	`referred_by` integer,
	`follow` integer DEFAULT 0 NOT NULL,
	`like` integer DEFAULT 0 NOT NULL,
	`spread_mode` text DEFAULT 'quote' NOT NULL,
	`spread_url` text DEFAULT '' NOT NULL,
	`reply_url` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`recovery_hash` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `applications_session_hash_unique` ON `applications` (`session_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `applications_recovery_hash_unique` ON `applications` (`recovery_hash`);--> statement-breakpoint
CREATE TABLE `deputies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`application_id` text NOT NULL,
	`handle` text NOT NULL,
	`referrer_id` integer,
	`created_at` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `deputies_application_id_unique` ON `deputies` (`application_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `deputies_handle_unique` ON `deputies` (`handle`);--> statement-breakpoint
CREATE INDEX `idx_deputies_referrer_status` ON `deputies` (`referrer_id`,`status`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`bucket_key` text PRIMARY KEY NOT NULL,
	`hits` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_rate_limits_expiry` ON `rate_limits` (`expires_at`);--> statement-breakpoint
CREATE TABLE `referral_visits` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`referrer_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`referrer_id`) REFERENCES `deputies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_referral_expiry` ON `referral_visits` (`expires_at`);--> statement-breakpoint
CREATE TABLE `verified_contributions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chain_id` integer NOT NULL,
	`transaction_hash` text NOT NULL,
	`transfer_index` integer NOT NULL,
	`wallet` text NOT NULL,
	`asset` text NOT NULL,
	`atomic_amount` text NOT NULL,
	`usd_cents` integer NOT NULL,
	`phase` text NOT NULL,
	`referrer_id` integer,
	`status` text NOT NULL,
	`verified_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_unique_chain_transfer` ON `verified_contributions` (`chain_id`,`transaction_hash`,`transfer_index`);