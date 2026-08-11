# Setup Vencedor: design aprovado

## Objetivo

Criar uma plataforma interna para Welber e sua equipe encontrarem, organizarem e usarem um acervo crescente de ferramentas, skills, MCPs, plugins, prompts e guias. A plataforma terá acesso somente por convite, busca sem IA, favoritos, suporte e um MCP de consulta somente leitura.

O catálogo inicial será construído a partir de fontes públicas e oficiais, com textos próprios. Não haverá reprodução em massa do conteúdo editorial de terceiros. Aulas e hospedagem de vídeo não entram na primeira versão.

## Escopo da primeira versão

- Biblioteca privada com itens, categorias, temas, tags, links oficiais e instruções próprias.
- Busca conversacional sem IA: pesquisa estruturada no acervo e recomendações explicáveis.
- Favoritos por pessoa.
- Convites por e-mail, senha, login e recuperação de senha.
- Papéis cumulativos por conta e prévia segura de permissões no painel administrativo.
- Suporte com chamados e troca de mensagens.
- Painel administrativo para equipe, catálogo, convites e suporte.
- MCP remoto, somente leitura, para encontrar itens que o usuário autenticado pode acessar.

Fora do escopo inicial:

- Upload, streaming ou incorporação de aulas em vídeo.
- Chat com modelo de IA ou cobrança por uso de IA.
- Cadastro público.
- Escrita, edição ou execução de ações pelo MCP.
- Migração de textos, prompts ou páginas proprietárias de terceiros.

## Arquitetura

```text
Pessoa
  -> Cloudflare Pages (React/Vite)
     -> Supabase Auth e Data API, somente credenciais públicas
     -> Cloudflare Worker privado
        -> Supabase com chave de serviço, apenas nas rotas administrativas
        -> Resend, após domínio e remetente verificados
        -> endpoint MCP remoto, somente leitura
```

### Cloudflare Pages

Hospeda a interface React responsiva. Não recebe nenhuma chave privilegiada. Usa a chave pública do Supabase e envia ao Worker apenas sessões autenticadas quando a operação exige privilégio.

### Supabase

Armazena autenticação, perfis, papéis, catálogo, favoritos, chamados, mensagens, anotações internas e histórico. Todas as tabelas expostas terão RLS habilitado. O cliente navega os dados permitidos por RLS; a chave de serviço só existe no Worker.

### Cloudflare Worker

É a fronteira de confiança para convites, envio de e-mail, ações administrativas, auditoria e MCP. Valida sessão e papel em cada requisição. Aplica limites de taxa nas rotas de convite, recuperação e MCP. Segredos ficam em variáveis secretas do Worker.

### Resend

Usado para e-mails de convite e notificações de suporte. A configuração definitiva depende de domínio e remetente verificados. Até isso acontecer, o fluxo será testado com remetente de desenvolvimento, sem afirmar envio de produção.

## Papéis e permissões

Uma pessoa pode possuir vários papéis. Cargo, como programador ou cliente, é um rótulo de perfil e não altera permissões por si só.

| Papel | Biblioteca | Conteúdo | Suporte | Equipe e acesso |
| --- | --- | --- | --- | --- |
| Membro | consulta, busca, favoritos | não altera | abre e acompanha os próprios chamados | não acessa |
| Editor | consulta | cria e edita itens autorizados | abre os próprios chamados | não acessa |
| Gestor | consulta | organiza catálogo | responde e gerencia suporte | não gerencia administradores |
| Administrador | total | total | total | convida, revoga, define papéis e usa prévia de perfil |

O painel terá uma prévia de papel. Ela altera a navegação e as permissões efetivas da sessão do administrador para validação visual, sem assumir a sessão de outra pessoa, sem ler dados privados de terceiros e com indicação clara de que é uma prévia.

## Autenticação e convites

