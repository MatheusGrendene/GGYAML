# 🚀 Deployment Action Plan — ggyaml

> **Recomendação:** [Render.com](https://render.com) com Docker  
> **Estratégia:** O Hono (backend) serve tanto a API quanto os arquivos estáticos do React em produção — **um único serviço, uma única URL**.

---

## Por que Render?

| Critério | Render |
|---|---|
| Gratuito | ✅ Free tier permanente |
| Single host | ✅ Um serviço para tudo |
| Suporta Bun | ✅ Via Docker (oficial: `oven/bun`) |
| CI/CD automático | ✅ Deploy automático ao fazer push |
| Complexidade | ✅ Baixa — sem Kubernetes, sem lambdas |
| Limitação | ⚠️ Serviço "dorme" após 15min sem tráfego (cold start ~30s) — aceitável para baixo tráfego |

> Alternativa: [Railway.app](https://railway.app) — sem sleep, mas o crédito gratuito de $5/mês se esgota com o tempo.

---

## Arquitetura Pós-Deploy

```
[Navegador]
    │
    ▼
render.com/your-url
    │
    ├── GET /*         → Hono serve os arquivos estáticos do React (apps/frontend/dist/)
    └── POST /api/*    → Hono processa as rotas da API
```

Em vez de dois servidores separados, o próprio Hono serve o frontend buildado. Isso elimina CORS em produção e simplifica o deploy.

---

## Fase 1 — Mudanças no Código

### ⚡ Passo 1: Configurar proxy no Vite (dev) e URLs relativas no frontend

**Problema:** O frontend chama `http://localhost:3001/api/...` em todo lugar. Em produção, isso quebraria.

**Solução:** Usar URLs relativas (`/api/...`) + proxy do Vite para desenvolvimento.

**Arquivo:** `apps/frontend/vite.config.ts`
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001', // dev only — Vite redireciona para o backend
    },
  },
})
```
> Ref: https://vite.dev/config/server-options#server-proxy

**Arquivos a alterar** (buscar e substituir):

| Arquivo | De | Para |
|---|---|---|
| `apps/frontend/src/App.tsx` | `http://localhost:3001/api/generate` | `/api/generate` |
| `apps/frontend/src/App.tsx` | `http://localhost:3001/api/variables` | `/api/variables` |
| `apps/frontend/src/App.tsx` | `http://localhost:3001/api/github/secrets` | `/api/github/secrets` |
| `apps/frontend/src/App.tsx` | `http://localhost:3001/api/github/variables` | `/api/github/variables` |
| `apps/frontend/src/steps/StepGitLabConnect.tsx` | `http://localhost:3001/api/gitlab/repos` | `/api/gitlab/repos` |
| `apps/frontend/src/steps/StepGitLabConnect.tsx` | `http://localhost:3001/api/gitlab/language` | `/api/gitlab/language` |

---

### ⚡ Passo 2: Atualizar o backend (`apps/backend/src/index.ts`)

Três mudanças: porta dinâmica via `PORT` env var, CORS só em dev, servir arquivos estáticos em produção.

```ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serveStatic } from 'hono/bun' // ← adicionar import
import generate from './routes/generate'
import variables from './routes/variables'
import github from './routes/github'
import gitlab from './routes/gitlab'

const app = new Hono()
const isProd = process.env.NODE_ENV === 'production' // ← adicionar

app.use('*', logger())

// CORS só é necessário em dev (origens diferentes: :5173 vs :3001)
// Em produção, frontend e backend são a mesma origem — sem CORS
if (!isProd) {
  app.use('*', cors({ origin: 'http://localhost:5173' }))
}

app.get('/health', (c) => c.json({ status: 'ok' }))
app.route('/api/generate', generate)
app.route('/api/variables', variables)
app.route('/api/github', github)
app.route('/api/gitlab', gitlab)

// Em produção: servir o frontend buildado
if (isProd) {
  app.use('/*', serveStatic({ root: './apps/frontend/dist' }))
  // Fallback para SPA (client-side routing)
  app.get('*', serveStatic({ path: './apps/frontend/dist/index.html' }))
}

export default {
  port: parseInt(process.env.PORT ?? '3001'), // ← PORT dinâmica (Render injeta isso)
  fetch: app.fetch,
}
```

> Ref: https://hono.dev/docs/getting-started/bun#serve-static-files  
> Ref: https://hono.dev/docs/middleware/builtin/serve-static

---

### ⚡ Passo 3: Adicionar script `start` no `package.json` raiz

```json
{
  "name": "ggyaml",
  "private": true,
  "packageManager": "bun@1.3.9",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "start": "bun run apps/backend/src/index.ts", // ← adicionar
    "lint": "turbo lint"
  },
  "devDependencies": {
    "turbo": "latest"
  }
}
```

---

## Fase 2 — Arquivos de Infraestrutura

### ⚡ Passo 4: Criar `Dockerfile` na raiz do projeto

