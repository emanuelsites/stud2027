CREATE TABLE `url_redirects` (
	`from_path` text PRIMARY KEY NOT NULL,
	`entry_id` text,
	`target_path` text DEFAULT '' NOT NULL
);