1. Administrador informa nome, e-mail, cargo opcional e um ou mais papéis.
2. Worker cria convite de uso único, vinculado ao e-mail normalizado, com expiração e hash do token armazenado.
3. Resend envia um e-mail moderno contendo o link de ativação.
4. O convite abre a tela de criação de senha. O e-mail vem preenchido e bloqueado; a conclusão só é aceita para o e-mail convidado.
5. A conta é criada ou ativada pelo fluxo de Auth verificado no servidor. O convite é consumido e os papéis são atribuídos em transação.
6. Login aceita apenas contas convidadas e ativas. Convite vencido, revogado ou já usado apresenta mensagem clara e permite solicitar novo convite ao administrador.
7. "Esqueci minha senha" usa o fluxo de recuperação do Supabase, redirecionando de volta à página protegida de troca de senha.

O uso exato das APIs administrativas de Auth será conferido na documentação atual do Supabase antes da implementação. Nenhum token de convite ou chave de serviço será colocado na URL de log, banco de analytics ou cliente.

## Modelo de dados

### Identidade e equipe

- `profiles`: uma linha por usuário autenticado, nome, cargo, avatar opcional, estado e datas.
- `roles`: catálogo fixo de papéis.
- `user_roles`: associação muitos-para-muitos entre perfil e papel.
- `invitations`: e-mail, token com hash, expiração, estado, criador e aceitação.
- `audit_events`: eventos administrativos relevantes, ator, alvo, tipo, payload reduzido e data.

### Catálogo

- `catalog_items`: título, slug, tipo, resumo próprio, conteúdo próprio, URL oficial, instruções, status, visibilidade, autor, datas e vetor de busca textual.
- `categories`: por exemplo, Ferramentas, Skills, Edições, Cursos, Plugins, MCPs e Tutoriais.
- `topics`: áreas como frontend, segurança, documentação, produtividade e automação.
- `tags` e `catalog_item_tags`: palavras-chave, sinônimos e intenções de busca.
- `favorites`: associação única entre pessoa e item, com data de criação.

Itens iniciam como rascunho. Administrador ou Gestor publicam, arquivam ou limitam a visibilidade conforme a necessidade. Toda fonte externa recebe URL oficial e indicação de origem.

### Suporte

- `support_tickets`: autor, título, tipo, status, prioridade, data de abertura, última atividade e responsável opcional.
- `support_messages`: mensagem, autor, origem e data.
- `support_internal_notes`: observações exclusivas de Gestor e Administrador.
- `support_events`: mudança de status, atribuição, fechamento e reabertura.

Status: `open`, `answered`, `closed`, `finalized`. A pessoa solicitante vê apenas seus chamados, mensagens públicas e o status atual. Gestor e Administrador veem todos os chamados; Editor e Membro não leem chamados de terceiros.

## Experiência de uso

### Biblioteca e favoritos

A navegação principal terá Explorar, Assistente, Favoritos e Suporte. A área administrativa aparece somente para quem possuir o papel correspondente.

Explorar mostra busca, filtros por tipo, tema, app e tags, ordenação e cards de itens. Cada card contém fonte oficial, resumo original, problema que ajuda a resolver, instrução de uso e botão de favorito. Favoritos terão página própria, busca e os mesmos filtros para que o acervo continue prático com centenas de itens.

### Assistente sem IA

O campo terá tom conversacional, mas não gerará respostas. Ele normaliza a pergunta, consulta título, resumo, texto, categorias, tópicos, tags e sinônimos, e devolve itens ordenados por correspondência. Cada recomendação explica quais termos ou tags motivaram o resultado. Consultas sem resultados sugerem filtros ou registram uma intenção para curadoria, sem inventar ferramenta alguma.

### Suporte

O membro abre um chamado pelo botão Suporte, escolhe o tipo e acompanha a conversa. O painel administrativo terá abas Abertos, Respondidos, Fechados e Finalizados, contadores, filtros, busca, detalhes da conversa e notas internas. E-mails avisam sobre nova resposta e alteração relevante de status quando o remetente estiver configurado.

