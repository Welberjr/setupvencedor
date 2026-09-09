"""Recover only public frontend configuration from the deployed JS bundle."""
import re, json, base64
from pathlib import Path
origin = 'https://www.setupvencedor.com.br'
script = Path('.wrangler/production-frontend.js').read_text(encoding='utf-8')
key = None
for token in re.findall(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', script):
    payload = json.loads(base64.urlsafe_b64decode(token.split('.')[1] + '==='))
    if payload.get('role') == 'anon' and payload.get('ref') == 'lroqtkfxkagkmbwuqqzk':
        key = token
        break
if not key:
    public_keys = re.findall(r'sb_publishable_[A-Za-z0-9_-]+', script)
    key = public_keys[0] if public_keys else None
assert key, 'No verified public key in the live frontend'
site_key = re.search(r'0x4[A-Za-z0-9_-]+', script).group()
values = {'VITE_SUPABASE_URL':'https://lroqtkfxkagkmbwuqqzk.supabase.co',
          'VITE_SUPABASE_PUBLISHABLE_KEY':key,
          'VITE_APP_ORIGIN':origin,
          'VITE_WORKER_URL':'https://setup-vencedor-worker.filmesecia-df.workers.dev',
          'VITE_TURNSTILE_SITE_KEY':site_key}
Path('.env.production').write_text('\n'.join(f'{k}={v}' for k,v in values.items())+'\n')
print('Recovered verified PUBLIC frontend configuration; no service keys used.')
