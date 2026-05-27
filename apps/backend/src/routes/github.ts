import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { githubSecretsConfigSchema } from '../schemas/wizardSchema'
import { getGitHubRepos, pushSecretsToGitHub } from '../services/github'

const github = new Hono()

// GET /api/github/repos
// Token is passed in Authorization header: "Bearer <token>"
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
github.post('/secrets', zValidator('json', githubSecretsConfigSchema), async (c) => {
  const { token, owner, repo, secrets } = c.req.valid('json')

  const results = await Promise.all(secrets.map(async (s) => {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/secrets/${s.key}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ encrypted_value: s.encryptedValue, key_id: s.keyId })
      }
    )
    return { key: s.key, success: res.status === 201 || res.status === 204 }
  }))

  return c.json({ results })
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