## Direção visual

Uma central de comando para devs: base em preto grafite e azul-noite, painéis translúcidos com contraste acessível, azul elétrico como destaque, verde-lima para sucesso e laranja para alertas. Busca, comandos e estados técnicos remetem a terminal sem comprometer legibilidade. O design será responsivo, com foco em desktop e uso confortável em celular.

Modais de convite, redefinição de senha e chamados terão foco preso, fechamento por teclado, contraste adequado, estado de carregamento e mensagens de erro compreensíveis.

## MCP

O Worker expõe um MCP remoto compatível com transporte HTTP atual, autenticado e revogável. A primeira versão oferece apenas ferramentas de leitura:

- `search_catalog`: busca itens liberados para o usuário.
- `get_catalog_item`: devolve detalhes de um item acessível pelo usuário.
- `list_favorites`: mostra os favoritos do próprio usuário, quando o cliente autenticado solicitar.

O MCP não cria itens, não lê convites, não lê suporte e não expõe dados administrativos. A autenticação e o formato de instalação serão validados contra a documentação vigente do cliente alvo, Claude primeiro e Codex quando houver suporte aplicável.

## Segurança e falhas esperadas

- RLS obrigatório nas tabelas expostas e política por papel e propriedade.
- Nenhuma chave de serviço, token Resend ou segredo Cloudflare no frontend ou no repositório.
- Token de convite armazenado somente como hash, de uso único, com expiração e revogação.
- Bloqueio de e-mail não convidado, convite já usado, conta desativada e recuperação inválida.
- Validação de entrada com esquema tipado, proteção contra links malformados e renderização segura de textos.
- Mensagens de erro úteis sem revelar se um e-mail possui ou não conta fora do contexto de convite.
- Registro de ações administrativas sem registrar senhas, tokens ou conteúdo sensível.
- Limite de taxa para convite, login, recuperação, suporte e MCP.

## Testes e critérios de aceite

- Administrador convida, revoga e reinvita uma pessoa; apenas o e-mail convidado conclui ativação.
- Usuário define senha, entra, sai e redefine senha pelo link de recuperação.
- Cada papel enxerga apenas os menus e ações autorizados; uma conta com múltiplos papéis mantém todas as permissões previstas.
- Prévia de papel não muda a conta real nem revela dados privados de outro perfil.
- Busca encontra itens por título, tags e sinônimos; resultados explicam sua correspondência; consulta sem resultado não alucina resposta.
- Favorito adiciona, remove, persiste após novo login e permanece isolado entre usuários.
- Solicitante vê somente os próprios chamados; Gestor e Administrador respondem e usam notas internas; abas e contadores refletem os estados corretos.
- MCP autenticado só retorna itens que o usuário poderia consultar pela interface; tentativas de escrita ou acesso administrativo falham.
- Testes automatizados cobrem regras de acesso, fluxos de convite e suporte; testes de interface cobrem caminhos críticos; build de Pages e Worker conclui sem segredo embutido.

## Publicação

- Frontend: Cloudflare Pages conectado ao repositório, com variáveis públicas apenas para URL e chave pública do Supabase.
- Backend e MCP: Cloudflare Worker separado, com segredos configurados por ambiente.
- Banco: migrations versionadas e aplicadas ao projeto Supabase informado pelo usuário após revisão de RLS.
- E-mail: domínio e remetente verificados no Resend antes da ativação de envio para a equipe.

## Decisões registradas

- Plataforma privada para Welber e pessoas convidadas da equipe.
- Papéis: Administrador, Gestor, Editor e Membro; cumulativos por e-mail.
- Cloudflare Pages + Worker privado + Supabase + Resend.
- Assistente de acervo sem IA na primeira versão.
- Favoritos incluídos desde o início.
- Vídeos e aulas adiados, sem links nem upload na primeira versão.
- Design tecnológico, diferenciado e responsivo.
