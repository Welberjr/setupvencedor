# Centered Email Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the same visually centered transactional-email system for Setup Vencedor in staging and production.

**Architecture:** Store thirteen Supabase Auth HTML templates as the version-controlled source of truth, each built with a table-based, inline-styled centered card. Extract the Resend invitation markup into a small Worker renderer that uses the same centered presentation while preserving its independently generated activation URL. Publish the exact source to the hosted Supabase template editor in staging first and then production.

**Tech Stack:** HTML email tables and inline CSS, Supabase Auth hosted Email Templates, TypeScript, Cloudflare Workers, Resend, Vitest, Wrangler.

**Spec:** `docs/superpowers/specs/2026-08-16-centered-email-templates-design.md`

## Global Constraints

- Modify only `C:\Dev\setup-vencedor-staging` until staging verification has passed; production deployment is explicitly authorized after that check.
- Every visual element inside the e-mail card is center aligned: logo, brand, heading, body, CTA, notice, and footer.
- Preserve the native Supabase placeholder belonging to each message type and do not place API keys, passwords, literal tokens, or tracking links in any template.
- Use direct Supabase `{{ .ConfirmationURL }}` anchors for action links; do not rewrite them through a tracking service.
- Escape all invitation recipient data before inserting it into Worker-generated HTML.
- Do not change the user-account, invitation-expiry, or authentication flow behavior.
- Publish the seven security-notification templates with their project-level toggles enabled in both environments.

---

## File Structure

- `supabase/templates/confirmation.html` — centered signup confirmation template.
- `supabase/templates/invite.html` — centered native Supabase invitation template.
- `supabase/templates/magic-link.html` — centered magic-link/OTP template.
- `supabase/templates/email-change.html` — centered change-email confirmation template.
- `supabase/templates/recovery.html` — centered password-recovery template.
- `supabase/templates/reauthentication.html` — centered reauthentication code template.
- `supabase/templates/password-changed.html` — centered password-change notification.
- `supabase/templates/email-address-changed.html` — centered email-address-change notification.
- `supabase/templates/phone-number-changed.html` — centered phone-number-change notification.
- `supabase/templates/sign-in-method-linked.html` — centered sign-in method added notification.
- `supabase/templates/sign-in-method-removed.html` — centered sign-in method removed notification.
- `supabase/templates/verification-method-added.html` — centered verification-method added notification.
- `supabase/templates/verification-method-removed.html` — centered verification-method removed notification.
- `worker/src/email-template.ts` — HTML-safe Resend invitation presentation renderer.
- `worker/src/email-template.test.ts` — renderer assertions for centering, URL retention, and escaping.
- `worker/src/index.ts` — replaces the inline invitation HTML with the renderer call.
- `supabase/config.toml` — documents every local template type and its subject; hosted publication remains a dashboard action.

## Canonical HTML Contract

Each template must use this fixed outer structure, with the inner heading/body/CTA/notice copied for its message type:

