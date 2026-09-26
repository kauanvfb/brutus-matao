# Brutus Matão — vídeo e cardápio

Abra a pasta brutus-matao no VS Code e execute `npm install` e `npm run dev`.

## Nesta edição

- Vídeo MP4 original de 8 segundos, automático, sem áudio, em loop e sem prender a rolagem.
- Botão de reprodução/pausa; pausa fora da tela e com aba oculta; imagem estática quando o dispositivo pede movimento reduzido.
- 12 lanches com nomes, preços e ingredientes transcritos do cardápio enviado; combos removidos.
- 10 fotos individuais aprimoradas e integradas; Brutus Junior e Blend Caramelizado mantêm o recorte do cardápio.
- Busca, modal e integração com o carrinho existente.
- Sem banco: montagem de carrinho e revisão local; sem envio de pedidos nem cobrança.
- Com banco: catálogo e validações vêm do servidor, conforme disponibilidade e operação configuradas.
- Os 300 frames antigos foram retirados desta edição, pois a abertura usa vídeo.

## Importar no Supabase

Depois das migrations existentes, execute `supabase/cardapio-brutus.sql`. O arquivo importa 12 lanches e remove os combos antigos; não abre a loja nem habilita pagamento. O catálogo local (`src/data/menu.json`) e o SQL usam os mesmos IDs.

Se já existir um produto com o mesmo slug, o importador mantém esse registro. Evite inserir o mesmo cardápio manualmente antes da importação.

## Material fornecido

As 10 fotos individuais fornecidas foram aprimoradas em resolução, nitidez, luz e acabamento, preservando os lanches, e estão em `public/images/lanches/`. O cardápio original continua como referência e fallback dos dois produtos sem foto individual.

Arquivo original: `public/images/cardapio-original.png`. Vídeo: `public/videos/brutus-abertura.mp4` (áudio removido e carregamento inicial otimizado). As imagens de campanha já presentes continuam conceituais e separadas dos produtos reais.

Ponto a confirmar com a Brutus: a composição do Big Brutus foi lida como “molho Billy & Jack”; confirme a grafia no arquivo original em maior resolução antes de publicar.

## Validação

Build/TypeScript, ESLint e testes automatizados devem ser executados após qualquer nova troca de foto ou cardápio. Pagamento real e serviços externos não foram ativados.
