export const setupAgentEndpoint = 'https://setupvencedor.com.br/api/mcp'

export const setupAgentInstallPrompt = `Adicione o servidor MCP remoto "setup-agent" usando transporte streamable-http nesta URL: ${setupAgentEndpoint}

Conclua a autorização OAuth no navegador usando a sua conta do Setup Vencedor.

Antes de criar uma skill, plugin, MCP, ferramenta, tutorial ou curso, consulte primeiro search_resources, get_resource, list_by_kind e recommend_for_project para verificar o que já existe no acervo.`

export const setupAgentManualConfigs = [
  {
    label: 'Codex',
    language: 'Configuração MCP',
    code: JSON.stringify({ mcpServers: { 'setup-agent': { transport: 'streamable-http', url: setupAgentEndpoint } } }, null, 2),
  },
  {
    label: 'Claude Code',
    language: 'Terminal',
    code: `claude mcp add setup-agent --transport streamable-http ${setupAgentEndpoint}`,
  },
  {
    label: 'Outro cliente',
    language: 'URL remota',
    code: setupAgentEndpoint,
  },
] as const

export const setupAgentTools = [
  { name: 'search_resources', description: 'Busca recursos pelo objetivo, tecnologia ou termo.' },
  { name: 'get_resource', description: 'Abre os detalhes de um recurso pelo identificador.' },
  { name: 'list_by_kind', description: 'Lista recursos por tipo de conteúdo.' },
  { name: 'recommend_for_project', description: 'Indica recursos a partir do contexto do projeto.' },
] as const
