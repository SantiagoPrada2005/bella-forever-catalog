-- ======================================================================
-- MIGRACIÓN 0010: CARGA DE PEDIDO TRENDY #1675781221561-01 (12 NOV 2026)
-- Total Unidades Entrantes: 55 (Subtotal proveedor: $405.000 COP)
-- Productos Nuevos: 8 (17 unds) | Productos Actualizados: 5 (38 unds)
-- Base Producción Previa: 98 productos, 227 unidades -> Final: 106 productos, 282 unidades
-- ======================================================================

PRAGMA foreign_keys = OFF;

-- 1. ACTUALIZACIÓN DE STOCK Y TONOS EN 5 PRODUCTOS EXISTENTES (+38 unidades)

-- Base Aura Trendy (+3: Tono 00 +1, Tono 01 +1, Tono 07 +1 -> stock 3 a 6)
UPDATE Product SET stock = 6, inStock = 1, updatedAt = '2026-11-23T20:45:00.000Z' WHERE id = '13a97a63-8114-4cc3-8804-3b40cbd23fd6';
INSERT INTO Tone (id, name, hex, image, inStock, stock, productId) VALUES ('c2000001-0000-4000-8000-000000000001', 'Tono 00', '#E6CEBE', '/images/products/base-aura-tono-00.jpg', 1, 1, '13a97a63-8114-4cc3-8804-3b40cbd23fd6');
INSERT INTO Tone (id, name, hex, image, inStock, stock, productId) VALUES ('c2000002-0000-4000-8000-000000000001', 'Tono 01', '#DCC1B0', '/images/products/base-aura-tono-01.jpg', 1, 1, '13a97a63-8114-4cc3-8804-3b40cbd23fd6');
INSERT INTO Tone (id, name, hex, image, inStock, stock, productId) VALUES ('c2000003-0000-4000-8000-000000000001', 'Tono 07', '#AB6D56', '/images/products/base-aura-tono-07.jpg', 1, 1, '13a97a63-8114-4cc3-8804-3b40cbd23fd6');

-- Kit Dúo Pestañina + Fortalecedora Gold Eyes (+4 -> stock 0 a 4)
UPDATE Product SET stock = 4, inStock = 1, updatedAt = '2026-11-23T20:45:00.000Z' WHERE id = '3c67d0a5-f063-41f1-a633-283406e2509d';

-- Pestañina Cat (+2 -> stock 0 a 2)
UPDATE Product SET stock = 2, inStock = 1, updatedAt = '2026-11-23T20:45:00.000Z' WHERE id = '98554be0-605f-4e38-b3e9-0c8dbd003981';

-- Cosmetiquera Mármol Trendy (+5 -> stock 4 a 9)
UPDATE Product SET stock = 9, inStock = 1, updatedAt = '2026-11-23T20:45:00.000Z' WHERE id = 'a1000007-0000-4000-8000-000000000007';

-- Tinta Gloss Corazón Trendy (+24 -> stock 17 a 41)
UPDATE Product SET stock = 41, inStock = 1, updatedAt = '2026-11-23T20:45:00.000Z' WHERE id = '5b943671-344b-4daf-9a34-4f28aac3e630';


-- 2. CREACIÓN DE 8 PRODUCTOS NUEVOS (+17 unidades)

-- 2.1 Labial Trío XOXO Trendy (+2)
INSERT INTO Product (id, name, price, description, category, mainImage, isNew, isFeatured, inStock, stock, createdAt, updatedAt) VALUES ('a2000001-0000-4000-8000-000000000001', 'Labial Trío XOXO Trendy', 15000.0, 'Lleva tres tonos de labios en una sola presentación con el Labial Trío XOXO Trendy. Reúne tonalidades tierra, cafés, nude y rojizas en un práctico formato de torre con fórmula cremosa de acabado mate, buena duración y delicioso aroma a chocolate.', 'labiales', '/images/products/labial-trio-xoxo-trendy.jpg', 1, 0, 1, 2, '2026-11-23T20:45:00.000Z', '2026-11-23T20:45:00.000Z');
INSERT INTO ProductImage (id, productId, url, sortOrder, altText, createdAt, updatedAt) VALUES ('d2000001-0000-4000-8000-000000000001', 'a2000001-0000-4000-8000-000000000001', '/images/products/labial-trio-xoxo-trendy.jpg', 0, 'Labial Trío XOXO Trendy', '2026-11-23T20:45:00.000Z', '2026-11-23T20:45:00.000Z');

