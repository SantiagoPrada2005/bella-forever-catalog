-- ======================================================================
-- MIGRACIÓN 0006: CORRECCIÓN DE IMÁGENES Y ENLACES DE TONOS TRENDY
-- Bella Forever - Corrección de referencias cruzadas en tabla Tone
-- ======================================================================

-- 1. Corrección de imagen de Tono 03 en Corrector Ojeras Hidratante Rebel Girl Trendy
UPDATE Tone 
SET image = '/images/products/corrector-rebel-girl-tono-03.jpg'
WHERE name = 'Tono 03' 
  AND productId = (SELECT id FROM Product WHERE name = 'Corrector Ojeras Hidratante Rebel Girl Trendy');

-- 2. Corrección de imagen de tono 03 Style en Kit Splash y Crema The Perfect Match 03 Style
UPDATE Tone 
SET image = '/images/products/kit-splash-y-crema-the-perfect-match-03-style.jpg'
WHERE name = '03 Style' 
  AND productId = (SELECT id FROM Product WHERE name = 'Kit Splash y Crema The Perfect Match 03 Style');
