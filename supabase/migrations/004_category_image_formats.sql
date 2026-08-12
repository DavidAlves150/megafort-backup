-- Garante o bucket público de imagens de categorias e os formatos web suportados.
-- Limite alinhado à validação do formulário: 10 MB.
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'categorias',
  'categorias',
  true,
  10485760,
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Normaliza as políticas, permitindo leitura no catálogo e gestão para sessão autenticada.
DROP POLICY IF EXISTS "Public read categoria images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated manage categoria images" ON storage.objects;
DROP POLICY IF EXISTS "Public read categorias storage" ON storage.objects;
DROP POLICY IF EXISTS "Admin can manage categorias storage" ON storage.objects;

CREATE POLICY "Public read categoria images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'categorias');

CREATE POLICY "Authenticated manage categoria images"
ON storage.objects FOR ALL
TO "authenticated"
USING (bucket_id = 'categorias')
WITH CHECK (bucket_id = 'categorias');
