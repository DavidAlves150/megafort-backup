# 🚀 DEPLOY — MegaFort Suplementos v2
## GitHub + Netlify + Supabase

---

## PASSO 1 — SUPABASE

1. Acesse https://supabase.com → **New project**
   - Nome: `megafort-v2`
   - Região: **South America (São Paulo)**
   - Anote a senha do banco

2. **SQL Editor → New query** → cole todo o conteúdo de:
   `supabase/migrations/001_schema_v2.sql`
   → clique **Run** → aguarde "Success"

3. **Authentication → Users → Add user**
   - Email: seu email de admin
   - Password: senha forte
   → **Create user**

4. **Settings → API** → copie:
   - `Project URL`
   - `anon/public` key
   - `service_role` key (clique em Reveal)

---

## PASSO 2 — PROJETO LOCAL

```bash
npm install
```

Edite `.env.local` com os dados do Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_WHATSAPP=5598885916645
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Teste o build:
```bash
npm run build
```
✅ Se aparecer "Compiled successfully" — pronto para deploy!

---

## PASSO 3 — GITHUB

```bash
git init
git add .
git commit -m "MegaFort v2 — deploy inicial"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/megafort-v2.git
git push -u origin main
```

---

## PASSO 4 — NETLIFY

1. https://netlify.com → **Add new site → Import from Git**
2. Conecte ao GitHub → selecione `megafort-v2`
3. Configurações (Netlify detecta automaticamente):
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`

4. **Antes de clicar Deploy → Environment variables:**

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` |
| `NEXT_PUBLIC_WHATSAPP` | `5598885916645` |
| `NEXT_PUBLIC_SITE_URL` | `https://SEU-SITE.netlify.app` |
| `NODE_VERSION` | `20` |

5. Clique **Deploy site** → aguarde 3-8 min → ✅ Published!

---

## PASSO 5 — SUPABASE: URL do Site

1. Supabase → **Authentication → URL Configuration**
2. **Site URL:** `https://SEU-SITE.netlify.app`
3. **Redirect URLs:** `https://SEU-SITE.netlify.app/**`
4. → **Save**

---

## CHECKLIST FINAL

- [ ] Build local sem erros (`npm run build`)
- [ ] SQL executado no Supabase
- [ ] Usuário admin criado no Supabase
- [ ] Variáveis de ambiente configuradas no Netlify
- [ ] Deploy concluído (✅ Published)
- [ ] URL do site salva no Supabase Authentication
- [ ] Login admin funciona: `/admin/login`
- [ ] Produto cadastrado aparece na loja pública
- [ ] Botão WhatsApp abre com mensagem correta
- [ ] Botão flutuante WhatsApp visível

---

## ACESSO ADMIN

| Item | URL/Info |
|---|---|
| Loja | `https://SEU-SITE.netlify.app` |
| Admin | `https://SEU-SITE.netlify.app/admin/login` |
| Catálogo | `https://SEU-SITE.netlify.app/catalogo` |

---

## MANUTENÇÃO ZERO

- **Netlify** faz redeploy automático a cada `git push`
- **Supabase** com backup diário automático
- Cores, WhatsApp, textos: Admin → Configurações
- Exportar catálogo: Admin → Relatórios → Exportar Excel

---

*MegaFort Suplementos v2 — Sistema profissional de catálogo online*
