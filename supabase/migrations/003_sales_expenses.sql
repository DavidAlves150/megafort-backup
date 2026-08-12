-- MegaFort — Vendas, despesas e indicadores financeiros
-- Compatível com a tabela de vendas já existente no projeto.

CREATE OR REPLACE FUNCTION fn_set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS vendas (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id            UUID REFERENCES produtos(id) ON DELETE SET NULL,
  quantidade            INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  valor_total           NUMERIC(12,2) NOT NULL DEFAULT 0,
  canal                 TEXT NOT NULL DEFAULT 'WhatsApp',
  anotacoes             TEXT,
  criado_em             TIMESTAMPTZ DEFAULT NOW(),
  preco_compra_unidade  NUMERIC(12,2),
  valor_venda           NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_custo           NUMERIC(12,2) NOT NULL DEFAULT 0,
  canal_venda           VARCHAR(40) NOT NULL DEFAULT 'WhatsApp',
  lucro_real            NUMERIC(12,2) NOT NULL DEFAULT 0,
  data_venda            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  observacoes           TEXT,
  atualizado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adiciona os campos do novo fluxo quando a tabela antiga já existe.
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS valor_venda NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS valor_custo NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS canal_venda VARCHAR(40) NOT NULL DEFAULT 'WhatsApp';
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS lucro_real NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS data_venda TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Migra os dados legados para os novos campos, preservando o histórico.
UPDATE vendas
SET
  valor_venda = CASE WHEN quantidade > 0 THEN COALESCE(valor_total, 0) / quantidade ELSE 0 END,
  valor_custo = COALESCE(preco_compra_unidade, 0),
  canal_venda = COALESCE(NULLIF(canal, ''), 'WhatsApp'),
  data_venda = COALESCE(criado_em, NOW()),
  observacoes = COALESCE(observacoes, anotacoes),
  lucro_real = (CASE WHEN quantidade > 0 THEN COALESCE(valor_total, 0) / quantidade ELSE 0 END - COALESCE(preco_compra_unidade, 0)) * quantidade
WHERE valor_venda = 0
  OR valor_custo = 0
  OR lucro_real = 0
  OR data_venda IS NULL
  OR observacoes IS NULL;

CREATE INDEX IF NOT EXISTS idx_vendas_data ON vendas(data_venda);
CREATE INDEX IF NOT EXISTS idx_vendas_produto ON vendas(produto_id);
CREATE INDEX IF NOT EXISTS idx_vendas_canal ON vendas(canal_venda);

CREATE TABLE IF NOT EXISTS despesas (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  descricao      VARCHAR(200) NOT NULL,
  categoria      VARCHAR(60) NOT NULL DEFAULT 'Outros',
  valor          NUMERIC(12,2) NOT NULL CHECK (valor > 0),
  data_despesa   DATE NOT NULL DEFAULT CURRENT_DATE,
  recorrente     BOOLEAN NOT NULL DEFAULT false,
  observacoes    TEXT,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_despesas_data ON despesas(data_despesa);
CREATE INDEX IF NOT EXISTS idx_despesas_categoria ON despesas(categoria);

DO $$ BEGIN
  CREATE TRIGGER trg_vendas_updated BEFORE UPDATE ON vendas
    FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_despesas_updated BEFORE UPDATE ON despesas
    FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pub_sel_vendas" ON vendas;
DROP POLICY IF EXISTS "adm_all_vendas" ON vendas;
DROP POLICY IF EXISTS "adm_all_despesas" ON despesas;

CREATE POLICY "adm_all_vendas" ON vendas FOR ALL
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "adm_all_despesas" ON despesas FOR ALL
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION fn_calcular_lucro_venda()
RETURNS TRIGGER AS $$
BEGIN
  NEW.lucro_real = (NEW.valor_venda - NEW.valor_custo) * NEW.quantidade;
  NEW.valor_total = NEW.valor_venda * NEW.quantidade;
  NEW.preco_compra_unidade = NEW.valor_custo;
  NEW.canal = NEW.canal_venda;
  NEW.anotacoes = NEW.observacoes;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calcular_lucro_venda ON vendas;
CREATE TRIGGER trg_calcular_lucro_venda
  BEFORE INSERT OR UPDATE OF quantidade, valor_venda, valor_custo, canal_venda, observacoes ON vendas
  FOR EACH ROW EXECUTE FUNCTION fn_calcular_lucro_venda();

NOTIFY pgrst, 'reload schema';
