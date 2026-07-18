import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const products = sqliteTable('Product', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: real('price').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  mainImage: text('mainImage').notNull(),
  isNew: integer('isNew', { mode: 'boolean' }).notNull().default(false),
  isFeatured: integer('isFeatured', { mode: 'boolean' }).notNull().default(false),
  inStock: integer('inStock', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

export const tones = sqliteTable('Tone', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  hex: text('hex').notNull(),
  image: text('image').notNull(),
  inStock: integer('inStock', { mode: 'boolean' }).notNull().default(true),
  productId: text('productId').notNull().references(() => products.id, { onDelete: 'cascade' }),
});

export const productsRelations = relations(products, ({ many }) => ({
  tones: many(tones),
}));

export const tonesRelations = relations(tones, ({ one }) => ({
  product: one(products, {
    fields: [tones.productId],
    references: [products.id],
  }),
}));
