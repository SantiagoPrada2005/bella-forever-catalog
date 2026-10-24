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
  stock: integer('stock').notNull().default(0),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

export const tones = sqliteTable('Tone', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  hex: text('hex').notNull(),
  image: text('image').notNull(),
  inStock: integer('inStock', { mode: 'boolean' }).notNull().default(true),
  stock: integer('stock').notNull().default(0),
  productId: text('productId').notNull().references(() => products.id, { onDelete: 'cascade' }),
});

export const productImages = sqliteTable('ProductImage', {
  id: text('id').primaryKey(),
  productId: text('productId').notNull().references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  sortOrder: integer('sortOrder').notNull().default(0),
  altText: text('altText'),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

export const categories = sqliteTable('Category', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

export const orders = sqliteTable('Order', {
  id: text('id').primaryKey(),
  orderNumber: text('orderNumber').notNull().unique(),
  customerName: text('customerName').notNull(),
  customerPhone: text('customerPhone').notNull(),
  customerEmail: text('customerEmail'),
  customerAddress: text('customerAddress').notNull(),
  customerCity: text('customerCity').notNull(),
  customerNotes: text('customerNotes'),
  total: real('total').notNull(),
  status: text('status', { enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'separated'] })
    .notNull()
    .default('pending'),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

export const orderItems = sqliteTable('OrderItem', {
  id: text('id').primaryKey(),
  orderId: text('orderId')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('productId')
    .notNull()
    .references(() => products.id),
  toneId: text('toneId').references(() => tones.id, { onDelete: 'set null' }),
  productName: text('productName').notNull(),
  toneName: text('toneName'),
  price: real('price').notNull(),
  quantity: integer('quantity').notNull(),
  subtotal: real('subtotal').notNull(),
  imageUrl: text('imageUrl'),
  createdAt: text('createdAt').notNull(),
});

export const orderPayments = sqliteTable('OrderPayment', {
  id: text('id').primaryKey(),
  orderId: text('orderId')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  method: text('method').notNull().default('efectivo'),
  reference: text('reference'),
  notes: text('notes'),
  createdAt: text('createdAt').notNull(),
});

export const productsRelations = relations(products, ({ many }) => ({
  tones: many(tones),
  productImages: many(productImages),
}));

export const tonesRelations = relations(tones, ({ one }) => ({
  product: one(products, {
    fields: [tones.productId],
    references: [products.id],
  }),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
  payments: many(orderPayments),
}));

export const orderPaymentsRelations = relations(orderPayments, ({ one }) => ({
  order: one(orders, {
    fields: [orderPayments.orderId],
    references: [orders.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  tone: one(tones, {
    fields: [orderItems.toneId],
    references: [tones.id],
  }),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Tone = typeof tones.$inferSelect;
export type NewTone = typeof tones.$inferInsert;

export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type OrderPayment = typeof orderPayments.$inferSelect;
export type NewOrderPayment = typeof orderPayments.$inferInsert;

export type OrderWithItems = Order & {
  items: OrderItem[];
  payments?: OrderPayment[];
};

export type ProductWithRelations = Product & {
  tones: Tone[];
  productImages: ProductImage[];
};
