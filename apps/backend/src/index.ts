import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serveStatic } from 'hono/bun' 
import generate from './routes/generate'
import variables from './routes/variables'
import github from './routes/github'
import gitlab from './routes/gitlab'
import { is } from 'zod/locales'

const app = new Hono()
const isProd = process.env.NODE_ENV === 'production'

app.use('*', logger())
if (!isProd) {
  app.use('*', cors({ origin: 'http://localhost:5173' }))
}

app.get('/health', (c) => c.json({ status: 'ok' }))
app.route('/api/generate', generate)
app.route('/api/variables', variables)
app.route('/api/github', github)
app.route('/api/gitlab', gitlab)

if (isProd) {
  app.use('/*', serveStatic({ root: './apps/frontend/dist' }))
  app.get('*', serveStatic({ path: './apps/frontend/dist/index.html' }))
}

export default {
  port: parseInt(process.env.PORT ?? '3001'),
  fetch: app.fetch,
}