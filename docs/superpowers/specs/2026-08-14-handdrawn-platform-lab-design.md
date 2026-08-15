# Setup Vencedor — laboratório funcional em estilo desenhado

## Objetivo

Construir uma versão paralela, clara e funcional de toda a plataforma Setup Vencedor com linguagem de caderno desenhado à mão. A versão oficial atual permanecerá visual e operacionalmente intocada até que Welber conclua a revisão da paralela e autorize explicitamente a promoção.

O laboratório reutiliza a marca Setup Vencedor, o verde característico, os dados reais, a autenticação existente, os papéis, o catálogo, os favoritos, o suporte e as ações administrativas. A mudança é de experiência visual e organização da interface, sem duplicar o produto nem criar uma segunda base de dados.

## Decisões aprovadas

- A direção visual é o “caderno de decisões”: papel claro, tinta escura, bordas irregulares, sombras de caneta, notas coloridas e hierarquia editorial.
- O verde da marca continua sendo o destaque principal. Azul-claro, coral, lilás e verde suave funcionam como cores auxiliares.
- A plataforma terá mais ilustrações do que a primeira maquete: desenhos temáticos, setas, estrelas, marcadores e pequenos diagramas acompanham a navegação e ajudam a explicar os fluxos.
- A versão paralela será funcional, usando os mesmos dados e as mesmas permissões da plataforma atual.
- A versão oficial só será alterada após aprovação integral e uma autorização final explícita.

## Isolamento técnico

### Código

O laboratório será desenvolvido em worktree e branch próprios, com prefixo `codex/`, sem misturar alterações com o checkout oficial ou com mudanças locais já existentes. A base inicial deve incluir o perfil desenhado de `skills-frontend-design` aprovado pelo usuário.

O trabalho não autoriza reset, descarte ou incorporação automática de arquivos locais alheios ao laboratório. Somente arquivos identificados como parte da experiência desenhada serão transportados para a branch paralela.

### Publicação

O laboratório será publicado manualmente como a preview branch `handdrawn-lab` do projeto Cloudflare Pages, no endereço independente:

```text
https://handdrawn-lab.setup-vencedor.pages.dev
```

O domínio `setupvencedor.com.br` e o deployment de produção não serão modificados durante a construção. Cada fase aprovada atualiza somente o endereço do laboratório.

### Dados e autenticação

O laboratório usa o Supabase já configurado, somente com URL e chave pública no frontend. RLS, papéis cumulativos e sessão autenticada continuam sendo a fronteira de acesso. Nenhuma chave privilegiada será colocada no navegador, no repositório ou no build.

Como a versão é funcional, favoritos, chamados, convites e ações administrativas realizadas no laboratório têm efeito real. O cabeçalho do laboratório exibirá um selo permanente: `LABORATÓRIO VISUAL · DADOS REAIS`. Ações sensíveis mantêm as mesmas confirmações e autorizações da plataforma atual.

Não haverá cadastro público, vídeo, IA generativa em tempo de execução ou mudança no modelo de permissões.

## Arquitetura da experiência

### Tema isolado

O modo desenhado será ativado pelo build do laboratório, não por uma preferência persistida na conta. A aplicação recebe uma classe raiz e tokens próprios, mantendo o tema atual disponível no código até a promoção final.

Os tokens do laboratório cobrem:

- papel principal e papel elevado;
- tinta, texto secundário e linhas de lápis;
- verde da marca, azul, coral, lilás e verde suave;
- bordas desenhadas, sombras deslocadas e raios assimétricos;
- tipografia de leitura e tipografia manuscrita de destaque;
- foco visível, estados de sucesso, alerta, erro e desabilitado;
- densidade para desktop, tablet e celular.

### Componentes reutilizáveis

O laboratório terá primitivas visuais compartilhadas, evitando CSS específico e inconsistente em cada tela:

- `PaperShell`: superfície principal de papel;
- `SketchRail`: menu lateral e sua versão móvel;
- `NotebookHeader`: título, contexto, identidade e selo do laboratório;
- `HanddrawnCard`: cartão de acervo, métrica, favorito ou recomendação;
- `StickyNote`: informação curta, aviso ou dica;
- `SketchButton`: ação primária, secundária ou de cópia;
- `SourceStamp`: fonte, data de verificação e confiança;
- `IllustratedHero`: título de página acompanhado de ilustração temática;
- `SketchEmptyState`, `SketchError` e `SketchLoading`: estados claros e consistentes;
- `ResourceStorySheet`: composição desenhada das fichas de recurso.