-- 2.2 Parches Acné Bob Esponja Trendy (+2)
INSERT INTO Product (id, name, price, description, category, mainImage, isNew, isFeatured, inStock, stock, createdAt, updatedAt) VALUES ('a2000002-0000-4000-8000-000000000002', 'Parches Acné Bob Esponja Trendy', 15000.0, 'Cuida tu piel con los parches para acné Happy Clean de Patricio inspirados en Bob Esponja. Incluye 50 stickers semitransparentes en dos tamaños que protegen los granitos y absorben la humedad mientras descansas.', 'skincare', '/images/products/parches-acne-bob-esponja-trendy.jpg', 1, 0, 1, 2, '2026-11-23T20:45:00.000Z', '2026-11-23T20:45:00.000Z');
INSERT INTO ProductImage (id, productId, url, sortOrder, altText, createdAt, updatedAt) VALUES ('d2000002-0000-4000-8000-000000000001', 'a2000002-0000-4000-8000-000000000002', '/images/products/parches-acne-bob-esponja-trendy.jpg', 0, 'Parches Acné Bob Esponja Trendy', '2026-11-23T20:45:00.000Z', '2026-11-23T20:45:00.000Z');

-- 2.3 Kit Brochas Piel Morado Trendy (+1)
INSERT INTO Product (id, name, price, description, category, mainImage, isNew, isFeatured, inStock, stock, createdAt, updatedAt) VALUES ('a2000003-0000-4000-8000-000000000003', 'Kit Brochas Piel Morado Trendy', 50000.0, 'Kit de 5 brochas de maquillaje Piel Morado de Trendy con diferentes formas y densidades para aplicar productos en polvo y crema con acabado uniforme. Cerdas suaves y tamaño práctico para llevar en tu cosmetiquera.', 'accesorios-de-maquillaje', '/images/products/kit-brochas-piel-morado-trendy.jpg', 1, 0, 1, 1, '2026-11-23T20:45:00.000Z', '2026-11-23T20:45:00.000Z');
INSERT INTO ProductImage (id, productId, url, sortOrder, altText, createdAt, updatedAt) VALUES ('d2000003-0000-4000-8000-000000000001', 'a2000003-0000-4000-8000-000000000003', '/images/products/kit-brochas-piel-morado-trendy.jpg', 0, 'Kit Brochas Piel Morado Trendy', '2026-11-23T20:45:00.000Z', '2026-11-23T20:45:00.000Z');

-- 2.4 Kit Brochas Mini Negro Trendy (+1)
INSERT INTO Product (id, name, price, description, category, mainImage, isNew, isFeatured, inStock, stock, createdAt, updatedAt) VALUES ('a2000004-0000-4000-8000-000000000004', 'Kit Brochas Mini Negro Trendy', 50000.0, 'Kit Mini de 6 brochas negro de Trendy en presentación compacta para rostro, ojos y cejas. Incluye cosmetiquera práctica para organizar tus brochas y llevarlas contigo a todas partes.', 'accesorios-de-maquillaje', '/images/products/kit-brochas-mini-negro-trendy.jpg', 1, 0, 1, 1, '2026-11-23T20:45:00.000Z', '2026-11-23T20:45:00.000Z');
INSERT INTO ProductImage (id, productId, url, sortOrder, altText, createdAt, updatedAt) VALUES ('d2000004-0000-4000-8000-000000000001', 'a2000004-0000-4000-8000-000000000004', '/images/products/kit-brochas-mini-negro-trendy.jpg', 0, 'Kit Brochas Mini Negro Trendy', '2026-11-23T20:45:00.000Z', '2026-11-23T20:45:00.000Z');

-- 2.5 Corrector Rosado Barbie Core Trendy (+4)
INSERT INTO Product (id, name, price, description, category, mainImage, isNew, isFeatured, inStock, stock, createdAt, updatedAt) VALUES ('a2000005-0000-4000-8000-000000000005', 'Corrector Rosado Barbie Core Trendy', 15000.0, 'Ilumina tu mirada con el corrector rosado claro Barbie Core Trendy. Su textura cremosa de acabado semimate suaviza visualmente las ojeras y aporta luz sin sensación pesada, con aplicador chunky cómodo y preciso.', 'rostro', '/images/products/corrector-rosado-barbie-core-trendy.jpg', 1, 0, 1, 4, '2026-11-23T20:45:00.000Z', '2026-11-23T20:45:00.000Z');
INSERT INTO ProductImage (id, productId, url, sortOrder, altText, createdAt, updatedAt) VALUES ('d2000005-0000-4000-8000-000000000001', 'a2000005-0000-4000-8000-000000000005', '/images/products/corrector-rosado-barbie-core-trendy.jpg', 0, 'Corrector Rosado Barbie Core Trendy', '2026-11-23T20:45:00.000Z', '2026-11-23T20:45:00.000Z');

