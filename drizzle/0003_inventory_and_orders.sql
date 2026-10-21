-- UP: Inventory and Orders
-- Adds stock column to Product and Tone tables (default 10 for existing items)
-- Creates Order and OrderItem tables for internal order tracking

ALTER TABLE `Product` ADD COLUMN `stock` integer DEFAULT 10 NOT NULL;
--> statement-breakpoint
ALTER TABLE `Tone` ADD COLUMN `stock` integer DEFAULT 10 NOT NULL;
--> statement-breakpoint
CREATE TABLE `Order` (
	`id` text PRIMARY KEY NOT NULL,
	`orderNumber` text NOT NULL UNIQUE,
	`customerName` text NOT NULL,
	`customerPhone` text NOT NULL,
	`customerEmail` text,
	`customerAddress` text NOT NULL,
	`customerCity` text NOT NULL,
	`customerNotes` text,
	`total` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `OrderItem` (
	`id` text PRIMARY KEY NOT NULL,
	`orderId` text NOT NULL,
	`productId` text NOT NULL,
	`toneId` text,
	`productName` text NOT NULL,
	`toneName` text,
	`price` real NOT NULL,
	`quantity` integer NOT NULL,
	`subtotal` real NOT NULL,
	`imageUrl` text,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`toneId`) REFERENCES `Tone`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_orderItem_orderId` ON `OrderItem` (`orderId`);
--> statement-breakpoint
CREATE INDEX `idx_order_status` ON `Order` (`status`);
--> statement-breakpoint
CREATE INDEX `idx_order_createdAt` ON `Order` (`createdAt`);
