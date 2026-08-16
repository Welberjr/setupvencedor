# Cadastro público seguro — Setup Vencedor (staging)

**Status:** conceito aprovado; aguardando revisão desta especificação antes da implementação  
**Ambiente:** somente staging (`ecjcudvhhymtfuwvmnzv`)  
**Produção:** fora de escopo

## Objetivo

Permitir que qualquer pessoa crie gratuitamente uma conta no Setup Vencedor, com
confirmação obrigatória de e-mail e proteção contra abuso. Convites continuam
existindo, mas apenas para equipe, parceiros e alteração de função; eles deixam
de ser a porta principal de entrada.

## Regras de acesso

| Situação | Resultado |
| --- | --- |
| Visitante sem conta | Pode ver as páginas públicas de acesso e iniciar cadastro. |
| Cadastro enviado, e-mail ainda não confirmado | Não recebe sessão utilizável nem acesso ao acervo. Pode reenviar a confirmação dentro dos limites. |
| E-mail confirmado | Perfil passa a `active` com função `member`; acessa somente recursos publicados, seu perfil, favoritos e seus próprios chamados. |
| Convite administrativo | Só usuário autorizado emite; pode conceder função de equipe ou acesso especial. |
| Elevação para `editor`, `manager` ou `admin` | Nunca ocorre pelo cadastro público, pelo navegador ou pelo link de confirmação. |

## Fluxo proposto

1. A pessoa abre `Criar meu acesso` e informa nome, e-mail, senha e aceite de
   termos/privacidade.
2. Ela conclui um desafio Cloudflare Turnstile.
3. O aplicativo envia o token do desafio ao Supabase Auth no cadastro; o
   Supabase o valida no servidor. A chave secreta nunca vai ao navegador.
4. O Supabase envia o e-mail de confirmação para uma URL permitida do staging.
5. Após confirmar, o gatilho de banco ativa o perfil `member` e a pessoa segue
   para a página de boas-vindas.
6. Falhas e expirações mostram uma explicação acionável, sem expor detalhes
   internos ou indicar se determinado e-mail já possui uma conta.

## Controles obrigatórios

### Autenticação e abuso

- Cadastro público habilitado, com confirmação de e-mail obrigatória.
- Turnstile em cadastro, login e recuperação de senha, validado pelo Supabase
  Auth no lado servidor.
- Limites de tentativa, envio e reenvio de e-mail configurados no Supabase;
  mensagens de bloqueio temporário não revelam dados da conta.
- Senhas com mínimo de 8 caracteres e exigência de letras e números.
- URLs de redirecionamento limitadas explicitamente às origens de staging. Não
  haverá fallback para `localhost` em e-mails enviados ao público.

### E-mail transacional

- Antes de abrir o cadastro ao público, configurar SMTP próprio com domínio
  remetente verificado do Setup Vencedor.
- Usar os templates versionados em `supabase/templates/confirmation.html` e
  `supabase/templates/recovery.html` somente depois do SMTP estar configurado.
- O provedor padrão do Supabase serve para teste pontual, mas não para abertura
  pública: possui cota baixa e não permite aplicar os templates personalizados
  neste plano.

### Banco e autorização

- RLS continua estrito: `member` não convida, não muda funções, não edita
  catálogo e não entra na Administração.
- As rotas do Worker exigem perfil ativo e aplicam as autorizações existentes;
  chaves de serviço não são enviadas ao browser.
- Transições automáticas de estado feitas pelos gatilhos internos do Supabase
  permanecem permitidas; alterações humanas de estado/função continuam
  restritas ao administrador.
- Convites são mantidos para equipe e funções elevadas, sempre criados por uma
  pessoa autorizada.

### Consentimento e auditoria

- O cadastro terá checkbox obrigatório para Termos de Uso e Política de
  Privacidade, com versão do texto registrada junto da conta.
- O texto jurídico final deve ser revisado pelo responsável jurídico antes da
  abertura pública; esta implementação não inventará cláusulas legais.
- Registrar eventos de segurança relevantes: cadastro, confirmação,
  reenvio/limitação de e-mail, desafio inválido e mudança administrativa de
  função. Os registros não expõem senha, token nem conteúdo sensível.

## Dados e mudanças previstas

- Migração para consentimento versionado e trilha de eventos de segurança, com
  RLS e retenção definidos.
- Atualização da tela pública de acesso: seleção clara entre entrar e criar
  conta, termos/privacidade, Turnstile, feedback de confirmação e reenvio.
- Configuração de CAPTCHA no Supabase e variáveis públicas de site key no
  deploy de staging; segredo somente no painel seguro do provedor.
- Configuração SMTP no painel do Supabase após o remetente ser verificado.
- Testes de unidade, banco e fluxo manual autenticado no staging.

## Critérios de aceite no staging

1. Um visitante cria conta sem convite e não recebe acesso antes de confirmar o
   e-mail.
2. O link de confirmação abre o domínio de staging, ativa o perfil e leva à
   página de boas-vindas.
3. Um token Turnstile ausente ou inválido impede cadastro, login e recuperação.
4. Um novo membro não consegue abrir Administração, convidar pessoas, editar
   recurso nem mudar a própria função.
5. A confirmação e a recuperação chegam pelo SMTP configurado com identidade
   visual do Setup Vencedor.
6. Testes automatizados e validação manual registram resultados antes de
   qualquer promoção para produção.

## Sequência de rollout

1. Configurar Turnstile e SMTP exclusivamente no staging.
2. Implementar migrações, interface e controles de servidor.
3. Executar testes automatizados e cenários manuais com contas de teste.
4. Aprovar o staging visual e funcionalmente.
5. Repetir a configuração de segredos e aplicar a mesma versão em produção em
   uma etapa separada, somente após aprovação explícita.

## Fora de escopo

- Migração de produção.
- Abertura pública sem SMTP próprio e sem CAPTCHA validado.
- Criação de texto jurídico definitivo sem revisão competente.
- Concessão automática de funções elevadas.
