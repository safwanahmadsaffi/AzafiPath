CREATE TABLE `azadi_leaks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`label` varchar(255) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`healthImpact` int NOT NULL,
	`dateLabel` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `azadi_leaks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `azadi_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ageGroup` varchar(32) NOT NULL,
	`goal` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `azadi_profiles_id` PRIMARY KEY(`id`)
);
