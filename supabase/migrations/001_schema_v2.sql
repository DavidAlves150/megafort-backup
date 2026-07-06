-- =====================================================
-- MegaFort Suplementos v2 — Schema Completo
-- Execute no Supabase: SQL Editor → Cole tudo → Run
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- TABELA: categorias
-- =====================================================
CREATE TABLE IF NOT EXISTS categorias (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome          VARCHAR(100) NOT NULL,
  slug          VARCHAR(100) UNIQUE NOT NULL,
  descricao     TEXT,
  icone         VARCHAR(10) DEFAULT '📦',
  imagem_url    TEXT,
  cor           VARCHAR(20) DEFAULT '#00FF41',
  ordem         INTEGER DEFAULT 0,
  ativa         BOOLEAN DEFAULT true,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: marcas (brands)
-- =====================================================
CREATE TABLE IF NOT EXISTS marcas (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome          VARCHAR(100) NOT NULL,
  slug          VARCHAR(100) UNIQUE NOT NULL,
  descricao     TEXT,
  logo_url      TEXT,
  site_url      TEXT,
  ativa         BOOLEAN DEFAULT true,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: produtos
-- =====================================================
CREATE TABLE IF NOT EXISTS produtos (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome              VARCHAR(200) NOT NULL,
  slug              VARCHAR(200) UNIQUE NOT NULL,
  descricao         TEXT,
  descricao_curta   VARCHAR(500),
  preco_compra      DECIMAL(10,2) NOT NULL DEFAULT 0,
  preco_venda       DECIMAL(10,2) NOT NULL DEFAULT 0,
  preco_promocional DECIMAL(10,2),
  estoque           INTEGER NOT NULL DEFAULT 0,
  sku               VARCHAR(100),
  categoria_id      UUID REFERENCES categorias(id) ON DELETE SET NULL,
  marca_id          UUID REFERENCES marcas(id) ON DELETE SET NULL,
  em_destaque       BOOLEAN DEFAULT false,
  em_promocao       BOOLEAN DEFAULT false,
  ativo             BOOLEAN DEFAULT true,
  visualizacoes     INTEGER DEFAULT 0,
  criado_em         TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em     TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_produtos_fts       ON produtos USING gin(to_tsvector('portuguese', nome || ' ' || COALESCE(descricao, '')));
CREATE INDEX IF NOT EXISTS idx_produtos_categoria  ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_marca      ON produtos(marca_id);
CREATE INDEX IF NOT EXISTS idx_produtos_destaque   ON produtos(em_destaque) WHERE em_destaque = true;
CREATE INDEX IF NOT EXISTS idx_produtos_promocao   ON produtos(em_promocao) WHERE em_promocao = true;
CREATE INDEX IF NOT EXISTS idx_produtos_slug       ON produtos(slug);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo      ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_estoque    ON produtos(estoque);

-- =====================================================
-- TABELA: product_images
-- =====================================================
CREATE TABLE IF NOT EXISTS product_images (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id   UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  ordem        INTEGER DEFAULT 0,
  is_principal BOOLEAN DEFAULT false,
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_images_produto ON product_images(produto_id);

-- =====================================================
-- TABELA: product_videos
-- =====================================================
CREATE TABLE IF NOT EXISTS product_videos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id    UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  thumbnail_url TEXT,
  tipo          VARCHAR(10) DEFAULT 'mp4',
  ordem         INTEGER DEFAULT 0,
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videos_produto ON product_videos(produto_id);

-- =====================================================
-- TABELA: banners
-- =====================================================
CREATE TABLE IF NOT EXISTS banners (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo            VARCHAR(200),
  subtitulo         VARCHAR(300),
  imagem_url        TEXT NOT NULL,
  imagem_mobile_url TEXT,
  link_url          TEXT,
  botao_texto       VARCHAR(100),
  ordem             INTEGER DEFAULT 0,
  ativo             BOOLEAN DEFAULT true,
  criado_em         TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em     TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: click_tracking (analytics)
-- =====================================================
CREATE TABLE IF NOT EXISTS click_tracking (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
  tipo       VARCHAR(30) DEFAULT 'whatsapp',
  ip_hash    VARCHAR(64),
  user_agent TEXT,
  criado_em  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clicks_produto  ON click_tracking(produto_id);
CREATE INDEX IF NOT EXISTS idx_clicks_tipo     ON click_tracking(tipo);
CREATE INDEX IF NOT EXISTS idx_clicks_data     ON click_tracking(criado_em);

-- =====================================================
-- TABELA: configuracoes
-- =====================================================
CREATE TABLE IF NOT EXISTS configuracoes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chave         VARCHAR(100) UNIQUE NOT NULL,
  valor         TEXT,
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FUNÇÃO: atualizar timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION fn_set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN NEW.atualizado_em = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_cat_updated  BEFORE UPDATE ON categorias  FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();
  CREATE TRIGGER trg_marc_updated BEFORE UPDATE ON marcas       FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();
  CREATE TRIGGER trg_prod_updated BEFORE UPDATE ON produtos     FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();
  CREATE TRIGGER trg_ban_updated  BEFORE UPDATE ON banners      FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- FUNÇÃO: incrementar visualizações
-- =====================================================
CREATE OR REPLACE FUNCTION fn_inc_views()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo = 'view' THEN
    UPDATE produtos SET visualizacoes = visualizacoes + 1 WHERE id = NEW.produto_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_inc_views AFTER INSERT ON click_tracking
    FOR EACH ROW EXECUTE FUNCTION fn_inc_views();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- RLS — Row Level Security
-- =====================================================
ALTER TABLE categorias      ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_videos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners          ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_tracking   ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes    ENABLE ROW LEVEL SECURITY;

-- Drops para re-executar sem erro
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename; END LOOP;
END $$;

-- CATEGORIAS
CREATE POLICY "pub_sel_cat"  ON categorias FOR SELECT USING (ativa = true);
CREATE POLICY "adm_all_cat"  ON categorias FOR ALL   USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
-- MARCAS
CREATE POLICY "pub_sel_marc" ON marcas     FOR SELECT USING (ativa = true);
CREATE POLICY "adm_all_marc" ON marcas     FOR ALL   USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
-- PRODUTOS
CREATE POLICY "pub_sel_prod" ON produtos   FOR SELECT USING (ativo = true);
CREATE POLICY "adm_all_prod" ON produtos   FOR ALL   USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
-- IMAGES
CREATE POLICY "pub_sel_img"  ON product_images FOR SELECT USING (true);
CREATE POLICY "adm_all_img"  ON product_images FOR ALL   USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
-- VIDEOS
CREATE POLICY "pub_sel_vid"  ON product_videos FOR SELECT USING (true);
CREATE POLICY "adm_all_vid"  ON product_videos FOR ALL   USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
-- BANNERS
CREATE POLICY "pub_sel_ban"  ON banners         FOR SELECT USING (ativo = true);
CREATE POLICY "adm_all_ban"  ON banners         FOR ALL   USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
-- CLICK TRACKING
CREATE POLICY "pub_ins_clk"  ON click_tracking  FOR INSERT WITH CHECK (true);
CREATE POLICY "adm_sel_clk"  ON click_tracking  FOR SELECT USING (auth.uid() IS NOT NULL);
-- CONFIGS
CREATE POLICY "pub_sel_cfg"  ON configuracoes   FOR SELECT USING (true);
CREATE POLICY "adm_all_cfg"  ON configuracoes   FOR ALL   USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('produtos',   'produtos',   true, 52428800, ARRAY['image/jpeg','image/jpg','image/png','image/webp','video/mp4','video/webm','video/quicktime']),
  ('banners',    'banners',    true, 10485760, ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
  ('marcas',     'marcas',     true, 5242880,  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/svg+xml']),
  ('categorias', 'categorias', true, 5242880,  ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
  ('config',     'config',     true, 5242880,  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies (limpeza e recriação)
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'storage' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.' || r.tablename;
  END LOOP;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "pub_read_all"  ON storage.objects FOR SELECT USING (bucket_id IN ('produtos','banners','marcas','categorias','config'));
CREATE POLICY "adm_insert"    ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('produtos','banners','marcas','categorias','config') AND auth.uid() IS NOT NULL);
CREATE POLICY "adm_update"    ON storage.objects FOR UPDATE USING (bucket_id IN ('produtos','banners','marcas','categorias','config') AND auth.uid() IS NOT NULL);
CREATE POLICY "adm_delete"    ON storage.objects FOR DELETE USING (bucket_id IN ('produtos','banners','marcas','categorias','config') AND auth.uid() IS NOT NULL);

-- =====================================================
-- SEED: Categorias iniciais
-- =====================================================
INSERT INTO categorias (nome, slug, descricao, icone, cor, ordem) VALUES
  ('Whey Protein',      'whey-protein',    'Proteínas e Whey de alta qualidade',     '💪', '#00FF41', 1),
  ('Creatina',          'creatina',        'Creatinas monohidratada e micronizada',  '⚡', '#00CC34', 2),
  ('Pré-Treino',        'pre-treino',      'Pré-treinos para máximo desempenho',     '🔥', '#FF4500', 3),
  ('Roupas Femininas',  'roupas-femininas','Moda fitness e casual feminina',         '👗', '#FF69B4', 4),
  ('Moda Fitness',      'moda-fitness',    'Leggings, tops e conjuntos fitness',     '🩱', '#9B59B6', 5),
  ('Calçados',          'calcados',        'Tênis e calçados para academia',         '👟', '#3498DB', 6),
  ('Acessórios',        'acessorios',      'Luvas, cintas, coqueteleiras e mais',    '🎽', '#E67E22', 7),
  ('Promoções',         'promocoes',       'Produtos em oferta especial',            '🏷️', '#E74C3C', 8)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- SEED: Marcas iniciais
-- =====================================================
INSERT INTO marcas (nome, slug, descricao) VALUES
  ('Growth Supplements', 'growth',         'Suplementos Growth de alta qualidade'),
  ('Max Titanium',       'max-titanium',   'Força e performance Max Titanium'),
  ('Integral Médica',    'integral-medica','Nutrição esportiva Integral Médica'),
  ('Darkness',           'darkness',       'Suplementos Darkness premium'),
  ('Dux Nutrition',      'dux',            'Dux Nutrition — ciência e performance'),
  ('Adaptogen',          'adaptogen',      'Adaptogen suplementos naturais')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- SEED: Configurações padrão
-- =====================================================
INSERT INTO configuracoes (chave, valor) VALUES
  ('nome_empresa',     'MegaFort Suplementos'),
  ('slogan',           'A melhor loja de suplementos e moda da região'),
  ('cidade',           'Santa Luzia do Paruá - Maranhão'),
  ('whatsapp',         '5598885916645'),
  ('instagram',        'https://www.instagram.com/megafort_suplementos'),
  ('instagram_user',   'megafort_suplementos'),
  ('horario_semana',   'Segunda a Sexta: 08h às 18h'),
  ('horario_sabado',   'Sábado: 08h às 11h30'),
  ('cor_primaria',     '#00FF41'),
  ('cor_secundaria',   '#000000'),
  ('cor_botao',        '#00FF41'),
  ('logo_url',         ''),
  ('sobre_historia',   'A MegaFort Suplementos nasceu com o objetivo de oferecer os melhores produtos de suplementação e moda fitness para os moradores de Santa Luzia do Paruá e região, com qualidade, preço justo e atendimento personalizado.'),
  ('sobre_missao',     'Proporcionar saúde, bem-estar e estilo com os melhores produtos do mercado.'),
  ('sobre_valores',    'Qualidade, Honestidade, Comprometimento e Respeito ao cliente.'),
  ('meta_titulo',      'MegaFort Suplementos - Suplementos e Moda Fitness em Santa Luzia do Paruá'),
  ('meta_descricao',   'Whey Protein, Creatina, Pré-Treino, Roupas Fitness e muito mais em Santa Luzia do Paruá - MA. Compre pelo WhatsApp!')
ON CONFLICT (chave) DO NOTHING;
