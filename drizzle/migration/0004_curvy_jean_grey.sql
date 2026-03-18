CREATE TABLE `verify_email_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token` varchar(8) NOT NULL,
	`expires_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL 1 DAY),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verify_email_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `verify_email_tokens` ADD CONSTRAINT `verify_email_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;