```html
<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#f8f0dc;color:#201f1b;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#f8f0dc;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fffaf0;border:2px solid #201f1b;border-radius:20px;overflow:hidden;text-align:center;">
          <tr><td align="center" style="padding:30px 34px;background:#d8edff;border-bottom:2px dashed #b78056;">
            <img src="https://www.setupvencedor.com.br/brand/setup-vencedor-sv-approved.png" width="54" height="54" alt="Setup Vencedor" style="display:block;margin:0 auto 14px;border-radius:14px;">
            <div style="display:inline-block;padding:10px 13px;border:2px solid #201f1b;border-radius:999px;background:#caff3d;font-family:monospace;font-weight:800;font-size:12px;letter-spacing:1px;">SV · SETUP VENCEDOR</div>
            <h1 style="margin:22px 0 0;font-size:36px;line-height:1.05;letter-spacing:-1px;text-align:center;">TÍTULO DO TIPO</h1>
          </td></tr>
          <tr><td align="center" style="padding:34px;text-align:center;">
            <p style="margin:0 auto 16px;max-width:480px;font-size:17px;line-height:1.6;text-align:center;">CORPO DO TIPO</p>
            <p style="margin:0 0 26px;"><a href="URL DO TIPO" style="display:inline-block;padding:15px 21px;border:2px solid #201f1b;border-radius:12px;background:#caff3d;color:#201f1b;font-weight:800;text-decoration:none;box-shadow:3px 4px 0 #201f1b55;">CTA DO TIPO →</a></p>
            <p style="margin:28px auto 0;padding-top:18px;border-top:1px dashed #b78056;max-width:480px;font-size:12px;line-height:1.5;color:#766d63;text-align:center;">AVISO DO TIPO</p>
          </td></tr>
          <tr><td align="center" style="padding:0 34px 28px;color:#766d63;font-size:11px;line-height:1.5;text-align:center;">Este é um e-mail automático do Setup Vencedor. Nunca pedimos sua senha por e-mail.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>
```

Replace the uppercase literals above with the following exact copy and variables:

| File | Subject | Title | Body / CTA / variable | Notice |
|---|---|---|---|---|
| `confirmation.html` | `Confirme seu acesso ao Setup Vencedor` | `Seu acesso está quase pronto.` | `Falta só confirmar este e-mail para liberar seu acesso ao acervo.` / `Confirmar meu e-mail` / `{{ .ConfirmationURL }}` | `Se você não criou este acesso, pode ignorar esta mensagem.` |
| `invite.html` | `Seu convite para a Comunidade Setup Vencedor` | `Há um lugar reservado para você.` | `Você foi convidado para entrar na Comunidade Setup Vencedor. Crie sua conta e comece pelo acervo.` / `Aceitar convite` / `{{ .ConfirmationURL }}` | `Este convite é pessoal. Se não era esperado, ignore este e-mail.` |
| `magic-link.html` | `Seu link seguro de acesso` | `Aqui está sua chave de entrada.` | `Use este link para entrar com segurança. Ele expira em breve e só pode ser usado uma vez.` / `Entrar no Setup Vencedor` / `{{ .ConfirmationURL }}` | `Não foi você quem pediu? Ignore esta mensagem.` |
| `email-change.html` | `Confirme seu novo e-mail` | `Confirme seu novo endereço.` | `Você pediu para usar um novo endereço na sua conta. Confirme para concluir a alteração.` / `Confirmar novo e-mail` / `{{ .ConfirmationURL }}` | `Se você não solicitou esta alteração, ignore esta mensagem e revise sua conta.` |
| `recovery.html` | `Redefina sua senha` | `Vamos criar uma nova senha.` | `Recebemos um pedido para redefinir a senha da sua conta. Escolha uma nova senha forte.` / `Redefinir minha senha` / `{{ .ConfirmationURL }}` | `Se não foi você, ignore esta mensagem. Sua senha atual continua válida.` |
| `reauthentication.html` | `Código de verificação` | `Confirme que é você.` | `Use o código abaixo para continuar uma ação sensível na sua conta.` / `{{ .Token }}` rendered as a large monospace code, with no link | `O código expira em breve. Não compartilhe este código.` |
| `password-changed.html` | `Sua senha foi alterada` | `Senha alterada.` | `A senha da sua conta foi modificada com sucesso.` / `Abrir o Setup Vencedor` / `{{ .SiteURL }}` | `Não reconhece esta alteração? Redefina sua senha imediatamente.` |
| `email-address-changed.html` | `Seu e-mail foi alterado` | `Endereço atualizado.` | `O endereço de e-mail vinculado à sua conta mudou de {{ .OldEmail }} para {{ .Email }}.` / `Abrir o Setup Vencedor` / `{{ .SiteURL }}` | `Não reconhece esta alteração? Proteja sua conta e fale com o suporte.` |
| `phone-number-changed.html` | `Seu telefone foi alterado` | `Telefone atualizado.` | `O telefone vinculado à sua conta mudou de {{ .OldPhone }} para {{ .Phone }}.` / `Abrir o Setup Vencedor` / `{{ .SiteURL }}` | `Não reconhece esta alteração? Proteja sua conta e fale com o suporte.` |
| `sign-in-method-linked.html` | `Novo método de entrada vinculado` | `Método de entrada adicionado.` | `Um novo método de entrada ({{ .Provider }}) foi vinculado à sua conta.` / `Abrir o Setup Vencedor` / `{{ .SiteURL }}` | `Não foi você? Proteja sua conta e fale com o suporte.` |
| `sign-in-method-removed.html` | `Método de entrada removido` | `Método de entrada removido.` | `Um provedor de entrada ({{ .Provider }}) foi removido da sua conta.` / `Abrir o Setup Vencedor` / `{{ .SiteURL }}` | `Não foi você? Proteja sua conta e fale com o suporte.` |
| `verification-method-added.html` | `Novo método de verificação` | `Verificação reforçada.` | `Um novo método de verificação ({{ .FactorType }}) foi adicionado à sua conta.` / `Abrir o Setup Vencedor` / `{{ .SiteURL }}` | `Não foi você? Proteja sua conta e fale com o suporte.` |
| `verification-method-removed.html` | `Método de verificação removido` | `Verificação removida.` | `Um método de verificação ({{ .FactorType }}) foi removido da sua conta.` / `Abrir o Setup Vencedor` / `{{ .SiteURL }}` | `Não foi você? Proteja sua conta e fale com o suporte.` |

