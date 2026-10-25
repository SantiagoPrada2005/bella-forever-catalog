CREATE TABLE `AnalyticsEvent` (
	`id` text PRIMARY KEY NOT NULL,
	`eventName` text NOT NULL,
	`path` text,
	`productId` text,
	`productName` text,
	`category` text,
	`value` real,
	`source` text,
	`sessionId` text,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_analytics_event_name` ON `AnalyticsEvent` (`eventName`);--> statement-breakpoint
CREATE INDEX `idx_analytics_created_at` ON `AnalyticsEvent` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_analytics_product_id` ON `AnalyticsEvent` (`productId`);--> statement-breakpoint
CREATE INDEX `idx_analytics_session_id` ON `AnalyticsEvent` (`sessionId`);