Texto, links, campos e botões permanecem em HTML. Nenhuma informação operacional ficará presa dentro de uma imagem. As ilustrações complementam a compreensão, mas não substituem rótulos, instruções ou ações acessíveis.

## Sistema de ilustrações

### Linguagem

As ilustrações seguem traço de caneta e lápis, preenchimento suave, papel quente e pequenas imperfeições controladas. A marca SV aparece como assinatura visual, sem deformação nem reconstrução da logo aprovada.

### Famílias por área

- **Explorar:** estante, mapas, fichas, lupa, lápis e atalhos conectados.
- **Assistente:** bússola, balões de conversa, trilhas e setas de decisão.
- **Favoritos:** estrelas, marcadores, clipes e caderno pessoal.
- **Suporte:** conversa, boia, caixa de ferramentas e fluxo de atendimento.
- **Administração:** pessoas, convites, pranchetas, escudos e indicadores.
- **Autenticação:** porta, chave, envelope de convite e cadeado.
- **Recursos:** computador, cartões de passos, setas e elementos relacionados ao tipo ou tópico do item.

### Registro estático

As ilustrações serão arquivos originais e estáticos versionados no projeto. Elas podem ser produzidas durante o design com ferramenta de geração de imagem e depois revisadas, mas nunca serão geradas em tempo de execução nem receberão dados do usuário.

O catálogo usará um registro determinístico por tipo, categoria e tópico. Todo recurso recebe uma composição visual coerente; itens de destaque podem receber arte exclusiva. O sistema não faz chamadas de geração no navegador e não bloqueia a página quando uma arte específica ainda não existir: nesse caso, usa a ilustração temática da categoria.

## Telas cobertas

### Estrutura global

- menu lateral desenhado no desktop e menu de caderno no celular;
- logo Setup Vencedor preservada;
- identidade da pessoa autenticada;
- selo de laboratório e dados reais;
- navegação por teclado e foco visível;
- ação para abrir a plataforma oficial em outra aba e comparar.

### Acesso privado

- login;
- recuperação de senha;
- ativação de convite;
- erros de acesso, convite inválido e sessão expirada.

Os formulários parecem páginas de caderno, mas preservam `autocomplete`, validação, mensagens de erro e requisitos de senha existentes.

### Explorar

- hero ilustrado;
- busca;
- filtros e contagens por categoria;
- catálogo completo, paginação e estados de carregamento;
- cartões desenhados com resumo, favorito e abertura do recurso;
- painel de detalhes para itens sem ficha editorial.

### Fichas de recurso

Todos os itens que possuem guia usam `ResourceStorySheet`. Título, explicação, etapas, contexto de uso, limitações, fontes e comandos copiáveis ficam dentro da folha desenhada. `Abrir fonte`, `Copiar link`, `Favoritar`, `Copiar para Claude Code` e `Copiar para Codex` continuam sendo controles reais.

O perfil aprovado de `skills-frontend-design` é a referência de qualidade. O conteúdo varia de modo determinístico por guia; a página não inventa compatibilidade, comandos ou fatos ausentes.

### Assistente

- entrada por texto e voz já existente;
- ilustração de bússola e trilha;
- resultado apresentado como percurso numerado;
- recomendações, justificativas e primeiro passo em notas conectadas;
- resultados vazios e falhas sem conteúdo inventado.

### Favoritos

- caderno pessoal de recursos salvos;
- mesmos cartões e ações do catálogo;
- estado vazio ilustrado;
- persistência real por usuário.

### Suporte

- abertura de chamado;
- editor, tipo e anexo;
- mensagens de validação e envio;
- visual de conversa e acompanhamento por status;
- abas `Abertos`, `Respondidos`, `Fechados` e `Finalizados` quando disponíveis ao papel da pessoa.

### Administração

- métricas de recursos, papéis e favoritos;
- convite por e-mail ou link individual;
- diretório de pessoas, papéis e estados;
- ações administrativas reais, protegidas pelas permissões atuais;
- representação visual por pranchetas, pessoas, escudos e carimbos.

## Fluxo de dados e estados

A camada visual não cria uma API paralela. Componentes do laboratório recebem as mesmas propriedades e chamam os mesmos serviços atuais. Favoritos continuam otimistas com reversão em caso de falha. Catálogo, guia, suporte e administração preservam suas mensagens e limites de autorização.

Cada tela deve prever:

