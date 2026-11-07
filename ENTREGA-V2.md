# VIBE FITNESS V2 — candidata em homologação

Produção: https://vibefitslp.netlify.app
Banco original: `dpksjzfopgpytmfyydol` (MegaFort). Não alterado nesta preparação.
Banco de testes: `bzhrugqkwxlyfdgtenlt` (vibe-fitness-homologacao).

## Alterações

- Identidade VIBE FITNESS, logo oficial, tema claro e Instagram `vibefit_oficial1`.
- Autorização administrativa por `app_metadata.role = admin`, tanto no acesso ao painel quanto na exportação.
- Produto, fotos, vídeos e variações salvos numa única transação; falhas desfazem a operação. Edições desatualizadas são recusadas para preservar o estoque.
- Vendas baixam estoque total e da variação na mesma transação; estoque insuficiente é recusado. Repetição do mesmo registro não baixa duas vezes.
- Relatórios, estoque e exportação carregam todas as páginas de dados. Falhas nos indicadores não são apresentadas como totais válidos.
- Correção do envio de múltiplas imagens, dos botões de remoção e do foco nos campos de edição.
- Atualização de dependências e testes automatizados.

## Validação em 06/11/2026

- Prévia publicada: https://deploy-preview-1--vibefitslp.netlify.app.
- Login administrativo real, edição de produto, venda de duas unidades P e despesa validados no Chrome.
- Venda fictícia: receita R$ 200, custo R$ 80, lucro bruto R$ 120; estoque total 10 → 8. Despesa R$ 20 → resultado operacional R$ 100.
- Exportação baixada e lida: catálogo com dois produtos e linha de totais.
- Dez testes automatizados e build Next.js aprovados. Datas de despesas e cliques corrigidas para America/Sao_Paulo.
- Migração incremental ensaiada em homologação; suíte de transações aprovada também com a restrição legada de canal de venda.
- Captura local de dados das 15 tabelas públicas e esquema do original, sem alteração remota. Não contém senhas, sessões ou arquivos binários do Storage; não equivale a um backup integral do projeto.
- Envio de imagem pelo Chrome pendente: a extensão precisa de acesso a URLs de arquivos. Nova conferência móvel pendente: o navegador não aplicou a largura solicitada.
- WhatsApp pendente de confirmação: painel original e cabeçalho legado contêm números diferentes.
- Advisor de segurança da homologação: alerta de proteção contra senhas vazadas desabilitada; não declarar auditoria sem alertas. A revisão de exposição pública de custos também permanece pendente.

## Como validar

1. Entrar na prévia usando exclusivamente a conta criada no banco de homologação.
2. Cadastrar e editar um produto simples e um produto com tamanhos; conferir fotos e estoque após recarregar.
3. Registrar uma venda; conferir quantidade, total, custo, lucro e baixa de estoque.
4. Tentar vender acima do saldo; conferir recusa sem lançamento parcial.
5. Registrar uma despesa e conferir o resultado operacional do mês; exportar o catálogo.
6. Conferir vitrine, busca, filtros, paginação e navegação no celular e computador.

Os produtos com prefixo TESTE são fictícios. `/preview` é apenas uma demonstração visual, não comprova os fluxos autenticados.

## Publicação após aprovação

As prévias usam somente a homologação. O comando Netlify recusa publicação em produção sem `VIBE_V2_PRODUCTION_APPROVED=true`.
Não habilitar essa variável antes de:

- Concluir os testes autenticados e a revisão visual da prévia.
- Fazer backup verificável do banco original, incluindo esquema e dados; preservar também a referência do deploy vigente.
- Revisar e executar juntos `supabase/review/v2_production_prerequisites.sql` e `v2_atomic_operations.sql` em uma transação após os bloqueios acima serem resolvidos. Foram ensaiados na homologação; ainda não executados no original. Preservam a restrição legada de canal e adicionam controle de edição simultânea ausente no original.
- Definir `app_metadata.role=admin` somente para a conta administrativa existente confirmada. A auditoria inicial encontrou zero contas com essa role.
- Corrigir as políticas de acesso do original, inclusive as tabelas financeiras existentes, preservando seus registros.
- Validar os totais legados. A comparação inicial verificou uma venda com total de R$ 299,97; isso não comprova pagamento ou saldo bancário.
- Configurar as variáveis de produção para o banco original, publicar após aprovação e verificar os fluxos.

Não executar os scripts legados de criação e sementes em produção: eles contêm permissões amplas, atualização de vendas legadas e catálogo de exemplo.

## Reversão

Se a verificação posterior à publicação falhar, restaurar o deploy anterior no Netlify. Alterações de banco exigem o plano de reversão preparado junto à migração e o backup; voltar apenas o site não desfaz lançamentos. Não apagar vendas para reverter um deploy.