### Task 1: Versioned centered Supabase template catalog

**Files:**
- Create: the eleven missing files listed in File Structure.
- Modify: `supabase/templates/confirmation.html`, `supabase/templates/recovery.html`, `supabase/config.toml`.
- Test: local PowerShell HTML-contract assertion described below.

**Interfaces:**
- Consumes: the 13-row mapping table above and Supabase Go-template variable names.
- Produces: one complete HTML file per dashboard template type and a `config.toml` map that names each file and subject.

- [ ] **Step 1: Write the failing template-contract check**

Run this command from `C:\Dev\setup-vencedor-staging`; it must fail before all files are added:

```powershell
$names = 'confirmation','invite','magic-link','email-change','recovery','reauthentication','password-changed','email-address-changed','phone-number-changed','sign-in-method-linked','sign-in-method-removed','verification-method-added','verification-method-removed'
$names | ForEach-Object {
  $path = "supabase/templates/$_.html"
  if (-not (Test-Path $path)) { throw "missing $path" }
  $html = Get-Content -Raw $path
  if ($html -notmatch 'text-align:center' -or $html -notmatch 'align="center"') { throw "not centered $path" }
  if ($html -notmatch 'Nunca pedimos sua senha') { throw "missing footer $path" }
}
```

- [ ] **Step 2: Run the check and verify it fails**

Run: the command from Step 1.

Expected: `missing supabase/templates/invite.html`.

- [ ] **Step 3: Write the thirteen complete HTML files and uncomment the local configuration map**

Use the Canonical HTML Contract and mapping table verbatim. In `config.toml`, add these exact authentication section names: `confirmation`, `invite`, `magic_link`, `email_change`, `recovery`, and `reauthentication`. Add security notification section names: `password_changed`, `email_changed`, `phone_changed`, `identity_linked`, `identity_unlinked`, `mfa_factor_enrolled`, and `mfa_factor_unenrolled`; set each `enabled = true`, its mapped subject, and the matching `content_path`.

- [ ] **Step 4: Run the contract check and inspect placeholder safety**

Run:

