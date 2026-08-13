# Setup Vencedor — MCP remoto e ativação de domínio

**Data:** 13 de agosto de 2026
**Status:** desenho aprovado para especificação; implementação depende da revisão deste documento.

## Objetivo

Disponibilizar o acervo privado do Setup Vencedor para clientes MCP remotos em `https://setupvencedor.com.br/api/mcp`, com transporte Streamable HTTP, OAuth 2.1 baseado na identidade já existente no Setup Vencedor e acesso somente de leitura. Em paralelo, acompanhar a ativação do domínio, Pages e Resend por Cron da Cloudflare.

## Fora de escopo

- Alterar o painel, cards, catálogo editorial ou textos da biblioteca.
- Cadastro público, escrita via MCP, IA generativa, vídeos ou exposição de segredos.
- Reutilizar textos editoriais de terceiros.
- Conceder ao MCP mais acesso que o usuário já possui na plataforma.

## Estado existente confirmado

- O Worker já expõe uma base JSON-RPC em `POST /mcp`.
- A base atual aceita JWT do Supabase e oferece apenas `search_catalog` e `get_catalog_item`.
- O domínio `setupvencedor.com.br` foi delegado para a Cloudflare e está em período de transição no Registro.br.
- O Pages já possui os domínios raiz e `www` associados, aguardando ativação DNS.
- O Resend já possui o domínio e os registros DKIM/SPF/MX de envio criados na zona Cloudflare.

## Arquitetura proposta

### Recursos protegidos

O Worker será o resource server do MCP. As rotas públicas serão:

| Rota | Finalidade |
| --- | --- |
| `POST /api/mcp` | Mensagens JSON-RPC do Streamable HTTP MCP. |
| `GET /api/mcp` | Canal de leitura compatível com o transporte Streamable HTTP. |
| `/.well-known/oauth-protected-resource` | Descoberta do recurso protegido pelo cliente MCP. |
| `/.well-known/oauth-authorization-server` | Metadados do servidor OAuth. |
| `/api/oauth/authorize` | Início do consentimento e login do usuário. |
| `/api/oauth/token` | Troca do código por tokens de acesso e renovação. |
| `/api/oauth/register` | Registro dinâmico de cliente, quando solicitado pelo cliente MCP. |

As rotas `/api/*` e `/.well-known/*` serão encaminhadas ao Worker; o restante do host continuará no Cloudflare Pages.

### OAuth

O fluxo será Authorization Code com PKCE. O usuário será encaminhado ao login existente do Setup Vencedor, e só usuários com perfil ativo poderão aprovar o acesso. O Worker emitirá tokens de acesso de curta duração destinados exclusivamente ao recurso `https://setupvencedor.com.br/api/mcp` e renovará tokens por refresh token rotativo.

Códigos de autorização, clientes registrados, consentimentos e refresh tokens serão persistidos em tabelas exclusivas do Supabase. Valores persistidos que concedem acesso serão armazenados somente em hash. A service-role ficará apenas no Worker. O navegador nunca receberá service-role, chave Resend ou token Cloudflare.

### Tools MCP

As quatro tools serão somente de leitura e terão `readOnlyHint: true`:

| Tool | Entrada | Resultado |
| --- | --- | --- |
| `search_resources` | consulta, tipo, temas e tags opcionais | Recursos publicados que correspondem à busca, com motivo da correspondência. |
| `get_resource` | slug | Conteúdo e instruções de um recurso publicado. |
| `list_by_kind` | tipo | Lista paginada por plugin, skill, MCP, ferramenta, curso ou tutorial. |
| `recommend_for_project` | descrição do projeto e necessidades | Recomendações determinísticas do acervo, explicando a relação com os termos do pedido. |

Todas as consultas limitarão resultados, respeitarão visibilidade, estado publicado e a identidade validada do usuário. Não haverá ferramentas de criação, edição, exclusão ou ação externa.

### Validações do protocolo

O endpoint aceitará `application/json` e `text/event-stream` conforme a negociação do Streamable HTTP. O Worker validará `Origin`, exigirá `Authorization: Bearer` em cada requisição e responderá `401` com metadados OAuth quando necessário. Sessões, se usadas, receberão identificador opaco e expiração curta.

## Ativação do domínio

O Worker terá trigger `0 * * * *`. A rotina verificará:

1. Estado da zona na Cloudflare.
2. Ativação de `setupvencedor.com.br` e `www.setupvencedor.com.br` no Pages.
3. Resolução do host de API e disponibilidade de `GET /health` no Worker.
4. Estado dos registros de envio do Resend.

O resultado será gravado como evento de auditoria técnico. Quando todos os pré-requisitos estiverem ativos, a rotina enviará uma notificação ao administrador pelo Resend e marcará a ativação concluída. A rotina não altera conteúdo do acervo nem dados de usuários.

## Configuração Cloudflare e Resend

- Worker route: `setupvencedor.com.br/api/*` para `setup-vencedor-worker`.
- Worker route: `setupvencedor.com.br/.well-known/*` para `setup-vencedor-worker`.
- `APP_URL`: `https://setupvencedor.com.br`.
- `EMAIL_FROM`: `Setup Vencedor <acesso@setupvencedor.com.br>` após o domínio Resend estar verificado.
- Segredos ficam configurados apenas por `wrangler secret put` ou API protegida; não entram em repositório.

## Módulo MCP na Administração

Um módulo restrito a administradores será incluído na Administração existente. Ele não gerencia segredos e não permite alterar o acervo pelo MCP.

| Área | Conteúdo |
| --- | --- |
| Estado | Domínio, endpoint, OAuth, Pages, Resend e última execução do Cron. |
| Conectar | Endereço remoto, transporte `streamable-http` e instruções copiáveis para Codex e Claude. |
| Ferramentas | As quatro tools de leitura, com explicação objetiva do que cada uma retorna. |
| Segurança | Identidade conectada, escopos somente leitura e aviso de que nenhum segredo é mostrado. |
| Histórico | Eventos técnicos de ativação e verificações horárias, com hora e resultado. |

O módulo apresentará estados claros de `Em preparação`, `Aguardando DNS`, `Ativo` e `Atenção necessária`. Enquanto o Registro.br propaga a delegação, o administrador já poderá copiar a configuração de conexão e entender o que será liberado após a ativação.

## Testes de aceite

1. `GET /api/mcp` e `POST /api/mcp` seguem a negociação Streamable HTTP.
2. Cliente sem token recebe `401` e descobre OAuth corretamente.
3. OAuth com PKCE completa login, consentimento, troca de código e refresh rotativo.
4. Token inválido, expirado, de outro público ou usuário desativado não acessa ferramentas.
5. As quatro tools expõem somente itens publicados permitidos e nunca escrevem dados.
6. As rotas do Worker não quebram Pages, `www`, login, convite ou recuperação de senha.
7. Cron registra estado de ativação e notifica apenas uma vez após sucesso.
8. Administrador visualiza o módulo MCP, copia a configuração e nunca recebe segredo no navegador.
9. `npm test`, checagem do Worker, build do Pages e smoke tests HTTP passam antes da publicação.

## Decisões explícitas

- O nome do servidor será `setup-agent` e a URL pública será `https://setupvencedor.com.br/api/mcp`.
- A autenticação será OAuth com login próprio, não uma chave compartilhada manual.
- O recurso é privado, individual e somente leitura.
- O cron será uma rotina Cloudflare de monitoramento e notificação; ele não depende de o Codex Desktop permanecer aberto.
