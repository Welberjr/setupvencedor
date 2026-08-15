import { useState } from 'react'
import { appOrigin } from '../../lib/app-origin'
import { createSetupAgentContent, setupAgentTools } from './setup-agent-content'

export function SetupAgentPage() {
  const [message, setMessage] = useState('')
  const content = createSetupAgentContent(appOrigin())

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setMessage(`${label} copiada. O cliente abrirá o navegador para você autorizar a conexão.`)
    } catch {
      setMessage('Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.')
    }
  }

  return <section className="inner-page page-shell setup-agent-page" aria-labelledby="setup-agent-title">
    <header className="setup-agent-intro">
      <p className="eyebrow">SETUP AGENT · CONEXÃO MCP</p>
      <h1 id="setup-agent-title">Conecte seu agente ao acervo.</h1>
      <p>Use o que a equipe já validou antes de começar do zero. A conexão é individual, segura e permite apenas consulta.</p>
    </header>

    <section className="setup-agent-install" aria-labelledby="setup-agent-install-title">
      <div><p className="eyebrow">COMECE POR AQUI</p><h2 id="setup-agent-install-title">Uma conexão, quatro formas de encontrar o caminho.</h2></div>
      <p>Copie a configuração para o seu cliente MCP. Na primeira vez, ele abrirá o navegador para entrar no Setup Vencedor e aprovar o acesso.</p>
      <div className="setup-agent-endpoint"><code>{content.endpoint}</code><button onClick={() => void copy('Endereço do servidor', content.endpoint)} type="button">Copiar link</button></div>
      <button className="setup-agent-primary" onClick={() => void copy('Configuração', content.installPrompt)} type="button">Copiar configuração para Codex</button>
      {message ? <p aria-live="polite" className="setup-agent-message">{message}</p> : null}
    </section>

    <section className="setup-agent-configs" aria-label="Configurações por cliente">
      {content.manualConfigs.map((config) => <article key={config.label}><div><strong>{config.label}</strong><span>{config.language}</span></div><pre><code>{config.code}</code></pre><button aria-label={`Copiar configuração do ${config.label}`} onClick={() => void copy(`Configuração do ${config.label}`, config.code)} type="button">Copiar</button></article>)}
    </section>

    <section className="setup-agent-tools" aria-labelledby="setup-agent-tools-title">
      <div><p className="eyebrow">O QUE O SETUP AGENT FAZ</p><h2 id="setup-agent-tools-title">Consulta. Não altera.</h2></div>
      <div>{setupAgentTools.map((tool, index) => <article key={tool.name}><b>{String(index + 1).padStart(2, '0')}</b><h3>{tool.name}</h3><p>{tool.description}</p><small>SOMENTE LEITURA</small></article>)}</div>
    </section>
  </section>
}
