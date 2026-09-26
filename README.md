# Brutus Matão — aplicação de pedidos

Projeto Next.js/React/TypeScript para prévia local. **Não é uma operação publicada.** O nome, a cidade e o Instagram vieram do briefing; o vídeo de abertura foi fornecido para o projeto e é **conceitual, não é um produto confirmado da Brutus**. O catálogo inclui os 12 lanches da imagem enviada; os combos foram retirados a pedido do responsável. Dez lanches usam fotos individuais aprimoradas e dois mantêm o recorte do cardápio como fallback. Endereço, horários, meios de pagamento e contatos continuam dependentes da configuração. A marca deve aprovar a identidade, fotos e conteúdo antes da publicação.

## Primeiros passos no VS Code

1. Descompacte o projeto, abra a pasta `brutus-matao` com **Arquivo → Abrir pasta** no VS Code e abra um terminal integrado (**Terminal → Novo terminal**).
2. Instale **Node.js 20.9+** e execute `npm ci` na raiz da pasta.
3. Execute `npm run dev` e abra **http://localhost:3000**. Sem `.env.local` ou banco, a home e o cardápio mostram os produtos enviados; o carrinho gera a mensagem completa e envia o cliente para o WhatsApp oficial da Brutus: **(16) 99316-5102**. O envio da mensagem não cobra nem confirma o pedido automaticamente.
4. Para usar banco e painel, copie `.env.example` para `.env.local` e preencha as credenciais do **seu projeto Supabase de teste**, sem colocar segredos no código. Em Windows PowerShell: `Copy-Item .env.example .env.local`; em macOS/Linux: `cp .env.example .env.local`.
5. Rode as migrations de `supabase/migrations/` em ordem de nome (001 e depois 002) no SQL Editor de um **projeto Supabase novo e isolado**. A migration cria o catálogo, a operação, pedidos, pagamentos, índices, políticas RLS e o bucket. Depois configure `DATABASE_URL` com a string de conexão PostgreSQL do mesmo projeto, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `TRACKING_SECRET` (32+ caracteres aleatórios). Reinicie `npm run dev` após alterar variáveis.
6. Execute `supabase/cardapio-brutus.sql` para importar os 12 lanches e remover os combos antigos, caso já tenham sido importados. Depois crie um usuário de equipe pelo **Supabase Auth** e, somente no SQL Editor administrativo, vincule seu UUID: `insert into public.staff_members(user_id,role,active) values ('UUID_DA_CONTA_AUTH','admin',true);`. Nenhum cadastro público concede acesso ao painel. Faça login em **http://localhost:3000/admin/login**.
7. No painel, cadastre apenas produtos, categorias, escolhas e mídia aprovados. Configure horários, modalidades, áreas/valores e formas de pagamento confirmadas. Mantenha “Receber pedidos agora” desligado até terminar os testes e a autorização da Brutus.

`.env.example` não contém valores secretos. `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TRACKING_SECRET`, token Mercado Pago e segredo do webhook **só existem no servidor**. `.env.local` está excluído do pacote de distribuição e deve ficar fora do controle de versão. Para um servidor real, use HTTPS, armazenamento de segredos e projeto Supabase próprios da empresa.

### Dados fictícios isolados

O estado vazio é o padrão. `supabase/seed.dev.sql` contém **um único produto claramente marcado DEMO** e desativado para publicação. Só execute esse arquivo num projeto Supabase descartável de teste, na **mesma sessão SQL**, após `SET app.brutus_environment = 'development';`. O script bloqueia a execução sem essa opção. Ele não abre a loja nem ativa pagamentos; uma prova completa exige habilitar explicitamente os registros fictícios apenas nesse ambiente isolado, configurar horários e depois descartar a base de teste. Não copie o seed para a base comercial.

## Arquitetura e fases executadas

| Fase | Arquivos principais | Responsabilidade |
| --- | --- | --- |
| 1. Identidade e home | `src/app/page.tsx`, `src/components/site/*`, `src/app/globals.css` | Marca provisória, hero com vídeo automático, sem áudio e com botão de pausa, seções condicionais e tokens CSS. |
| 2. Cardápio | `src/app/cardapio/*`, `src/components/menu/*`, `src/lib/db/public.ts` | Consultas ao PostgreSQL, filtros, busca, preço e opções publicados. |
| 3. Carrinho | `src/components/cart/CartProvider.tsx` | Persistência local, edição, remoção e subtotal visível. |
| 4. Checkout e pedidos | `src/components/checkout/*`, `src/app/api/{quote,orders}/*`, `src/lib/orders/core.ts` | Validação, preço no servidor, taxas, transação de pedido e idempotência. |
| 5. Pagamentos | `src/lib/payments/mercadopago.ts`, `src/app/api/payments/start/route.ts`, `src/app/api/webhooks/mercadopago/route.ts` | Checkout Pro hospedado, assinatura, consulta oficial e eventos deduplicados. |
| 6. Acompanhamento | `src/app/pedido/[referencia]/*`, `src/components/order/*` | Consulta com token privado expirável; status e histórico atualizados a cada 15 segundos. |
| 7. Painel | `src/app/admin/*`, `src/app/api/admin/*` | Auth da equipe, CRUD, operação, pedidos a cada 12 segundos, ficha imprimível, relatórios. |
| 8. Banco, segurança, verificação | `supabase/migrations/*`, `tests/*`, `scripts/*` | Constraints, RLS, seed isolado, testes de dinheiro/permissão e build. |