```powershell
$names = 'confirmation','invite','magic-link','email-change','recovery','reauthentication','password-changed','email-address-changed','phone-number-changed','sign-in-method-linked','sign-in-method-removed','verification-method-added','verification-method-removed'
$names | ForEach-Object {
  $html = Get-Content -Raw "supabase/templates/$_.html"
  if ($html -notmatch 'text-align:center' -or $html -notmatch 'align="center"' -or $html -notmatch 'Nunca pedimos sua senha') { throw "template contract failed: $_" }
}
rg -n "(RESEND_API_KEY|SERVICE_ROLE|Bearer |sk_)" supabase/templates supabase/config.toml
```

Expected: the first command completes silently; `rg` returns no secret-like values (exit code 1 is acceptable).

- [ ] **Step 5: Commit the template catalog**

```powershell
git add supabase/templates supabase/config.toml
git commit -m "feat: add centered auth email catalog"
```

### Task 2: Centered Resend invitation renderer

**Files:**
- Create: `worker/src/email-template.ts`, `worker/src/email-template.test.ts`.
- Modify: `worker/src/index.ts:136-151`.
- Test: `worker/src/email-template.test.ts`.

**Interfaces:**
- Consumes: `recipientName: string | null`, `email: string`, and `activationUrl: string`.
- Produces: `renderInvitationEmail(input: { recipientName: string | null; email: string; activationUrl: string }): string`.

- [ ] **Step 1: Write the failing renderer test**

Create `worker/src/email-template.test.ts`:

```ts
import { expect, it } from 'vitest'
import { renderInvitationEmail } from './email-template'

it('renders a centered and escaped invitation with the activation URL intact', () => {
  const html = renderInvitationEmail({
    recipientName: '<Ana & Bruno>',
    email: 'ana@example.com',
    activationUrl: 'https://staging.setupvencedor.com.br/ativar?token=example',
  })

  expect(html).toContain('align="center"')
  expect(html).toContain('text-align:center')
  expect(html).toContain('https://staging.setupvencedor.com.br/ativar?token=example')
  expect(html).toContain('&lt;Ana &amp; Bruno&gt;')
  expect(html).toContain('Nunca pedimos sua senha por e-mail.')
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- --run src/email-template.test.ts` from `worker`.

Expected: FAIL because `./email-template` does not exist.

- [ ] **Step 3: Implement the renderer and switch the Worker to it**

Create this public interface in `worker/src/email-template.ts`:

```ts
type InvitationEmailInput = { recipientName: string | null; email: string; activationUrl: string }

export function renderInvitationEmail(input: InvitationEmailInput): string {
  // Build the canonical centered table layout, escaping recipient name and e-mail.
}
```

The title is `Há um lugar reservado para você.`, the CTA is `Aceitar convite`, and the notice is `Este convite é pessoal, expira em 72 horas e vale somente para <escaped e-mail>.`. In `worker/src/index.ts`, import `renderInvitationEmail` and replace only the existing inline `html:` value in `sendInviteEmail` with `renderInvitationEmail({ recipientName: recipient.recipient_name, email: recipient.email_normalized, activationUrl: url })`. Keep the Resend endpoint, headers, subject, expiry and return value unchanged.

- [ ] **Step 4: Run targeted and full Worker tests**

Run:

```powershell
npm test -- --run src/email-template.test.ts
npm test
npm run check -- --config wrangler.staging.jsonc
```

Expected: all tests pass and Wrangler reports a successful dry run without publishing.

- [ ] **Step 5: Commit the Worker renderer**

```powershell
git add worker/src/email-template.ts worker/src/email-template.test.ts worker/src/index.ts
git commit -m "feat: center invitation email layout"
```

### Task 3: Publish and validate staging templates

**Files:**
- Modify: no additional repository files unless staging validation exposes a reproducible defect.
- Test: Supabase dashboard previews and the deployed staging Worker.

**Interfaces:**
- Consumes: the thirteen versioned HTML files, matching subject table, and staging Worker configuration `worker/wrangler.staging.jsonc`.
- Produces: all staged hosted Auth templates saved and all seven security notifications enabled.

