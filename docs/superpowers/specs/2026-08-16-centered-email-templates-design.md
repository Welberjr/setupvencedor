# Centralização visual dos e-mails — Setup Vencedor

## Objetivo

Aplicar a mesma composição visual centralizada aos e-mails transacionais do Setup Vencedor em staging e produção. "Centralizar" neste documento significa centralizar logo, marca, título, texto, chamada à ação, aviso de segurança e rodapé dentro do cartão do e-mail. Não altera os fluxos de autenticação nem introduz automações de marketing.

## Escopo

O catálogo terá treze modelos nativos do Supabase Auth:

1. confirmação de cadastro;
2. convite nativo;
3. link mágico ou OTP;
4. alteração de e-mail;
5. recuperação de senha;
6. reautenticação;
7. senha alterada;
8. endereço de e-mail alterado;
9. telefone alterado;
10. método de entrada vinculado;
11. método de entrada removido;
12. método de verificação adicionado;
13. método de verificação removido.

O convite por e-mail enviado pelo Worker via Resend também usará a composição centralizada. Ele permanece um fluxo próprio, porque sua URL de ativação é emitida pelo Worker e não pelo Supabase Auth.

## Arquitetura

Os HTMLs ficam versionados em `supabase/templates/`, um por tipo de mensagem. Cada um usa tabelas de apresentação e estilos inline para compatibilidade com clientes de e-mail. Todos compartilham a mesma estrutura: fundo claro, cartão centralizado, identificação Setup Vencedor, conteúdo centralizado, botão verde e rodapé de segurança.

O Worker recebe um módulo de apresentação de convite. Esse módulo só interpola valores já escapados (nome, e-mail e URL de ativação) e devolve HTML com a mesma estrutura centralizada; a rota, a expiração e a regra de ativação não mudam.

No Supabase hospedado, os treze HTMLs e seus assuntos correspondentes são publicados na página Authentication > Emails. Os sete avisos de segurança são habilitados nessa mesma página. A publicação usa a mesma fonte versionada em staging e produção, sem copiar segredos nem chaves entre ambientes.

## Variáveis e segurança

Cada modelo usa apenas as variáveis permitidas pelo respectivo tipo: `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .Email }}`, `{{ .NewEmail }}`, `{{ .OldEmail }}`, `{{ .Phone }}`, `{{ .OldPhone }}`, `{{ .Provider }}` e `{{ .FactorType }}` quando aplicáveis. Nenhum modelo inclui segredo, senha, token literal ou rastreamento de link. Os CTAs de confirmação continuam apontando para a URL gerada pelo Supabase.

## Ordem de publicação e verificação

1. criar e testar o catálogo e o renderizador de convite no worktree de staging;
2. publicar Worker e templates no staging;
3. conferir os treze modelos no painel e validar visualmente os fluxos principais sem deixar contas temporárias;
4. publicar os mesmos modelos e o Worker em produção;
5. registrar os tipos publicados e os resultados, separando o que foi visualmente conferido do que exigiria um disparo real.

## Fora de escopo

E-mails de boas-vindas, suporte e campanhas não entram nesta mudança, pois não são modelos nativos do Supabase Auth e não devem ser acionados como efeito colateral de um fluxo de autenticação.
