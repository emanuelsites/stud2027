CREATE TABLE IF NOT EXISTS `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`entry_id` text NOT NULL,
	`created_at` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`gallery` text DEFAULT '[]' NOT NULL,
	`info` text DEFAULT '{}' NOT NULL,
	`pedigree` text DEFAULT '{}' NOT NULL,
	`categories` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`source_url` text DEFAULT '' NOT NULL,
	`published_at` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `entries_slug_unique` ON `entries` (`slug`);
CREATE TABLE IF NOT EXISTS `inquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`interest` text NOT NULL,
	`message` text NOT NULL,
	`consent_at` text NOT NULL,
	`created_at` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL
);

CREATE TABLE IF NOT EXISTS `media` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`mime` text NOT NULL,
	`bytes` integer NOT NULL,
	`created_at` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `members` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`user_id` text,
	`role` text DEFAULT 'editor' NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `members_email_unique` ON `members` (`email`);
CREATE TABLE IF NOT EXISTS `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`expires_at` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `source_records` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`url` text NOT NULL,
	`payload` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `admin_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `admin_users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`salt` text NOT NULL,
	`iterations` integer DEFAULT 210000 NOT NULL,
 `role` text DEFAULT 'admin' NOT NULL,
 `email` text DEFAULT '' NOT NULL,
 `display_name` text DEFAULT 'Administrador' NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `admin_users_username_unique` ON `admin_users` (`username`);
CREATE TABLE IF NOT EXISTS `visual_pages` (
	`path` text PRIMARY KEY NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`patches` text DEFAULT '[]' NOT NULL,
	`operation_id` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `url_redirects` (
	`from_path` text PRIMARY KEY NOT NULL,
	`entry_id` text,
	`target_path` text DEFAULT '' NOT NULL
);
