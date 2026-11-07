-- Run exclusively in bzhrugqkwxlyfdgtenlt. Every fixture is rolled back.
BEGIN;
SELECT set_config('request.jwt.claims','{"role":"authenticated","app_metadata":{"role":"admin"}}',true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE p uuid; stamp timestamptz; sale uuid := gen_random_uuid(); opt uuid; failed boolean;
  payload jsonb := '{"nome":"TESTE V2","slug":"teste-v2-atomic-suite","preco_compra":40,"preco_venda":100,"estoque":10}';
BEGIN
  p := public.vibe_save_product(null,null,payload,'["https://example.com/original.jpg"]','[]','[]');
  SELECT atualizado_em INTO stamp FROM public.produtos WHERE id=p;
  INSERT INTO public.vendas(id,produto_id,quantidade,valor_venda,valor_custo) VALUES(sale,p,3,90,40);
  IF NOT EXISTS(SELECT 1 FROM public.produtos WHERE id=p AND estoque=7) THEN RAISE EXCEPTION 'FAIL stock'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.vendas WHERE id=sale AND valor_total=270 AND lucro_real=150) THEN RAISE EXCEPTION 'FAIL totals'; END IF;
  BEGIN
    INSERT INTO public.vendas(id,produto_id,quantidade,valor_venda,valor_custo) VALUES(sale,p,3,90,40);
    RAISE EXCEPTION 'FAIL duplicate accepted';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  IF NOT EXISTS(SELECT 1 FROM public.produtos WHERE id=p AND estoque=7) THEN RAISE EXCEPTION 'FAIL retry deducted twice'; END IF;
  failed:=false;
  BEGIN
    INSERT INTO public.vendas(produto_id,quantidade,valor_venda,valor_custo) VALUES(p,8,90,40);
  EXCEPTION WHEN raise_exception THEN failed:=true; END;
  IF NOT failed THEN RAISE EXCEPTION 'FAIL oversale'; END IF;
  failed:=false;
  BEGIN
    PERFORM public.vibe_save_product(p,'2000-01-01',payload,'[]','[]','[]');
  EXCEPTION WHEN raise_exception THEN failed:=true; END;
  IF NOT failed THEN RAISE EXCEPTION 'FAIL stale edit'; END IF;
  SELECT atualizado_em INTO stamp FROM public.produtos WHERE id=p;
  failed:=false;
  BEGIN
    PERFORM public.vibe_save_product(p,stamp,payload,'[]','[]','[{"nome":"Tamanho","opcoes":[{"valor":"P","estoque":-1}]}]');
  EXCEPTION WHEN raise_exception THEN failed:=true; END;
  IF NOT failed OR NOT EXISTS(SELECT 1 FROM public.product_images WHERE produto_id=p AND url='https://example.com/original.jpg')
    OR NOT EXISTS(SELECT 1 FROM public.produtos WHERE id=p AND estoque=7) THEN RAISE EXCEPTION 'FAIL edit rollback'; END IF;
  PERFORM public.vibe_save_product(p,stamp,payload,'["https://example.com/original.jpg"]','[]','[{"nome":"Tamanho","opcoes":[{"valor":"P","estoque":2},{"valor":"M","estoque":4}]}]');
  SELECT s.option_id INTO opt FROM public.product_stock_variations s JOIN public.product_variation_options o ON o.id=s.option_id WHERE s.produto_id=p AND o.valor='P';
  INSERT INTO public.vendas(produto_id,option_id,quantidade,valor_venda,valor_custo) VALUES(p,opt,2,100,40);
  IF NOT EXISTS(SELECT 1 FROM public.produtos WHERE id=p AND estoque=4)
    OR NOT EXISTS(SELECT 1 FROM public.product_stock_variations WHERE option_id=opt AND estoque=0)
    OR NOT EXISTS(SELECT 1 FROM public.vendas WHERE option_id=opt AND variacao_descricao='Tamanho: P') THEN RAISE EXCEPTION 'FAIL variant sale'; END IF;
  failed:=false;
  BEGIN
    INSERT INTO public.vendas(produto_id,option_id,quantidade,valor_venda,valor_custo) VALUES(p,opt,1,100,40);
  EXCEPTION WHEN raise_exception THEN failed:=true; END;
  IF NOT failed THEN RAISE EXCEPTION 'FAIL variant oversale'; END IF;
  PERFORM set_config('request.jwt.claims','{"role":"authenticated","app_metadata":{},"user_metadata":{"role":"admin"}}',true);
  IF EXISTS(SELECT 1 FROM public.vendas) THEN RAISE EXCEPTION 'FAIL ordinary account read'; END IF;
  failed:=false;
  BEGIN
    PERFORM public.vibe_save_product(null,null,payload,'[]','[]','[]');
  EXCEPTION WHEN insufficient_privilege THEN failed:=true; END;
  IF NOT failed THEN RAISE EXCEPTION 'FAIL ordinary account write'; END IF;
END $$;
RESET ROLE;
SELECT 'PASS: totals, stock, duplicate retry, oversale, stale edit, rollback, variations, authorization' AS result;
ROLLBACK;
