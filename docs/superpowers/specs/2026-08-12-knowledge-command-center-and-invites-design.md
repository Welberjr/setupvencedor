# Setup Vencedor — Knowledge Command Center e Gestão de Acesso

## Objetivo

Transformar o Setup Vencedor numa biblioteca privada que pareça um produto
pronto para venda: descoberta clara, conteúdo legível, identidade própria,
suporte confortável e gestão segura de pessoas. A revisão preserva o catálogo
real, as fontes públicas, a autenticação privada, o RLS e os favoritos.

## Direção visual

O produto mantém o tema escuro técnico, mas substitui elementos genéricos por
um vocabulário visual próprio: monograma SV geométrico desenhado em SVG,
ícones de navegação SVG exclusivos e seta curva de ação. A tipografia fica
mais compacta; os títulos deixam de dominar a tela e os cards tornam-se mais
fáceis de ler em uma varredura rápida.

## Explorar e cards

- O grid terá altura consistente por página. Em telas largas, a paginação
  entrega páginas completas; apenas a última página pode ter lacunas.
- O resumo de cada recurso será reescrito a partir dos campos do catálogo e
  do tipo real do item. Não haverá uma frase repetida para todos os itens nem
  texto copiado de páginas de terceiros.
- A frase genérica “Referência pública para a equipe avaliar” deixa de ser
  aplicada fora de referências. O modal mostra a origem e os links públicos
  somente onde fazem sentido.
- Tags deixam o card. Elas passam para um bloco discreto dentro do modal,
  junto da fonte e do contexto técnico.
- O botão de favorito inativo recebe um ícone e contorno próprios; o estado
  ativo preserva o destaque verde atual.

## Detalhe do recurso

O modal vira uma leitura em quatro blocos com títulos mais evidentes: “O que
é”, “Quando faz sentido”, “Primeiro passo” e “Como a equipe pode usar”. O
campo “Primeiro passo” será transformado em lista ordenada: cada etapa em sua
própria linha, com número destacado. O texto será alinhado à esquerda para
evitar espaçamento artificial entre palavras; quando um conteúdo não puder
ser justificado com boa leitura, ele será reescrito em linguagem direta.

## Assistente do acervo

A aba não renderiza cards antes de a pessoa pesquisar. Ela apresenta somente
uma busca central, exemplos clicáveis e indicação curta de como encontrar
recursos. A partir do segundo ou terceiro caractere útil, a busca determinística
por título, resumo, temas e tags passa a mostrar somente os cards compatíveis.
Uma pesquisa sem resultados recebe uma mensagem útil, sem inventar respostas
de IA.

## Suporte

O formulário ocupa uma coluna central maior, com explicação visual dos tipos
de chamado e área de mensagem rica. A primeira versão do editor oferece
negrito, itálico, sublinhado e cor de texto, convertendo a mensagem para uma
representação segura antes de persistir. A imagem decorativa é estática e
acessível; não exigirá upload de arquivos nesta entrega. O texto enviado será
mantido no banco sem executar HTML arbitrário.

## PWA

O auxílio de instalação fica fechado por padrão. Ao clicar em “Instalar app”,
abre um aviso descartável com duas instruções: Android (Chrome) e iPhone/iPad
(Safari). O botão “Fechar” remove o aviso; ele só volta quando a pessoa clicar
em “Instalar app” novamente. O comportamento nativo `beforeinstallprompt`
continua sendo preferido quando disponível.

## Administração e convites

A administração terá uma área de métricas compacta, uma área de convite em
destaque e um diretório pesquisável de pessoas. Haverá dois modos mutuamente
exclusivos:

1. **Enviar por e-mail** — administrador preenche e-mail, papel obrigatório e
   nome opcional. O endereço é fixado no convite e o Worker envia/reenvia o
   link por Resend.
2. **Gerar link direto** — administrador escolhe papel obrigatório e nome
   opcional. O sistema gera um URL de ativação de uso único para envio manual.
   Se o nome estiver vazio, a pessoa informa o nome na ativação; se estiver
   preenchido, esse campo não é mostrado.

Todo convite contém token aleatório armazenado apenas como hash, expira em 72
horas por padrão, é aceito uma única vez e passa de `pending` para `claimed`
atomicamente antes de criar a conta. Concorrências, reaberturas e links
repassados não criam duas contas. Para convite por e-mail, a ativação exige o
mesmo endereço. Para link direto, o primeiro titular do link informa o e-mail
que será associado à conta.

O diretório permite busca por nome ou e-mail e expõe somente ações autorizadas:

- reenviar convite por e-mail;
- copiar um link direto ainda pendente;
- revogar convite pendente;
- bloquear imediatamente uma pessoa ativa;
- reativar uma pessoa bloqueada;
- remover pessoa com confirmação explícita.

“Remover pessoa” revoga autenticação e permissões imediatamente e preserva
registros operacionais para auditoria. A exclusão definitiva de dados pessoais
fica como operação separada, com confirmação reforçada, para não apagar
chamados e eventos por acidente.

## Modelo de dados e segurança

As mudanças serão feitas por migrações Supabase, com RLS estrito. Novas colunas
ou registros distinguem o modo do convite e permitem `recipient_name` nulo no
modo direto sem abrir cadastro público. Apenas administradores podem listar,
reenviar, revogar, bloquear ou remover. O Worker, e não o navegador, cria os
tokens, envia e-mails e chama operações administrativas do Supabase.

Nenhuma chave Resend ou service role será enviada ao browser, e nenhum arquivo
de chaves local será versionado.

## Correção editorial e validação

Todos os textos visíveis alterados recebem português revisado, com caracteres
UTF-8 corretos. A geração de narrativas ganha testes de acentuação, variação
por tipo e etapas separadas. Testes adicionais cobrem pesquisa vazia no
assistente, paginação preenchida, convite de uso único, e-mail vinculado,
revogação, reenvio e permissões administrativas.

Antes da publicação: testes completos, typecheck, build, validação autenticada
em navegador, checagem mobile do PWA e deploy no Cloudflare Pages.
