RENAME TABLE `users_table` TO `short_link`;--> statement-breakpoint
ALTER TABLE `short_link` DROP INDEX `users_table_short_code_unique`;--> statement-breakpoint
ALTER TABLE `short_link` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `short_link` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `short_link` ADD CONSTRAINT `short_link_short_code_unique` UNIQUE(`short_code`);