- [ ] **Step 1: Deploy the tested staging Worker**

Run from `worker`:

```powershell
npx wrangler deploy --config wrangler.staging.jsonc
```

Expected: deployment identifies `setup-vencedor-worker-staging` and succeeds without changing production routes.

- [ ] **Step 2: Publish the six authentication templates in staging**

Open `https://supabase.com/dashboard/project/ecjcudvhhymtfuwvmnzv/auth/templates`. For Confirm sign up, Invite user, Magic link or OTP, Change email address, Reset password, and Reauthentication: open the card, paste the corresponding `supabase/templates/*.html` source, set the mapped subject, and save. After each save, reopen the card and confirm the saved subject and source are present.

- [ ] **Step 3: Publish and enable the seven security templates in staging**

On the same page, turn on the switch for Password changed, Email address changed, Phone number changed, Sign-in method linked, Sign-in method removed, Verification method added, and Verification method removed. Open each card, paste the mapped source and subject, save, and reopen once to confirm its switch remains enabled and the content persists.

- [ ] **Step 4: Verify centered rendering and functional anchors**

For Confirm sign up, Reset password, Invite user, and Password changed, use the dashboard preview. Confirm that the logo, heading, paragraph, CTA/code, notice, and footer are centered. Verify each link-based template still contains its expected `{{ .ConfirmationURL }}` or `{{ .SiteURL }}` source placeholder; verify Reauthentication contains `{{ .Token }}` as visible text.

- [ ] **Step 5: Record staging evidence without creating an account**

Record the deployed Worker version, the thirteen saved template names, and seven enabled notification names in the final handoff. Do not send a signup/recovery email or create an account during this step; those actions require a fresh final-step confirmation in the browser.

### Task 4: Publish and validate production templates

**Files:**
- Modify: no additional repository files.
- Test: production dashboard previews and deployed production Worker.

**Interfaces:**
- Consumes: the exact committed catalog that passed staging validation and `worker/wrangler.jsonc`.
- Produces: the same thirteen hosted templates and seven enabled security notifications in the production Supabase project.

- [ ] **Step 1: Confirm the production project and Worker target before any write**

Run from `worker`:

```powershell
npx wrangler deploy --dry-run --config wrangler.jsonc
```

Expected: output names `setup-vencedor-worker` and only the canonical production routes under `setupvencedor.com.br`.

- [ ] **Step 2: Deploy the production Worker**

Run from `worker`:

```powershell
npx wrangler deploy --config wrangler.jsonc
```

Expected: deployment succeeds for `setup-vencedor-worker`; no staging route appears in the result.

- [ ] **Step 3: Publish the thirteen exact templates in the production Supabase dashboard**

Open the production project's Authentication > Emails page, use the same file-to-template map and exact subjects from Task 1, and enable the same seven notification switches. After saving each card, reopen it to verify the content is retained. Do not copy template HTML from staging manually; read the committed local source so both environments use the same version.

- [ ] **Step 4: Verify production previews and report parity**

Preview Confirm sign up, Reset password, Invite user, and Password changed. Confirm centered layout and required placeholders. Compare the saved production subjects and sources against the committed local catalog; report any dashboard normalization separately rather than changing the source to hide it.

- [ ] **Step 5: Commit only if validation required a source correction**

If no source correction was needed, do not create an empty commit. If one was needed, run the relevant tests and commit with a specific `fix:` message before finishing.

## Plan Self-Review

- Spec coverage: Tasks 1-2 version and implement the centered catalog and Worker invite; Task 3 publishes and verifies staging; Task 4 publishes and verifies production; the scope exclusion for welcome/support remains untouched.
- Placeholder scan: no pending markers, omitted message types, unassigned variable types, or generic testing steps remain.
- Type consistency: `renderInvitationEmail` accepts `recipientName`, `email`, and `activationUrl`; Task 2 and the Worker call use exactly those names.
