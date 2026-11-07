-- Incremental prerequisites reviewed against the original MegaFort database.
-- Execute in one transaction together with v2_atomic_operations.sql, after backup.
-- No catalog seeds, no deletion of business records, no replacement of auth accounts.
-- Provision the existing, verified store administrator via app_metadata before rollout.

INSERT INTO public.configuracoes(chave,valor) VALUES
  ('nome_empresa','VIBE FITNESS'),
  ('slogan','SEU PARAÍSO FITNESS'),
  ('logo_url','/logo-vibe-fitness.jpeg'),
  ('instagram','https://www.instagram.com/vibefit_oficial1'),
  ('instagram_user','vibefit_oficial1')
ON CONFLICT(chave) DO UPDATE SET valor=excluded.valor;

CREATE TABLE IF NOT EXISTS public.product_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  nome varchar(100) NOT NULL, ordem integer DEFAULT 0,
  criado_em timestamptz DEFAULT now(), atualizado_em timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.product_variation_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variation_id uuid NOT NULL REFERENCES public.product_variations(id) ON DELETE CASCADE,
  valor varchar(100) NOT NULL, ordem integer DEFAULT 0,
  criado_em timestamptz DEFAULT now(), atualizado_em timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.product_stock_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.product_variation_options(id) ON DELETE CASCADE,
  estoque integer NOT NULL DEFAULT 0,
  criado_em timestamptz DEFAULT now(), atualizado_em timestamptz DEFAULT now(),
  UNIQUE(produto_id,option_id)
);
CREATE INDEX IF NOT EXISTS idx_product_variations_produto ON public.product_variations(produto_id);
CREATE INDEX IF NOT EXISTS idx_product_variation_options_variation ON public.product_variation_options(variation_id);
CREATE INDEX IF NOT EXISTS idx_product_stock_variations_produto ON public.product_stock_variations(produto_id);
CREATE INDEX IF NOT EXISTS idx_product_stock_variations_option ON public.product_stock_variations(option_id);

-- The original products table has no update timestamp trigger. Optimistic editing
-- and stock conflict detection require it, including for writes by older clients.
CREATE OR REPLACE FUNCTION public.fn_set_atualizado_em()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN NEW.atualizado_em=clock_timestamp(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_vibe_product_updated ON public.produtos;
CREATE TRIGGER trg_vibe_product_updated BEFORE UPDATE ON public.produtos
FOR EACH ROW EXECUTE FUNCTION public.fn_set_atualizado_em();

-- Preserve the original canal CHECK ('fisico','online') while keeping V2's
-- detailed canal_venda. The old function copied 'WhatsApp' into canal and failed.
CREATE OR REPLACE FUNCTION public.fn_calcular_lucro_venda()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  NEW.lucro_real=(NEW.valor_venda-NEW.valor_custo)*NEW.quantidade;
  NEW.valor_total=NEW.valor_venda*NEW.quantidade;
  NEW.preco_compra_unidade=NEW.valor_custo;
  NEW.canal=CASE WHEN NEW.canal_venda IN ('Loja Física','fisico') THEN 'fisico' ELSE 'online' END;
  NEW.anotacoes=NEW.observacoes;
  RETURN NEW;
END;
$$;

-- Replace permissive authenticated-user policies only on the application's tables.
-- Protect legacy financial tables even though V2 does not currently display them.
DO $$ DECLARE table_name text; policy_row record; BEGIN
  FOREACH table_name IN ARRAY ARRAY['banners','categorias','marcas','configuracoes',
    'produtos','product_images','product_videos','produto_imagens','produto_videos',
    'product_variations','product_variation_options','product_stock_variations',
    'vendas','despesas','fluxo_caixa','notas_contabeis','categorias_financeiras','click_tracking'] LOOP
    IF to_regclass('public.' || table_name) IS NULL THEN CONTINUE; END IF;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',table_name);
    FOR policy_row IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=table_name LOOP
      EXECUTE format('DROP POLICY %I ON public.%I',policy_row.policyname,table_name);
    END LOOP;
    EXECUTE format('CREATE POLICY vibe_admin ON public.%I FOR ALL TO authenticated USING ((auth.jwt()->''app_metadata''->>''role'')=''admin'') WITH CHECK ((auth.jwt()->''app_metadata''->>''role'')=''admin'')',table_name);
    EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO authenticated',table_name);
    IF table_name = ANY(ARRAY['banners','categorias','marcas','configuracoes','produtos',
      'product_images','product_videos','produto_imagens','produto_videos',
      'product_variations','product_variation_options','product_stock_variations']) THEN
      EXECUTE format('CREATE POLICY vibe_public_read ON public.%I FOR SELECT TO anon,authenticated USING (true)',table_name);
      EXECUTE format('GRANT SELECT ON public.%I TO anon',table_name);
    END IF;
  END LOOP;
END $$;
CREATE POLICY vibe_public_tracking ON public.click_tracking FOR INSERT TO anon,authenticated
WITH CHECK (tipo IN ('whatsapp','view'));
GRANT INSERT ON public.click_tracking TO anon;
GRANT USAGE ON SCHEMA public TO anon,authenticated;

-- These buckets are absent in the original project; keep existing buckets intact.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('banners','banners',true,10485760,ARRAY['image/jpeg','image/png','image/webp']),
       ('marcas','marcas',true,5242880,ARRAY['image/jpeg','image/png','image/webp']),
       ('config','config',true,5242880,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT(id) DO NOTHING;
DROP POLICY IF EXISTS "Authenticated manage categoria images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Manage Objects" ON storage.objects;
DROP POLICY IF EXISTS "Permitir Upload Admin" ON storage.objects;
DROP POLICY IF EXISTS vibe_media_admin ON storage.objects;
CREATE POLICY vibe_media_admin ON storage.objects FOR ALL TO authenticated
USING (bucket_id IN ('produtos','categorias','banners','marcas','config') AND (auth.jwt()->'app_metadata'->>'role')='admin')
WITH CHECK (bucket_id IN ('produtos','categorias','banners','marcas','config') AND (auth.jwt()->'app_metadata'->>'role')='admin');
DROP POLICY IF EXISTS vibe_media_read ON storage.objects;
CREATE POLICY vibe_media_read ON storage.objects FOR SELECT TO anon,authenticated
USING (bucket_id IN ('produtos','categorias','banners','marcas','config'));
