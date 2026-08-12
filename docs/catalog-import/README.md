# Importacao do catalogo publico

Este diretorio e o ponto de entrada para incluir referencias publicas na biblioteca. Ele **nao** e um exportador da plataforma de origem: cada registro deve ser pesquisado em sua fonte publica/oficial e receber texto novo, escrito para o Setup Vencedor.

## O que pode entrar

- Nome da ferramenta, URL oficial publica, categoria, tipo e metadados factuais.
- Instrucoes verificadas na documentacao ou no repositorio oficial, com a URL correspondente.
- Resumo e explicacao escritos originalmente para a equipe.

## O que nao entra

- Textos editoriais, prompts, cards, imagens, videos, transcricoes ou organizacao proprietaria da plataforma de origem.
- URL privada, token, credencial, e-mail de usuario ou qualquer dado de acesso.
- Uma URL que nao tenha sido aberta e validada manualmente como fonte publica.

## Fluxo seguro

1. Para cada item visto na sua assinatura, abra somente a fonte publica indicada (GitHub ou documentacao oficial).
2. Copie a estrutura de `catalog-items.example.json` para `catalog-items.json` e preencha cada registro conforme o contrato em `schema.json`.
3. Escreva `summary`, `ownContent` e `instructions` do zero. Informe tambem `sourceCheckedAt` e `sourceNote` para deixar claro o que foi verificado.
4. Valide sem criar arquivo: `node scripts/import-catalog.mjs --input docs/catalog-import/catalog-items.json --check`.
5. Gere o SQL idempotente: `node scripts/import-catalog.mjs --input docs/catalog-import/catalog-items.json --author-email seu-email@empresa.com --output supabase/seeds/catalog-import.sql`.
6. Revise o SQL gerado e aplique-o somente no projeto Supabase correto. O arquivo em `supabase/seeds/` e gerado localmente; nao o inclua em um commit sem revisao, pois ele registra o e-mail usado como autor do lote.

O importador nao usa nem pede chave do Supabase. A aplicacao do SQL deve ser feita por uma pessoa autenticada, apos conferir projeto, ambiente e autor.

## Comportamento ao reexecutar

- Categorias, topicos e tags sao atualizados pelo `slug`.
- Itens sao atualizados pelo `slug`, preservando o `author_id` de um item ja existente (a regra do banco o torna imutavel).
- As associacoes de tags e topicos de cada item importado sao sincronizadas com o arquivo. Portanto, mantenha no JSON a lista completa de associacoes desejada para cada item.
- Novos itens recebem como autor o perfil ativo de administrador ou gestor identificado por `--author-email`.

Comece com uma pequena amostra revisada e avance em lotes. O arquivo vem vazio por proposito: ele nao deve conter uma copia da plataforma de origem.
