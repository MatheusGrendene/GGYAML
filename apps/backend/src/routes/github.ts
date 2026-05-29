import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { getGitHubRepos, pushSecretsToGitHub, pushVariablesToGitHub } from '../services/github'
import { githubSecretsConfigSchema, githubVariablesConfigSchema } from '../schemas/wizardSchema'

const github = new Hono()

// GET /api/github/repos
github.get('/repos', async (c) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401)
  }

  const token = authHeader.replace('Bearer ', '').trim()

  try {
    const repos = await getGitHubRepos(token)
    return c.json(repos, 200)
  } catch (err: any) {
    return c.json({ error: err.message }, 400)
  }
})

// POST /api/github/secrets
// Receives plain text values — encryption happens here in the service
github.post('/secrets', zValidator('json', githubSecretsConfigSchema), async (c) => {
  const config = c.req.valid('json')

  const result = await pushSecretsToGitHub(config)

  if (!result.success && result.pushed.length === 0) {
    return c.json({ error: 'All secrets failed to push', details: result.failed }, 500)
  }

  return c.json(result, 200)
})

// POST /api/github/variables — no encryption needed
github.post('/variables', zValidator('json', githubVariablesConfigSchema), async (c) => {
  const config = c.req.valid('json')

  const result = await pushVariablesToGitHub(config)

  if (!result.success && result.pushed.length === 0) {
    return c.json({ error: 'All variables failed to push', details: result.failed }, 500)
  }

  return c.json(result, 200)
})

github.get('/public-key', async (c) => {
  const authHeader = c.req.header('Authorization')
  const owner = c.req.query('owner')
  const repo  = c.req.query('repo')

  if (!authHeader || !owner || !repo) {
    return c.json({ error: 'Missing required parameters' }, 400)
  }

  const token = authHeader.replace('Bearer ', '').trim()

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/secrets/public-key`,
    { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' } }
  )

  if (!res.ok) return c.json({ error: 'Failed to fetch public key' }, 400)

  return c.json(await res.json())
})

export default github