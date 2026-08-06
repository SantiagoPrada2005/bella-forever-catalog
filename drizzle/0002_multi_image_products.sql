-- UP: Multi-Image Products
-- Creates ProductImage table with FK cascade on delete,
-- index on productId, and backfill from existing Product.mainImage.

CREATE TABLE ProductImage (
  id TEXT PRIMARY KEY NOT NULL,
  productId TEXT NOT NULL REFERENCES Product(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sortOrder INTEGER NOT NULL DEFAULT 0,
  altText TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE INDEX idx_productImage_productId ON ProductImage(productId);

-- Backfill: existing mainImage values become ProductImage rows
INSERT INTO ProductImage (id, productId, url, sortOrder, altText, createdAt, updatedAt)
SELECT
  lower(hex(randomblob(16))),
  id,
  mainImage,
  0,
  name,
  datetime('now'),
  datetime('now')
FROM Product
WHERE mainImage IS NOT NULL AND mainImage != '';
