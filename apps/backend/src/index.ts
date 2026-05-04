import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import generate from './routes/generate'
import variables from './routes/variables'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({ origin: 'http://localhost:5173' }))

app.get('/health', (c) => c.json({ status: 'ok' }))
app.route('/api/generate', generate)
app.route('/api/variables', variables)

export default {
  port: 3001,
  fetch: app.fetch,
}