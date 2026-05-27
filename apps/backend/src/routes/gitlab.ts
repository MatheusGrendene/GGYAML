import { Hono } from 'hono'
import { getGitLabProjects, getGitLabProjectTopLanguage } from '../services/gitlab'

const gitlab = new Hono()

// GET /api/gitlab/repos
gitlab.get('/repos', async (c) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401)
  }

  const token = authHeader.replace('Bearer ', '').trim()

  try {
    const projects = await getGitLabProjects(token)
    return c.json(projects, 200)
  } catch (err: any) {
    return c.json({ error: err.message }, 400)
  }
})

// GET /api/gitlab/language?projectId=:id
gitlab.get('/language', async (c) => {
  const authHeader = c.req.header('Authorization')
  const projectId = c.req.query('projectId')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401)
  }

  if (!projectId) {
    return c.json({ error: 'Missing projectId query parameter' }, 400)
  }

  const token = authHeader.replace('Bearer ', '').trim()

  try {
    const language = await getGitLabProjectTopLanguage(token, projectId)
    return c.json({ language }, 200)
  } catch (err: any) {
    return c.json({ error: err.message }, 400)
  }
})

export default gitlab