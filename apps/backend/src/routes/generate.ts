import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { generateYAML } from '@ggyaml/yaml-generator'
import { wizardSchema } from '../schemas/wizardSchema'

const generate = new Hono()

generate.post('/', zValidator('json', wizardSchema), (c) => {
  const data = c.req.valid('json')
  const yamlContent = generateYAML(data)

  const filename = `${data.projectName || 'pipeline'}.yml`

  return c.body(yamlContent, 200, {
    'Content-Type': 'application/x-yaml',
    'Content-Disposition': `attachment; filename="${filename}"`,
  })
})

export default generate