- carregamento sem salto brusco de layout;
- vazio com orientação prática;
- erro com explicação curta e tentativa segura;
- sucesso com confirmação visível, sem depender apenas de cor;
- ausência de ilustração específica com fallback temático;
- sessão expirada redirecionada ao acesso privado.

## Acessibilidade e responsividade

- contraste mínimo compatível com WCAG AA para texto e controles;
- tipografia manuscrita somente em títulos e destaques curtos;
- texto longo em fonte de leitura;
- foco visível em todos os controles;
- alvos de toque adequados no celular;
- ordem semântica de títulos;
- `aria-label` quando o desenho não comunica o nome do controle;
- `alt` informativo apenas em ilustrações relevantes; ornamentos usam alternativa vazia;
- suporte a `prefers-reduced-motion`;
- nenhuma interação exclusiva de hover.

## Fases de entrega

### Fase 1 — fundação, navegação e Explorar

Cria o ambiente isolado, tokens, componentes-base, menu, cabeçalho, busca, filtros, cartões, paginação e a primeira família de ilustrações. A entrega deve permitir navegar pelo catálogo real no endereço paralelo.

### Fase 2 — fichas de recurso

Generaliza a qualidade do piloto Frontend Design para todas as fichas com guia, integra fontes, ações de cópia e famílias ilustradas por categoria. Itens sem guia mantêm painel compatível no mesmo estilo.

### Fase 3 — áreas de trabalho

Transforma Assistente, Favoritos, Suporte e Administração, preservando comportamento, permissões e estados reais.

### Fase 4 — acesso e acabamento

Transforma login, convite e recuperação; completa celular e tablet; revisa ilustrações, textos, acessibilidade, desempenho e consistência visual.

Cada fase é publicada apenas no laboratório e passa por aprovação de Welber antes da seguinte.

## Estratégia de testes

O desenvolvimento segue TDD. Antes de cada mudança de comportamento ou estrutura, um teste demonstra a expectativa e falha pelo motivo correto.

### Automatizados

- o build oficial continua usando o tema atual;
- o build do laboratório ativa somente o tema desenhado;
- rotas, permissões e ações continuam funcionando em ambos;
- componentes-base preservam nomes acessíveis, foco e estados;
- catálogo, paginação, busca, favorito, cópia, suporte e administração mantêm seus testes funcionais;
- cada ficha renderiza conteúdo real do guia e fallback ilustrado determinístico;
- nenhuma chave privilegiada aparece no bundle.

### Visuais e manuais

- inspeção autenticada de todas as áreas no laboratório;
- desktop, tablet e celular;
- papéis Membro, Editor, Gestor e Administrador quando houver contas apropriadas;
- comparação com a plataforma oficial;
- cliques, campos, filtros, cópia, favoritos e ações administrativas relevantes;
- ausência de corte, sobreposição, texto ilegível ou desenho confundido com controle;
- verificação de console e rede para falhas de carregamento.

## Desempenho

- imagens responsivas em WebP ou PNG otimizado;
- dimensões declaradas para evitar deslocamento de layout;
- carregamento tardio de ilustrações abaixo da dobra;
- reutilização de famílias ilustradas em vez de duplicação desnecessária;
- CSS do laboratório organizado por tokens e componentes;
- nenhuma dependência de geração de imagem, modelo ou serviço pago durante a navegação.

## Critérios de aceite do laboratório

- todas as telas em escopo estão navegáveis no endereço paralelo;
- dados e permissões correspondem à plataforma oficial;
- o domínio oficial não recebe alterações do laboratório;
- o usuário reconhece a linguagem aprovada de caderno desenhado em todas as áreas;
- cada área principal possui ilustração temática útil;
- todas as fichas de recurso aparecem dentro da composição desenhada;
- ações reais continuam acessíveis e funcionais;
- testes focados, typecheck e build passam;
- inspeção visual autenticada em desktop e celular é concluída;
- Welber aprova explicitamente a versão paralela completa.

## Promoção para a plataforma oficial

A promoção não é automática. Depois da aprovação integral, será preparado um plano separado de migração. A mudança oficial exige nova autorização explícita de Welber, verificação final do deployment de produção e plano de reversão.

Até essa autorização, a plataforma oficial continua sendo a referência operacional e o laboratório permanece uma versão paralela de avaliação.

## Fora do escopo

- alterar RLS, papéis ou regras de negócio;
- criar cadastro público;
- duplicar banco ou sincronizar duas bases;
- introduzir IA generativa ou vídeo como recurso do produto;
- reescrever Worker, MCP ou integrações sem necessidade visual direta;
- publicar o laboratório no domínio oficial antes da autorização final.
