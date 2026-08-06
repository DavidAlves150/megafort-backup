-- =====================================================
-- TABELA: product_variations (Tipos de Variação)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_variations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id    UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  nome          VARCHAR(100) NOT NULL, -- Ex: "Tamanho", "Cor"
  ordem         INTEGER DEFAULT 0,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_variations_produto ON product_variations(produto_id);

-- =====================================================
-- TABELA: product_variation_options (Opções de Variação)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_variation_options (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variation_id  UUID NOT NULL REFERENCES product_variations(id) ON DELETE CASCADE,
  valor         VARCHAR(100) NOT NULL, -- Ex: "35", "P", "Azul"
  ordem         INTEGER DEFAULT 0,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_variation_options_variation ON product_variation_options(variation_id);

-- =====================================================
-- TABELA: product_stock_variations (Estoque por Variação)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_stock_variations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id    UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  option_id     UUID NOT NULL REFERENCES product_variation_options(id) ON DELETE CASCADE,
  estoque       INTEGER NOT NULL DEFAULT 0,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(produto_id, option_id) -- Garante que um produto tenha apenas um estoque para uma opção específica
);

CREATE INDEX IF NOT EXISTS idx_product_stock_variations_produto ON product_stock_variations(produto_id);
CREATE INDEX IF NOT EXISTS idx_product_stock_variations_option ON product_stock_variations(option_id);

-- =====================================================
-- RLS para as novas tabelas
-- =====================================================
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variation_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_stock_variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pub_sel_prod_variations" ON product_variations FOR SELECT USING (true);
CREATE POLICY "adm_all_prod_variations" ON product_variations FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "pub_sel_prod_variation_options" ON product_variation_options FOR SELECT USING (true);
CREATE POLICY "adm_all_prod_variation_options" ON product_variation_options FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "pub_sel_prod_stock_variations" ON product_stock_variations FOR SELECT USING (true);
CREATE POLICY "adm_all_prod_stock_variations" ON product_stock_variations FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- FUNÇÃO: atualizar timestamp para novas tabelas
-- =====================================================
DO $$ BEGIN
  CREATE TRIGGER trg_prod_var_updated BEFORE UPDATE ON product_variations FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();
  CREATE TRIGGER trg_prod_var_opt_updated BEFORE UPDATE ON product_variation_options FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();
  CREATE TRIGGER trg_prod_stock_var_updated BEFORE UPDATE ON product_stock_variations FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
