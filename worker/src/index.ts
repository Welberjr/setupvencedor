export interface Env {}

export default {
  async fetch(request: Request): Promise<Response> {
    if (new URL(request.url).pathname === '/health') return Response.json({ ok: true })
    return Response.json({ error: 'not_found' }, { status: 404 })
  },
} satisfies ExportedHandler<Env>