-- 2.6 Brocha Golden Kabuki Piel Trendy (+1)
INSERT INTO Product (id, name, price, description, category, mainImage, isNew, isFeatured, inStock, stock, createdAt, updatedAt) VALUES ('a2000006-0000-4000-8000-000000000006', 'Brocha Golden Kabuki Piel Trendy', 20000.0, 'Brocha doble tipo kabuki con mango metálico dorado y fibras extra suaves de calidad premium. Su extremo pequeño difumina con precisión el contorno de ojos y el extremo grande distribuye bases y cremas de forma uniforme.', 'accesorios-de-maquillaje', '/images/products/brocha-golden-kabuki-piel-trendy.jpg', 1, 0, 1, 1, '2026-11-23T20:45:00.000Z', '2026-11-23T20:45:00.000Z');
INSERT INTO ProductImage (id, productId, url, sortOrder, altText, createdAt, updatedAt) VALUES ('d2000006-0000-4000-8000-000000000001', 'a2000006-0000-4000-8000-000000000006', '/images/products/brocha-golden-kabuki-piel-trendy.jpg', 0, 'Brocha Golden Kabuki Piel Trendy', '2026-11-23T20:45:00.000Z', '2026-11-23T20:45:00.000Z');

-- 2.7 Corrector y Tratamiento Súper Concealer Trendy (+4: Tono 01 x2, Tono 02 x2)
INSERT INTO Product (id, name, price, description, category, mainImage, isNew, isFeatured, inStock, stock, createdAt, updatedAt) VALUES ('a2000007-0000-4000-8000-000000000007', 'Corrector y Tratamiento Súper Concealer Trendy', 15000.0, 'Corrector y tratamiento híbrido de cobertura alta y modulable. Su textura ligera e hidratante se difumina fácilmente para disimular ojeras, manchas e imperfecciones sin sensación pesada.', 'rostro', '/images/products/corrector-y-tratamiento-super-concealer-trendy.jpg', 1, 0, 1, 4, '2026-11-23T20:45:00.000Z', '2026-11-23T20:45:00.000Z');
INSERT INTO ProductImage (id, productId, url, sortOrder, altText, createdAt, updatedAt) VALUES ('d2000007-0000-4000-8000-000000000001', 'a2000007-0000-4000-8000-000000000007', '/images/products/corrector-y-tratamiento-super-concealer-trendy.jpg', 0, 'Corrector y Tratamiento Súper Concealer Trendy', '2026-11-23T20:45:00.000Z', '2026-11-23T20:45:00.000Z');
INSERT INTO Tone (id, name, hex, image, inStock, stock, productId) VALUES ('b2000007-0000-4000-8000-000000000001', 'Tono 01', '#EACBAE', '/images/products/super-concealer-tono-01.jpg', 1, 2, 'a2000007-0000-4000-8000-000000000007');
INSERT INTO Tone (id, name, hex, image, inStock, stock, productId) VALUES ('b2000007-0000-4000-8000-000000000002', 'Tono 02', '#E7C3A1', '/images/products/super-concealer-tono-02.jpg', 1, 2, 'a2000007-0000-4000-8000-000000000007');

-- 2.8 Lápiz de Cejas Dreams Trendy (+2: Tono 02 x2)
INSERT INTO Product (id, name, price, description, category, mainImage, isNew, isFeatured, inStock, stock, createdAt, updatedAt) VALUES ('a2000008-0000-4000-8000-000000000008', 'Lápiz de Cejas Dreams Trendy', 15000.0, 'Lápiz de cejas de doble punta Trendy Dreams. Su punta gruesa biselada rellena y da forma con trazos amplios, mientras la punta delgada dibuja líneas finas que imitan los vellos naturales para unas cejas definidas.', 'ojos', '/images/products/lapiz-de-cejas-dreams-trendy.jpg', 1, 0, 1, 2, '2026-11-23T20:45:00.000Z', '2026-11-23T20:45:00.000Z');
INSERT INTO ProductImage (id, productId, url, sortOrder, altText, createdAt, updatedAt) VALUES ('d2000008-0000-4000-8000-000000000001', 'a2000008-0000-4000-8000-000000000008', '/images/products/lapiz-de-cejas-dreams-trendy.jpg', 0, 'Lápiz de Cejas Dreams Trendy', '2026-11-23T20:45:00.000Z', '2026-11-23T20:45:00.000Z');
INSERT INTO Tone (id, name, hex, image, inStock, stock, productId) VALUES ('b2000008-0000-4000-8000-000000000001', 'Tono 02', '#715B50', '/images/products/lapiz-de-cejas-dreams-tono-02.jpg', 1, 2, 'a2000008-0000-4000-8000-000000000008');

PRAGMA foreign_keys = ON;
