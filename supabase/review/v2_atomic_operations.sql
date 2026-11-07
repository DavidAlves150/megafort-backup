-- Reviewed and tested against homologation only. Do not run legacy seed scripts in production.
-- Requires the V2 tables. Production rollout requires a separate schema comparison and backup.
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS option_id uuid;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS variacao_descricao text;

CREATE OR REPLACE FUNCTION public.vibe_sale_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE p public.produtos; remaining integer; label text;
BEGIN
  IF (auth.jwt()->'app_metadata'->>'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Acesso administrativo necessário' USING ERRCODE = '42501';
  END IF;
  IF NEW.quantidade IS NULL OR NEW.quantidade < 1 OR NEW.valor_venda IS NULL OR NEW.valor_custo IS NULL
    OR NEW.valor_venda < 0 OR NEW.valor_custo < 0
    OR NEW.valor_venda::text IN ('NaN','Infinity','-Infinity')
    OR NEW.valor_custo::text IN ('NaN','Infinity','-Infinity') THEN
    RAISE EXCEPTION 'Quantidade ou valores inválidos';
  END IF;
  SELECT * INTO p FROM public.produtos WHERE id = NEW.produto_id FOR UPDATE;
  IF NOT FOUND OR p.ativo IS DISTINCT FROM true THEN RAISE EXCEPTION 'Produto indisponível'; END IF;
  IF coalesce(p.estoque,0) < NEW.quantidade THEN RAISE EXCEPTION 'Estoque insuficiente'; END IF;
  IF EXISTS (SELECT 1 FROM public.product_variations WHERE produto_id=p.id) THEN
    SELECT s.estoque, v.nome || ': ' || o.valor INTO remaining, label
    FROM public.product_stock_variations s
    JOIN public.product_variation_options o ON o.id=s.option_id
    JOIN public.product_variations v ON v.id=o.variation_id AND v.produto_id=p.id
    WHERE s.produto_id=p.id AND s.option_id=NEW.option_id FOR UPDATE OF s;
    IF NOT FOUND THEN RAISE EXCEPTION 'Selecione uma variação do produto'; END IF;
    IF remaining < NEW.quantidade THEN RAISE EXCEPTION 'Estoque da variação insuficiente'; END IF;
    UPDATE public.product_stock_variations SET estoque=estoque-NEW.quantidade
      WHERE produto_id=p.id AND option_id=NEW.option_id;
    NEW.variacao_descricao := label;
  ELSIF NEW.option_id IS NOT NULL THEN
    RAISE EXCEPTION 'Variação inválida para este produto';
  END IF;
  UPDATE public.produtos SET estoque=estoque-NEW.quantidade WHERE id=p.id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_vibe_sale_stock ON public.vendas;
CREATE TRIGGER trg_vibe_sale_stock BEFORE INSERT ON public.vendas
  FOR EACH ROW EXECUTE FUNCTION public.vibe_sale_stock();
REVOKE EXECUTE ON FUNCTION public.vibe_sale_stock() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.vibe_save_product(
  p_id uuid, p_expected_updated_at timestamptz, p_data jsonb,
  p_images jsonb, p_videos jsonb, p_variations jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  target uuid; current_stamp timestamptz; v jsonb; o jsonb;
  variation_id uuid; option_id uuid; position integer; option_position integer;
  stock integer; price numeric; cost numeric; promo numeric;
BEGIN
  IF (auth.jwt()->'app_metadata'->>'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Acesso administrativo necessário' USING ERRCODE='42501';
  END IF;
  IF jsonb_typeof(p_images) IS DISTINCT FROM 'array' OR jsonb_typeof(p_videos) IS DISTINCT FROM 'array'
    OR jsonb_typeof(p_variations) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Dados incompletos'; END IF;
  price := (p_data->>'preco_venda')::numeric;
  cost := (p_data->>'preco_compra')::numeric;
  promo := (p_data->>'preco_promocional')::numeric;
  stock := (p_data->>'estoque')::integer;
  IF length(trim(p_data->>'nome')) < 2 OR p_data->>'nome' IS NULL
    OR price IS NULL OR cost IS NULL OR stock IS NULL OR price <= 0 OR cost < 0 OR stock < 0
    OR price::text IN ('NaN','Infinity','-Infinity') OR cost::text IN ('NaN','Infinity','-Infinity')
    OR (promo IS NOT NULL AND (promo <= 0 OR promo >= price OR promo::text IN ('NaN','Infinity','-Infinity'))) THEN
    RAISE EXCEPTION 'Confira nome, preços e estoque';
  END IF;
  IF jsonb_array_length(p_variations)>0 THEN
    SELECT coalesce(sum((opt->>'estoque')::integer),0) INTO stock
      FROM jsonb_array_elements(p_variations) vr,
      LATERAL jsonb_array_elements(vr->'opcoes') opt;
  END IF;
  IF p_id IS NOT NULL THEN
    SELECT atualizado_em INTO current_stamp FROM public.produtos WHERE id=p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Produto não encontrado'; END IF;
    IF current_stamp IS DISTINCT FROM p_expected_updated_at THEN
      RAISE EXCEPTION 'Este produto mudou. Recarregue a página antes de salvar para preservar o estoque.';
    END IF;
    target := p_id;
  ELSE
    INSERT INTO public.produtos(nome,slug) VALUES(p_data->>'nome',p_data->>'slug') RETURNING id INTO target;
  END IF;
  UPDATE public.produtos SET nome=p_data->>'nome', slug=p_data->>'slug',
    descricao=p_data->>'descricao', descricao_curta=p_data->>'descricao_curta',
    preco_compra=cost, preco_venda=price, preco_promocional=promo, estoque=stock,
    sku=p_data->>'sku', categoria_id=(p_data->>'categoria_id')::uuid,
    marca_id=(p_data->>'marca_id')::uuid, em_destaque=coalesce((p_data->>'em_destaque')::boolean,false),
    em_promocao=coalesce((p_data->>'em_promocao')::boolean,false), ativo=coalesce((p_data->>'ativo')::boolean,true)
    WHERE id=target;
  DELETE FROM public.product_images WHERE produto_id=target;
  INSERT INTO public.product_images(produto_id,url,ordem,is_principal)
    SELECT target,value,ordinality-1,ordinality=1 FROM jsonb_array_elements_text(p_images) WITH ORDINALITY;
  DELETE FROM public.product_videos WHERE produto_id=target;
  INSERT INTO public.product_videos(produto_id,url,ordem)
    SELECT target,value,ordinality-1 FROM jsonb_array_elements_text(p_videos) WITH ORDINALITY;
  DELETE FROM public.product_variations WHERE produto_id=target;
  position:=0;
  FOR v IN SELECT value FROM jsonb_array_elements(p_variations) LOOP
    IF coalesce(length(trim(v->>'nome')),0)=0 OR coalesce(jsonb_array_length(v->'opcoes'),0)=0 THEN
      RAISE EXCEPTION 'Variação incompleta';
    END IF;
    INSERT INTO public.product_variations(produto_id,nome,ordem)
      VALUES(target,v->>'nome',position) RETURNING id INTO variation_id;
    option_position:=0;
    FOR o IN SELECT value FROM jsonb_array_elements(v->'opcoes') LOOP
      IF coalesce(length(trim(o->>'valor')),0)=0 OR (o->>'estoque') IS NULL OR (o->>'estoque')::integer<0 THEN
        RAISE EXCEPTION 'Opção ou estoque inválido';
      END IF;
      INSERT INTO public.product_variation_options(variation_id,valor,ordem)
        VALUES(variation_id,o->>'valor',option_position) RETURNING id INTO option_id;
      INSERT INTO public.product_stock_variations(produto_id,option_id,estoque)
        VALUES(target,option_id,(o->>'estoque')::integer);
      option_position:=option_position+1;
    END LOOP;
    position:=position+1;
  END LOOP;
  RETURN target;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.vibe_save_product(uuid,timestamptz,jsonb,jsonb,jsonb,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vibe_save_product(uuid,timestamptz,jsonb,jsonb,jsonb,jsonb) TO authenticated;
ALTER FUNCTION public.fn_set_atualizado_em() SET search_path = '';
ALTER FUNCTION public.fn_calcular_lucro_venda() SET search_path = '';
DO $$ BEGIN
  IF to_regprocedure('public.fn_inc_views()') IS NOT NULL THEN
    ALTER FUNCTION public.fn_inc_views() SET search_path = public;
  END IF;
END $$;
NOTIFY pgrst, 'reload schema';
