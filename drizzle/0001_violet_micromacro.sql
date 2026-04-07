CREATE TABLE `activityLogs` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`type` enum('transaction','installment','saving') NOT NULL,
	`action` enum('create','update','delete') NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`category` varchar(64) NOT NULL,
	`limit` int NOT NULL,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `installmentPayments` (
	`id` varchar(64) NOT NULL,
	`installmentId` varchar(64) NOT NULL,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`amount` int NOT NULL,
	`isPaid` int NOT NULL DEFAULT 0,
	`paidDate` timestamp,
	CONSTRAINT `installmentPayments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `installments` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`totalAmount` int NOT NULL,
	`monthlyAmount` int NOT NULL,
	`startYear` int NOT NULL,
	`startMonth` int NOT NULL,
	`durationMonths` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `installments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savings` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(64) NOT NULL,
	`targetAmount` int NOT NULL,
	`currentAmount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`amount` int NOT NULL,
	`category` varchar(64) NOT NULL,
	`description` text,
	`date` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
