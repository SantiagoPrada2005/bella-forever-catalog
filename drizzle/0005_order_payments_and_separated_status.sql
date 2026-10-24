-- Migration 0005: Order Payments and Separated Status
-- Creates OrderPayment table for tracking partial payments and installments (abonos)

CREATE TABLE IF NOT EXISTS `OrderPayment` (
	`id` text PRIMARY KEY NOT NULL,
	`orderId` text NOT NULL,
	`amount` real NOT NULL,
	`method` text DEFAULT 'efectivo' NOT NULL,
	`reference` text,
	`notes` text,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS `idx_orderPayment_orderId` ON `OrderPayment` (`orderId`);

CREATE INDEX IF NOT EXISTS `idx_orderPayment_createdAt` ON `OrderPayment` (`createdAt`);
