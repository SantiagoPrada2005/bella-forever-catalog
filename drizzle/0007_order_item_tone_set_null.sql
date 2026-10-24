-- ======================================================================
-- MIGRACIÓN 0007: ACTUALIZAR CLAVE FORÁNEA TONEID EN ORDERITEM A ON DELETE SET NULL
-- Bella Forever - Resiliencia e integridad referencial en Cloudflare D1
-- ======================================================================

PRAGMA foreign_keys = OFF;

CREATE TABLE `OrderItem_new` (
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
	FOREIGN KEY (`toneId`) REFERENCES `Tone`(`id`) ON UPDATE no action ON DELETE set null
);

INSERT INTO `OrderItem_new` SELECT * FROM `OrderItem`;

DROP TABLE `OrderItem`;

ALTER TABLE `OrderItem_new` RENAME TO `OrderItem`;

CREATE INDEX `idx_orderItem_orderId` ON `OrderItem` (`orderId`);

PRAGMA foreign_keys = ON;
