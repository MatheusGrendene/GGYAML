import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { gitlabConfigSchema } from '../schemas/wizardSchema'
import { pushVariablesToGitLab } from '../services/gitlab'

const variables = new Hono()

variables.post('/', zValidator('json', gitlabConfigSchema), async (c) => {
  const config = c.req.valid('json')

  const result = await pushVariablesToGitLab(config)

  if (!result.success && result.created.length === 0 && result.updated.length === 0) {
    return c.json(
      { error: 'All variables failed to push', details: result.failed },
      500
    )
  }

  return c.json(result, 200)
})

export default variables