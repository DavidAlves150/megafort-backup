# Migração 003 — Resultado no Supabase

Em 12 de agosto de 2026, a migração de Vendas e Despesas foi aplicada com sucesso no projeto Supabase MegaFort.

A tabela legada `vendas` já existia com os campos `valor_total`, `canal`, `anotacoes` e `preco_compra_unidade`. A migração foi ajustada para preservar estes dados, criar os campos padronizados `valor_venda`, `valor_custo`, `canal_venda`, `lucro_real`, `data_venda`, `observacoes` e `atualizado_em`, e sincronizar os campos legados por meio de trigger.

Também foram criadas a tabela `despesas`, os índices para consultas financeiras, políticas RLS administrativas e as funções/triggers necessárias para atualizar timestamps e calcular lucro por venda.

O SQL Editor do Supabase retornou: `Success. No rows returned`.

## Status do deploy

O painel do Netlify foi aberto em 12 de agosto de 2026 e exige autenticação. Para concluir o deploy seguro, será necessário entrar no Netlify e cadastrar as variáveis públicas `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` nas configurações do site. A chave privilegiada do Supabase foi removida do arquivo versionado e não deve ser cadastrada, pois o código atual não a utiliza.
