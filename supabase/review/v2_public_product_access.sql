-- Run after prerequisites and before publishing code with PUBLIC_PRODUCT_FIELDS.
-- RLS still grants full product access to the verified store administrator.
DROP POLICY IF EXISTS vibe_public_read ON public.produtos;
CREATE POLICY vibe_public_read ON public.produtos FOR SELECT TO anon USING (ativo IS TRUE);
REVOKE ALL ON public.produtos FROM anon, PUBLIC;
GRANT SELECT (id,nome,slug,descricao,descricao_curta,preco_venda,preco_promocional,
  estoque,sku,categoria_id,marca_id,em_destaque,em_promocao,ativo,visualizacoes,
  criado_em,atualizado_em) ON public.produtos TO anon;
NOTIFY pgrst, 'reload schema';