Um **componente** é uma função React que devolve uma parte da interface. `import` traz uma função, um tipo ou um estilo de outro arquivo. Um `div` agrupa elementos para organizar layout; para conteúdo com significado usam-se também `header`, `main`, `section`, `article` e `footer`. Em JSX, `className` aplica uma classe CSS. Tailwind está instalado em `globals.css` via `@import 'tailwindcss'`; neste projeto a maior parte do visual usa classes CSS próprias e variáveis `--charcoal`, `--cream` e `--accent`, fáceis de substituir quando chegar a identidade oficial. Valores de pedidos nunca vêm dessas classes ou do navegador: o servidor recalcula tudo a partir do banco.

### Fluxos e dados

- O catálogo público consulta categorias/produtos **ativos e aprovados**. Item indisponível só aparece se `show_when_unavailable` estiver ativo, e nunca pode ser comprado. Galeria e avaliações exigem aprovação individual; sem registros, não são exibidas.
- O carrinho usa armazenamento local no navegador, diferencia combinações de escolhas e mostra preço estimado. A quote e a criação consultam produto, opções, horário em `America/Sao_Paulo`, modalidade, CEP, taxa e valor mínimo no servidor. Mudanças exigem revisão. O servidor guarda snapshots dos itens e do endereço em centavos BRL.
- A criação usa uma transação PostgreSQL e trava pela chave de idempotência. Uma repetição idêntica retorna a mesma referência e o mesmo link privado; uma repetição com payload diferente é rejeitada. O token de 256 bits é entregue na confirmação, guardado somente com hash no banco e expira em 30 dias. O administrador pode revogá-lo na ficha do pedido, com registro de auditoria; acesso por telefone não existe.
- `fulfillment_status` e `payment_status` são separados. O retorno do navegador ao site **não** aprova pagamento. O webhook verifica assinatura, consulta a ordem oficial do Mercado Pago no servidor e confere referência, moeda e valor antes de atualizar. Pedidos online pendentes não avançam para produção; pagamento no atendimento permanece pendente até a baixa por equipe autorizada.
- O painel consulta Auth do Supabase e `staff_members` no servidor. Operações de catálogo/conteúdo são apenas de `admin`; operador pode atender pedidos. RLS nega escrita direta pelo cliente e restringe pedidos de clientes autenticados aos próprios. O servidor usa credenciais elevadas apenas depois de checar a permissão.

## Mercado Pago — sandbox

O modo inicial é `PAYMENT_MODE=disabled`. Não há cobrança simulada nem checkout falso. Para testar de verdade com **conta de teste autorizada pela Brutus**:

1. Configure no servidor `PAYMENT_MODE=test`, `MP_TEST_ACCESS_TOKEN` e `MP_WEBHOOK_SECRET` de teste. Defina `APP_URL` como uma origem HTTPS pública de teste acessível pelo provedor. Não exponha token nem segredo em variáveis `NEXT_PUBLIC_*`.
2. Cadastre a URL de notificação **`https://sua-origem/api/webhooks/mercadopago`** no painel do provedor. Teste assinatura, retorno e reenvio. O endpoint espera `data.id` na query, `data.id` no corpo e o evento de Orders aceito pelo adaptador.
3. Ative pagamento online no painel **somente nessa base de teste**, com catálogo fictício e operação de teste configurados. Crie uma compra de ponta a ponta. O resultado na URL é informativo; confira o status oficial no painel e no acompanhamento.
4. Para produção, use a conta comercial autorizada, credenciais novas no servidor, endpoint HTTPS público e teste de baixo valor aprovado pela empresa. `PAYMENT_MODE=live` também exige `ENABLE_LIVE_PAYMENTS=true`; não ajuste essa flag sem concluir o checklist de lançamento.

O adaptador usa `POST /v1/orders` e `GET /v1/orders/{id}` da [documentação oficial de Checkout Pro via Orders](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/overview) e a [assinatura de notificações](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/notifications). Formatos e status devem ser revistos com a conta de teste real antes de operar. Cartões e CVV nunca passam pelo site.

## O que testar no navegador

Com `npm run dev` aberto, veja `http://localhost:3000` e use o modo responsivo das ferramentas do navegador nas larguras **360, 390, 768, 1024 e 1440 px**. Confira a reprodução automática e o botão de pausa; teste `prefers-reduced-motion` nas ferramentas de acessibilidade. Abra `/cardapio`, procure os lanches, confira as fotos individuais, adicione itens e revise o carrinho. Sem banco, o checkout deve informar que nenhum pedido foi enviado. Entre com equipe autorizada em `/admin/login`; tente também `/admin` sem login (deve voltar ao login).

