BEGIN;
SET LOCAL ROLE anon;
DO $$ DECLARE denied boolean:=false; BEGIN
  PERFORM id,nome,preco_venda FROM public.produtos WHERE ativo=true;
  BEGIN
    PERFORM preco_compra FROM public.produtos;
  EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'FAIL public purchase cost exposed'; END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"role":"authenticated","app_metadata":{},"user_metadata":{"role":"admin"}}',true);
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM public.produtos) THEN RAISE EXCEPTION 'FAIL ordinary account sees private product rows'; END IF;
END $$;
SELECT set_config('request.jwt.claims','{"role":"authenticated","app_metadata":{"role":"admin"}}',true);
DO $$ BEGIN
  IF NOT EXISTS(SELECT preco_compra FROM public.produtos) THEN RAISE EXCEPTION 'FAIL admin product access'; END IF;
END $$;
RESET ROLE;
SELECT 'PASS: public catalog fields readable, costs denied, ordinary account denied, admin allowed' AS result;
ROLLBACK;