```dockerfile
FROM oven/bun:1.3-alpine

WORKDIR /app

# Copia tudo para o container
COPY . .

# Instala dependências de todas as workspaces
RUN bun install --frozen-lockfile

# Builda o frontend (turbo build → vite build → apps/frontend/dist/)
RUN bun run build

EXPOSE 3001

# Inicia o backend (que também serve o frontend)
CMD ["bun", "run", "apps/backend/src/index.ts"]
```

> Ref: https://hub.docker.com/r/oven/bun (imagem oficial Bun)  
> Ref: https://bun.sh/guides/ecosystem/docker

---

### ⚡ Passo 5: Criar `.dockerignore` na raiz do projeto

Evita copiar `node_modules` locais e arquivos desnecessários para o container:

```
node_modules
apps/*/node_modules
packages/*/node_modules
apps/frontend/dist
.git
.gitignore
*.md
tui.json
**/tui.json
.env*
```

---

### ⚡ Passo 6: Criar `render.yaml` na raiz do projeto

Infrastructure as Code para o Render — permite configurar o serviço via arquivo no repositório:

```yaml
services:
  - type: web
    name: ggyaml
    runtime: docker
    dockerfilePath: ./Dockerfile
    plan: free
    envVars:
      - key: NODE_ENV
        value: production
      # O Render injeta PORT automaticamente — não precisa declarar aqui
```

> Ref: https://render.com/docs/infrastructure-as-code  
> Ref: https://render.com/docs/docker

---

## Fase 3 — Testar Localmente (Antes de Fazer Deploy)

Simule o ambiente de produção na sua máquina:

```bash
# 1. Build completo (frontend + pacotes)
bun run build

# 2. Iniciar o servidor em modo produção
NODE_ENV=production bun run apps/backend/src/index.ts

# 3. Abrir http://localhost:3001
# O React deve carregar servido pelo Hono
```

Se o app carregar corretamente e as chamadas de API funcionarem, está pronto para deploy.

---

## Fase 4 — Deploy no Render

### Passo 7: Criar conta no Render
1. Acesse [render.com](https://render.com)
2. Cadastre-se com GitHub ou GitLab (mesmo provedor do seu repositório)

### Passo 8: Criar um novo Web Service
1. No dashboard, clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório GitHub ou GitLab
3. Selecione o repositório `ggyaml`

### Passo 9: Configurar o serviço
O Render detectará o `render.yaml` automaticamente. Se não detectar, configure manualmente:

| Campo | Valor |
|---|---|
| **Name** | `ggyaml` (ou o nome que preferir) |
| **Runtime** | `Docker` |
| **Dockerfile Path** | `./Dockerfile` |
| **Plan** | `Free` |

Nas **Environment Variables**, adicione:
```
NODE_ENV = production
```

### Passo 10: Deploy
1. Clique em **"Create Web Service"**
2. O Render irá:
   - Clonar o repositório
   - Executar `docker build`
   - Rodar `bun install && bun run build` (dentro do Docker)
   - Iniciar o container com `bun run apps/backend/src/index.ts`
3. Após alguns minutos, a URL estará disponível: `https://ggyaml.onrender.com`

---

## Fase 5 — CI/CD Automático (Opcional, mas Recomendado)

Após o primeiro deploy, o Render redeploya automaticamente a cada push na branch `main`.

Se quiser controle extra, adicione um `render.yaml` job que rode lint + build antes de deploy:

```yaml
# render.yaml (versão com health check)
services:
  - type: web
    name: ggyaml
    runtime: docker
    dockerfilePath: ./Dockerfile
    plan: free
    healthCheckPath: /health   # ← usa sua rota existente GET /health
    envVars:
      - key: NODE_ENV
        value: production
```

> A rota `/health` já existe no seu backend — ótimo! O Render vai monitorá-la.

---

## Resumo das Mudanças no Código

```
ggyaml/
├── Dockerfile                        ← NOVO
├── .dockerignore                     ← NOVO
├── render.yaml                       ← NOVO
├── package.json                      ← EDITAR: adicionar script "start"
├── apps/
│   ├── frontend/
│   │   ├── vite.config.ts            ← EDITAR: adicionar proxy
│   │   └── src/
│   │       ├── App.tsx               ← EDITAR: URLs relativas
│   │       └── steps/
│   │           └── StepGitLabConnect.tsx ← EDITAR: URLs relativas
│   └── backend/
│       └── src/
│           └── index.ts              ← EDITAR: PORT dinâmica, CORS condicional, serveStatic
```

**Total: 3 arquivos novos, 4 arquivos editados.** Sem overengineering, sem cloud complexo. 🎯

---

## Referências

- Render Docs: https://render.com/docs
- Render Free Tier: https://render.com/docs/free
- Hono + Bun: https://hono.dev/docs/getting-started/bun
- Hono ServeStatic: https://hono.dev/docs/middleware/builtin/serve-static
- Vite Proxy: https://vite.dev/config/server-options#server-proxy
- Bun Docker (oven/bun): https://hub.docker.com/r/oven/bun
- Turborepo Build: https://turbo.build/repo/docs/crafting-your-repository/running-tasks