Depois de configurar **a base isolada de teste** com dados fictícios e modalidades, faça: produto → opções obrigatórias → carrinho → editar → checkout → quote → pedido persistido → link `/pedido/[referencia]?token=...` → atualização de status no painel → acompanhamento. Para pagamento online, finalize o Checkout Pro em sandbox e confirme o status apenas após webhook válido. Confira tabulação do menu/carrinho/modal, tecla Escape, labels e zoom 200%; não deve haver rolagem horizontal. As fichas de pedido em `/admin/pedidos/[id]` podem ser impressas pela equipe.

Comandos locais:

```bash
npm run typecheck
npm run lint -- --quiet
npm test
node scripts/check-migration.mjs
npm run build
```

Os testes automatizados executam SQL real em PostgreSQL embutido (PGlite) e cobrem preço, opção obrigatória, indisponibilidade, loja fechada, CEP/taxa, idempotência/snapshot, transições, verificação da resposta de pagamento, assinatura de webhook, RLS e isolamento de cliente. **Eles não substituem integração com a instância Supabase e Mercado Pago sandbox.** Neste ambiente o build, lint, tipos, migration e testes passaram; a navegação HTTP sem banco foi verificada. Não houve sessão de navegador gráfico disponível para confirmar visualmente as cinco larguras ou um pagamento externo. Execute o roteiro acima no seu navegador antes de qualquer publicação.

## Segurança e privacidade

- `site_settings` começa com operação e pagamentos desligados. `SITE_APPROVED=false` impede indexação; página administrativa, checkout e acompanhamento usam `noindex`. Um link de pedido é um segredo: não o envie em grupos ou publique em capturas.
- Só admins enviam imagens autorizadas: upload no servidor valida formato/tamanho, converte para WebP e publica no bucket público. Inventário: `media-inventory.csv`. Materiais de rascunho não devem entrar no bucket público.
- `public/videos/brutus-abertura.mp4` e `public/poster.webp` são mídia conceitual fornecida para a abertura. O vídeo foi integrado conforme solicitado, também com SITE_APPROVED=true. A variável controla indexação e modo de prévia, não a aprovação da mídia.
- As queries e ações de pedido usam `DATABASE_URL` somente no servidor. Não use `service_role` no cliente. Revise backups, retenção de dados pessoais, acesso da equipe e política de privacidade com a empresa antes do lançamento.
- Horários são do mesmo dia (`opens_at < closes_at`); para operação depois da meia-noite será preciso uma regra e migração específicas. Taxas usam faixas de CEP aprovadas pela empresa, sem geocodificação automática.

## Pendente da Brutus antes de publicar

- Confirmar grafia/logo, cores, linguagem, textos, fotografia original e autorização; substituir paleta e título provisórios.
- Confirmar produtos, categorias, preços, imagens vinculadas, opções, limites, disponibilidade e eventuais alergênicos fornecidos pela empresa.
- Confirmar endereço completo, telefone/WhatsApp, horários, modalidades, CEPs, taxas, pedido mínimo e política de produção/pagamento. Não adicione links de contato sem confirmação.
- Criar e verificar conta de equipe, credenciais comerciais do Mercado Pago e webhook HTTPS; testar reenvio/assinatura, falhas e uma compra real ou roteiro equivalente aprovado.
- Revisar visual nas cinco larguras e teclado; conferir mídia oficial/SEO/OG, conferir a aprovação do vídeo para publicação e então decidir pela indexação/abertura de pedidos.

## Fontes técnicas

[Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) · [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) · [Supabase Auth com Next.js](https://supabase.com/docs/guides/auth/quickstarts/nextjs) · [Mercado Pago Checkout Pro via Orders](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/overview)

## Revisão 2

Relatórios aceitam período de até 366 dias e usam datas de Matão; a exportação recusa mais de 5.000 linhas para não cortar dados silenciosamente. O painel mostra totais do dia e ticket médio somente de pedidos pagos/concluídos. Novos pedidos geram aviso visual. Links privados podem ser revogados pelo administrador; notas internas não estão disponíveis nos grants de cliente. O banco impede produção online não paga, e o cliente pode reabrir um checkout online pendente pelo acompanhamento. Limites por produto somam todas as personalizações no pedido.

Após `npm run build`, execute `npm run test:http` para o teste de rotas do estado vazio, incluindo bloqueio de admin e webhook inválido. `npm run check:setup` verifica configurações e conexão sem imprimir segredos; resultado PENDENTE indica algo ainda necessário, não uma cobrança ou integração simulada.

Se você já aplicou a migration 001 da primeira versão, aplique apenas a 002. Não reaplique a 001 sobre tabelas existentes.

### Evidência da revisão

Foram executados com sucesso: build de produção, TypeScript, lint sem erros, 17 testes automatizados, verificação de migrations/RLS e 12 checagens HTTP (páginas públicas, bloqueio de admin, banco ausente, webhook malformado/sem assinatura e vídeo e cardápio original). O diagnóstico de configuração constatou ausência das credenciais externas. Consulte `CONFIGURACAO-BRUTUS.md` para os dados que faltam; esse documento não deve receber segredos.
